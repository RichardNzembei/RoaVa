-- Roava — initial schema (M0).
-- Core marketplace tables, enums, indexes, the updated_at trigger, the
-- new-user trigger, and the ATOMIC capacity-reservation functions.
-- RLS is enabled and policed in the companion migration (…_init_rls.sql).
--
-- Money is stored as whole Kenyan shillings (integer KES); M-Pesa transacts in
-- whole shillings. Never trust a client-supplied amount — always recompute from
-- the slot server-side before charging (CLAUDE.md §3).

set check_function_bodies = off;

-- gen_random_uuid() lives in pgcrypto.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('consumer', 'operator', 'admin');
create type public.experience_status as enum ('draft', 'published', 'archived');
create type public.slot_status as enum ('open', 'closed', 'cancelled');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.payout_status as enum ('not_applicable', 'pending', 'paid', 'failed');
create type public.payment_status as enum ('pending', 'success', 'failed');
create type public.ticket_status as enum ('valid', 'used', 'void');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — extends auth.users (1:1)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  name text,
  role public.user_role not null default 'consumer',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'sw')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when an auth user is created (phone-OTP
-- sign-up). Name is captured on first sign-in; role defaults to consumer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- operators — public business profile (one per operator owner)
-- ---------------------------------------------------------------------------
create table public.operators (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null unique references public.profiles (id) on delete cascade,
  business_name text not null,
  bio text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger operators_set_updated_at
  before update on public.operators
  for each row execute function public.set_updated_at();

-- Payout details kept separate so the payout MSISDN is never world-readable
-- (operators are publicly listed; their payout number must not be). Readable
-- only by the owner and the service role.
create table public.operator_payouts (
  operator_id uuid primary key references public.operators (id) on delete cascade,
  payout_msisdn text,
  updated_at timestamptz not null default now()
);

create trigger operator_payouts_set_updated_at
  before update on public.operator_payouts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- experiences — the listing
-- ---------------------------------------------------------------------------
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators (id) on delete cascade,
  title text not null,
  description text,
  category text,
  county text,
  area text,
  lat double precision,
  lng double precision,
  meeting_point text,
  images text[] not null default '{}',
  base_price_kes integer not null check (base_price_kes >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  max_party_size integer not null default 10 check (max_party_size > 0),
  cancellation_policy text,
  status public.experience_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index experiences_status_idx on public.experiences (status);
create index experiences_operator_idx on public.experiences (operator_id);
create index experiences_county_status_idx on public.experiences (county, status);
create index experiences_category_idx on public.experiences (category);

create trigger experiences_set_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- availability_slots — the bookable unit (many per experience)
-- ---------------------------------------------------------------------------
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  start_at timestamptz not null,
  capacity integer not null check (capacity >= 0),
  booked_count integer not null default 0,
  price_override integer check (price_override is null or price_override >= 0),
  status public.slot_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Belt-and-suspenders: capacity can never be oversold even if app logic errs.
  constraint slot_capacity_not_oversold check (booked_count >= 0 and booked_count <= capacity)
);

create index slots_experience_start_idx on public.availability_slots (experience_id, start_at);
create index slots_start_idx on public.availability_slots (start_at);
create index slots_status_idx on public.availability_slots (status);

create trigger slots_set_updated_at
  before update on public.availability_slots
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings — created pending; confirmed only on payment callback (§6)
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id),
  slot_id uuid not null references public.availability_slots (id),
  consumer_profile_id uuid not null references public.profiles (id),
  party_size integer not null check (party_size > 0),
  amount_kes integer not null check (amount_kes >= 0),
  commission_kes integer not null default 0 check (commission_kes >= 0),
  status public.booking_status not null default 'pending',
  payout_status public.payout_status not null default 'not_applicable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_consumer_idx on public.bookings (consumer_profile_id);
create index bookings_experience_idx on public.bookings (experience_id);
create index bookings_slot_idx on public.bookings (slot_id);
create index bookings_status_idx on public.bookings (status);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payments — one row per attempt; raw callback stored for reconciliation (§4.3)
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  provider text not null default 'intasend',
  provider_ref text,
  amount_kes integer not null check (amount_kes >= 0),
  status public.payment_status not null default 'pending',
  failure_reason text,
  raw_callback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotency: a given provider reference is processed exactly once. Multiple
-- NULLs are allowed (before the provider returns a ref); each real ref is unique.
create unique index payments_provider_ref_uniq
  on public.payments (provider, provider_ref)
  where provider_ref is not null;
create index payments_booking_idx on public.payments (booking_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tickets — signed single-use QR, one per booking (§4.4)
-- ---------------------------------------------------------------------------
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  -- Signed payload presented as the QR. The HMAC secret is server-only.
  qr_payload text not null,
  -- Per-ticket nonce mixed into the HMAC to block forgery/replay.
  nonce text not null,
  status public.ticket_status not null default 'valid',
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reviews — only from completed bookings (policed in RLS)
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  consumer_profile_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_experience_idx on public.reviews (experience_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- wishlist
-- ---------------------------------------------------------------------------
create table public.wishlist (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  experience_id uuid not null references public.experiences (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, experience_id)
);

-- ---------------------------------------------------------------------------
-- ATOMIC capacity reservation (CLAUDE.md §4.1)
-- ---------------------------------------------------------------------------
-- Single conditional UPDATE: two users grabbing the last seat can never both
-- succeed. Returns true iff the seats were reserved. Callers (service role,
-- M4) reserve before initiating payment and release on failure/timeout.
create or replace function public.reserve_slot(p_slot_id uuid, p_qty integer)
returns boolean
language plpgsql
as $$
declare
  affected integer;
begin
  if p_qty <= 0 then
    raise exception 'reserve_slot: quantity must be positive (got %)', p_qty;
  end if;

  update public.availability_slots
    set booked_count = booked_count + p_qty
    where id = p_slot_id
      and status = 'open'
      and booked_count + p_qty <= capacity;

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

-- Releases a hold when payment fails, times out, or a booking is cancelled.
-- Clamped at zero so a double-release can never drive the count negative.
create or replace function public.release_slot(p_slot_id uuid, p_qty integer)
returns void
language plpgsql
as $$
begin
  if p_qty <= 0 then
    raise exception 'release_slot: quantity must be positive (got %)', p_qty;
  end if;

  update public.availability_slots
    set booked_count = greatest(0, booked_count - p_qty)
    where id = p_slot_id;
end;
$$;

-- These are trusted server operations. Deny them to anon/authenticated; the
-- service role (which bypasses these grants) calls them from server code.
revoke execute on function public.reserve_slot(uuid, integer) from public, anon, authenticated;
revoke execute on function public.release_slot(uuid, integer) from public, anon, authenticated;
