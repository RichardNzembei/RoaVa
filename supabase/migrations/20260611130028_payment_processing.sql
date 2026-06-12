-- Roava — payment processing functions (M4). The hard, money-touching core.
-- These enforce the non-negotiables (CLAUDE.md §4): pending-until-callback,
-- webhook idempotency, and never orphaning a paid booking. They run only via
-- the service role (server-side payment writes), never from clients.
--
-- Idempotency model: each function locks the payment row FOR UPDATE and acts
-- ONLY on the expected prior state, so a retried callback is a safe no-op.

set check_function_bodies = off;

-- Confirm a successful payment: mark payment success, confirm the booking.
-- Idempotent — a repeat success callback returns the booking id without
-- re-applying. Returns NULL for an unknown provider_ref.
create or replace function public.confirm_booking_payment(
  p_provider_ref text,
  p_raw jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
begin
  select * into v_pay from public.payments
    where provider_ref = p_provider_ref
    for update;

  if not found then
    return null; -- unknown reference; caller logs and 200s the webhook
  end if;

  -- Only transition from pending → success once.
  if v_pay.status = 'pending' then
    update public.payments
      set status = 'success', failure_reason = null, raw_callback = p_raw
      where id = v_pay.id;

    update public.bookings
      set status = 'confirmed'
      where id = v_pay.booking_id and status <> 'cancelled';
  end if;

  return v_pay.booking_id;
end;
$$;

-- Fail a payment: mark failed, cancel the still-pending booking, and RELEASE
-- the reserved capacity exactly once. Never touches a confirmed booking.
create or replace function public.fail_booking_payment(
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
  v_pay public.payments%rowtype;
  v_bk public.bookings%rowtype;
begin
  select * into v_pay from public.payments
    where provider_ref = p_provider_ref
    for update;

  if not found then
    return null;
  end if;

  -- Only act on a still-pending payment; success is terminal and protected.
  if v_pay.status = 'pending' then
    update public.payments
      set status = 'failed', failure_reason = p_reason, raw_callback = p_raw
      where id = v_pay.id;

    select * into v_bk from public.bookings
      where id = v_pay.booking_id for update;

    if found and v_bk.status = 'pending' then
      update public.bookings set status = 'cancelled' where id = v_bk.id;
      perform public.release_slot(v_bk.slot_id, v_bk.party_size);
    end if;
  end if;

  return v_pay.booking_id;
end;
$$;

-- Expire a stale pending booking when no callback ever arrives (the poll/
-- reconciliation fallback decides when to call this). Same release-once safety.
create or replace function public.expire_pending_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bk public.bookings%rowtype;
begin
  select * into v_bk from public.bookings where id = p_booking_id for update;
  if not found or v_bk.status <> 'pending' then
    return false;
  end if;

  update public.bookings set status = 'cancelled' where id = v_bk.id;
  perform public.release_slot(v_bk.slot_id, v_bk.party_size);

  update public.payments
    set status = 'failed', failure_reason = 'timeout'
    where booking_id = v_bk.id and status = 'pending';

  return true;
end;
$$;

-- Trusted, money-touching operations — service role only.
revoke execute on function public.confirm_booking_payment(text, jsonb) from public, anon, authenticated;
revoke execute on function public.fail_booking_payment(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.expire_pending_booking(uuid) from public, anon, authenticated;
