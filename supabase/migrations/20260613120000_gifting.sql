-- Diaspora/gifting (v2 demand channel, smallest slice): buy a booking for
-- someone else; the recipient redeems a code and the booking + ticket become
-- theirs. Deliberately ADDITIVE — reuses bookings/tickets/capacity/payments
-- and the non-custodial money flow unchanged (see roava-corporate-diaspora-plan.md).

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  buyer_profile_id uuid not null references public.profiles (id),
  recipient_phone text,
  recipient_email text,
  message text,
  -- short, human-shareable claim code; the code itself is the entitlement.
  redemption_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  claimed_by_profile_id uuid references public.profiles (id),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  -- must be reachable on at least one channel to be notified.
  constraint gifts_recipient_present check (recipient_phone is not null or recipient_email is not null)
);

create index gifts_buyer_idx on public.gifts (buyer_profile_id);
create index gifts_claimed_by_idx on public.gifts (claimed_by_profile_id);

alter table public.gifts enable row level security;

-- The buyer sees gifts they bought; the claimer sees gifts they redeemed.
-- (Pre-claim lookup by code happens via the service role in the claim flow,
-- not via RLS, so the code stays the sole entitlement.)
create policy gifts_select_involved on public.gifts
  for select using (
    buyer_profile_id = auth.uid()
    or claimed_by_profile_id = auth.uid()
    or public.is_admin()
  );
-- No client insert/update/delete: gifts are created server-side when a gift
-- booking is paid, and claimed only through claim_gift().

-- Redeem a gift: the holder of the code claims it, becoming the booking's
-- consumer so the ticket appears in their wallet via the existing RLS. The
-- buyer keeps their record via gifts.buyer_profile_id. Idempotent-safe: a
-- second claim of an already-claimed gift returns its status without changing
-- ownership.
create or replace function public.claim_gift(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.gifts%rowtype;
  b_status public.booking_status;
  claimer uuid := auth.uid();
begin
  if claimer is null then
    return 'unauthenticated';
  end if;

  select * into g from public.gifts
  where upper(redemption_code) = upper(trim(p_code))
  for update;

  if not found then
    return 'invalid';
  end if;

  -- Only confirmed bookings have a ticket to hand over.
  select status into b_status from public.bookings where id = g.booking_id;
  if b_status is distinct from 'confirmed' and b_status is distinct from 'completed' then
    return 'not_ready';
  end if;

  if g.claimed_by_profile_id is not null then
    -- already claimed; report whether it was this user (so the UI can route).
    return case when g.claimed_by_profile_id = claimer then 'already_yours' else 'already_claimed' end;
  end if;

  update public.bookings set consumer_profile_id = claimer where id = g.booking_id;
  update public.gifts
    set claimed_by_profile_id = claimer, claimed_at = now()
  where id = g.id;

  return 'ok';
end;
$$;
