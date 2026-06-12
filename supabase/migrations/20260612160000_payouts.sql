-- Roava — operator payouts / disbursement (the "settle to operator" half of the
-- non-custodial money model, CLAUDE.md §3). Mirrors the collect-side design:
-- a per-booking ledger row, idempotent provider_ref, and security-definer
-- functions that own all the money-touching state transitions.
--
-- Symmetry with payments (…_payment_processing.sql): initiate creates a PENDING
-- payout, the provider B2C call attaches a provider_ref, and the disbursement is
-- only marked 'paid' on the callback (pending-until-callback). Every transition
-- locks the row FOR UPDATE and acts only on the expected prior state, so a
-- retried callback is a safe no-op. We never hold funds — these rows are a
-- record of provider→operator settlement, not a wallet.

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- payouts — one disbursement per booking (operator's net share)
-- ---------------------------------------------------------------------------
-- Reuses payment_status (pending/success/failed) for the attempt's own state;
-- bookings.payout_status stays the booking-level aggregate (the operator UI
-- reads it): not_applicable → pending → paid/failed.
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  operator_id uuid not null references public.operators (id) on delete cascade,
  provider text not null default 'intasend',
  provider_ref text,
  -- Operator share = booking.amount_kes − commission_kes, computed server-side.
  amount_kes integer not null check (amount_kes >= 0),
  -- Destination M-Pesa number, snapshotted at initiation.
  msisdn text not null,
  status public.payment_status not null default 'pending',
  failure_reason text,
  raw_callback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotency: a given provider reference is processed exactly once.
create unique index payouts_provider_ref_uniq
  on public.payouts (provider, provider_ref)
  where provider_ref is not null;
create index payouts_operator_idx on public.payouts (operator_id);
create index payouts_status_idx on public.payouts (status);

create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — operators read their own payout records; writes are service-role only
-- (money-touching, exactly like payments). Default-deny: no insert/update/delete
-- policies for clients.
-- ---------------------------------------------------------------------------
alter table public.payouts enable row level security;

create policy payouts_select_own on public.payouts
  for select using (public.owns_operator(operator_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- initiate_payout — create/refresh a PENDING payout for a completed booking.
-- Enforces ownership (the booking's experience must belong to p_operator_id),
-- requires the booking to be 'completed', and requires a payout MSISDN on file.
-- Idempotent: an already pending/paid payout is returned unchanged; a previously
-- 'failed' one is reset to pending for a fresh attempt. Returns the payout id,
-- or NULL when not eligible (not owner / not completed / already in flight done /
-- no payout number).
-- ---------------------------------------------------------------------------
create or replace function public.initiate_payout(
  p_booking_id uuid,
  p_operator_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bk public.bookings%rowtype;
  v_operator_id uuid;
  v_msisdn text;
  v_net integer;
  v_payout public.payouts%rowtype;
begin
  select * into v_bk from public.bookings where id = p_booking_id for update;
  if not found then
    return null;
  end if;

  -- Ownership: the booking's experience must belong to the calling operator.
  select e.operator_id into v_operator_id
    from public.experiences e
    where e.id = v_bk.experience_id;
  if v_operator_id is distinct from p_operator_id then
    return null;
  end if;

  -- Only completed (attended) bookings are payable.
  if v_bk.status <> 'completed' then
    return null;
  end if;

  -- Need a destination number on file.
  select payout_msisdn into v_msisdn
    from public.operator_payouts
    where operator_id = v_operator_id;
  if v_msisdn is null or length(v_msisdn) = 0 then
    return null;
  end if;

  v_net := greatest(0, v_bk.amount_kes - v_bk.commission_kes);

  select * into v_payout from public.payouts
    where booking_id = p_booking_id for update;

  if found then
    -- Already paid or in flight → no-op, return as-is.
    if v_payout.status in ('pending', 'success') then
      return v_payout.id;
    end if;
    -- Previously failed → reset for a new attempt.
    update public.payouts
      set status = 'pending',
          provider_ref = null,
          failure_reason = null,
          raw_callback = null,
          amount_kes = v_net,
          msisdn = v_msisdn
      where id = v_payout.id;
  else
    insert into public.payouts (booking_id, operator_id, amount_kes, msisdn, status)
      values (p_booking_id, v_operator_id, v_net, v_msisdn, 'pending')
      returning * into v_payout;
  end if;

  update public.bookings
    set payout_status = 'pending'
    where id = p_booking_id;

  return v_payout.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- confirm_payout — provider confirmed the B2C settlement. Idempotent: only the
-- pending→success transition fires; booking aggregate becomes 'paid'.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_payout(
  p_provider_ref text,
  p_raw jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.payouts%rowtype;
begin
  select * into v_payout from public.payouts
    where provider_ref = p_provider_ref for update;
  if not found then
    return null;
  end if;

  if v_payout.status = 'pending' then
    update public.payouts
      set status = 'success', failure_reason = null, raw_callback = p_raw
      where id = v_payout.id;
    update public.bookings
      set payout_status = 'paid'
      where id = v_payout.booking_id;
  end if;

  return v_payout.booking_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- fail_payout — provider reported the disbursement failed. Idempotent: only
-- pending→failed; booking aggregate becomes 'failed' so the operator can retry.
-- ---------------------------------------------------------------------------
create or replace function public.fail_payout(
  p_provider_ref text,
  p_reason text,
  p_raw jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.payouts%rowtype;
begin
  select * into v_payout from public.payouts
    where provider_ref = p_provider_ref for update;
  if not found then
    return null;
  end if;

  if v_payout.status = 'pending' then
    update public.payouts
      set status = 'failed', failure_reason = p_reason, raw_callback = p_raw
      where id = v_payout.id;
    update public.bookings
      set payout_status = 'failed'
      where id = v_payout.booking_id;
  end if;

  return v_payout.booking_id;
end;
$$;

-- Trusted, money-touching operations — service role only (it bypasses these
-- grants; clients are denied even though RLS already blocks table writes).
revoke execute on function public.initiate_payout(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.confirm_payout(text, jsonb) from public, anon, authenticated;
revoke execute on function public.fail_payout(text, text, jsonb) from public, anon, authenticated;
