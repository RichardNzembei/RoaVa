-- Roava — first-slice schema, RLS & functions (Supabase / Postgres)
-- Covers the booking spine only: profiles, operators, experiences, availability_slots,
-- bookings, payments, tickets. Deferred (reviews, wishlist, discovery_index, pgvector)
-- are intentionally NOT here — add them in later phases.
--
-- Run in the Supabase SQL editor, or drop into supabase/migrations.
-- Service-role calls (your webhook handler) bypass RLS; client calls are gated by it.
-- Writes to bookings/payments/tickets go through SECURITY DEFINER functions or the
-- service role only — clients never write them directly.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ============================================================ profiles
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone      text,
  full_name  text,
  role       text not null default 'consumer' check (role in ('consumer','operator','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

-- update own row, but NOT your own role (no self-elevation)
create policy "profiles_update_own_no_role" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- auto-create a profile on signup
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================ operators
create table public.operators (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  bio           text,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.operators enable row level security;

create policy "operators_public_read"   on public.operators for select using (true);
create policy "operators_owner_insert"  on public.operators for insert with check (owner_id = auth.uid());
create policy "operators_owner_update"  on public.operators for update using (owner_id = auth.uid());

-- sensitive payout details kept out of the public operators row
create table public.operator_payouts (
  operator_id   uuid primary key references public.operators(id) on delete cascade,
  payout_msisdn text not null,
  updated_at    timestamptz not null default now()
);
alter table public.operator_payouts enable row level security;

create policy "payouts_owner_all" on public.operator_payouts for all
  using (exists (select 1 from public.operators o where o.id = operator_payouts.operator_id and o.owner_id = auth.uid()))
  with check (exists (select 1 from public.operators o where o.id = operator_payouts.operator_id and o.owner_id = auth.uid()));

-- ============================================================ experiences
create table public.experiences (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references public.operators(id) on delete cascade,
  title           text not null,
  description     text,
  category        text,
  area            text,
  meeting_point   text,
  lat             double precision,
  lng             double precision,
  cover_image_url text,
  base_price_kes  integer not null check (base_price_kes >= 0),
  duration_minutes integer,
  max_party_size  integer not null default 10 check (max_party_size > 0),
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  created_at      timestamptz not null default now()
);
alter table public.experiences enable row level security;
create index experiences_operator_idx on public.experiences(operator_id);
create index experiences_status_idx   on public.experiences(status);

create policy "experiences_read_published_or_owner" on public.experiences for select
  using (
    status = 'published'
    or exists (select 1 from public.operators o where o.id = experiences.operator_id and o.owner_id = auth.uid())
  );

create policy "experiences_owner_write" on public.experiences for all
  using (exists (select 1 from public.operators o where o.id = experiences.operator_id and o.owner_id = auth.uid()))
  with check (exists (select 1 from public.operators o where o.id = experiences.operator_id and o.owner_id = auth.uid()));

-- ============================================================ availability_slots
create table public.availability_slots (
  id                 uuid primary key default gen_random_uuid(),
  experience_id      uuid not null references public.experiences(id) on delete cascade,
  start_at           timestamptz not null,
  capacity           integer not null check (capacity > 0),
  booked_count       integer not null default 0 check (booked_count >= 0 and booked_count <= capacity),
  price_override_kes integer check (price_override_kes >= 0),
  status             text not null default 'open' check (status in ('open','closed')),
  created_at         timestamptz not null default now()
);
alter table public.availability_slots enable row level security;
create index slots_experience_idx on public.availability_slots(experience_id);
create index slots_start_idx      on public.availability_slots(start_at);

create policy "slots_read_for_visible_experience" on public.availability_slots for select
  using (exists (
    select 1 from public.experiences e
    where e.id = availability_slots.experience_id
      and (e.status = 'published'
           or exists (select 1 from public.operators o where o.id = e.operator_id and o.owner_id = auth.uid()))
  ));

create policy "slots_owner_write" on public.availability_slots for all
  using (exists (
    select 1 from public.experiences e join public.operators o on o.id = e.operator_id
    where e.id = availability_slots.experience_id and o.owner_id = auth.uid()))
  with check (exists (
    select 1 from public.experiences e join public.operators o on o.id = e.operator_id
    where e.id = availability_slots.experience_id and o.owner_id = auth.uid()));

-- ============================================================ bookings
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  slot_id       uuid not null references public.availability_slots(id),
  experience_id uuid not null references public.experiences(id),
  consumer_id   uuid not null references public.profiles(id),
  party_size    integer not null check (party_size > 0),
  amount_kes    integer not null check (amount_kes >= 0),
  commission_kes integer not null default 0 check (commission_kes >= 0),
  status        text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  payout_status text not null default 'unpaid' check (payout_status in ('unpaid','paid')),
  created_at    timestamptz not null default now()
);
alter table public.bookings enable row level security;
create index bookings_consumer_idx   on public.bookings(consumer_id);
create index bookings_experience_idx on public.bookings(experience_id);

-- reads only; all writes via functions / service role (no insert/update policy = denied to clients)
create policy "bookings_consumer_read" on public.bookings for select using (consumer_id = auth.uid());
create policy "bookings_operator_read" on public.bookings for select
  using (exists (
    select 1 from public.experiences e join public.operators o on o.id = e.operator_id
    where e.id = bookings.experience_id and o.owner_id = auth.uid()));

-- ============================================================ payments (service-role only)
create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  provider     text not null default 'intasend',
  provider_ref text unique,                       -- enforces webhook idempotency
  amount_kes   integer not null,
  status       text not null default 'pending' check (status in ('pending','success','failed')),
  failure_reason text,
  raw_callback jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.payments enable row level security;  -- no client policies: service role only
create index payments_booking_idx on public.payments(booking_id);

-- ============================================================ tickets
create table public.tickets (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references public.bookings(id) on delete cascade,
  code          text not null unique,             -- unguessable token encoded in the QR
  status        text not null default 'valid' check (status in ('valid','used')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
alter table public.tickets enable row level security;

create policy "tickets_consumer_read" on public.tickets for select
  using (exists (select 1 from public.bookings b where b.id = tickets.booking_id and b.consumer_id = auth.uid()));

create policy "tickets_operator_read" on public.tickets for select
  using (exists (
    select 1 from public.bookings b join public.experiences e on e.id = b.experience_id
      join public.operators o on o.id = e.operator_id
    where b.id = tickets.booking_id and o.owner_id = auth.uid()));

-- ============================================================ functions

-- Become an operator (controlled role elevation; never admin)
create function public.become_operator(p_business_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_op uuid; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  update public.profiles set role = 'operator' where id = v_user and role = 'consumer';
  insert into public.operators (owner_id, business_name) values (v_user, p_business_name) returning id into v_op;
  return v_op;
end; $$;

-- Atomically reserve capacity + create a pending booking. Price recomputed server-side.
-- Returns the new booking id, or raises if the slot can't take the party.
create function public.create_pending_booking(p_slot_id uuid, p_party_size integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_experience_id uuid; v_unit_price integer; v_amount integer; v_commission integer;
  v_booking_id uuid; v_consumer uuid := auth.uid();
begin
  if v_consumer is null then raise exception 'not authenticated'; end if;
  if p_party_size < 1 then raise exception 'invalid party size'; end if;

  -- single atomic conditional update: succeeds only if seats remain and slot is open
  update public.availability_slots s
     set booked_count = s.booked_count + p_party_size
   where s.id = p_slot_id
     and s.status = 'open'
     and s.booked_count + p_party_size <= s.capacity
  returning s.experience_id,
            coalesce(s.price_override_kes,
                     (select e.base_price_kes from public.experiences e where e.id = s.experience_id))
    into v_experience_id, v_unit_price;

  if not found then raise exception 'slot unavailable'; end if;

  v_amount := v_unit_price * p_party_size;
  v_commission := round(v_amount * 0.10);  -- 10% commission — adjust to your model

  insert into public.bookings (slot_id, experience_id, consumer_id, party_size, amount_kes, commission_kes, status)
  values (p_slot_id, v_experience_id, v_consumer, p_party_size, v_amount, v_commission, 'pending')
  returning id into v_booking_id;

  return v_booking_id;
end; $$;

-- Confirm a paid booking + mint its ticket. Idempotent (guarded by status). Service-role/webhook.
create function public.confirm_booking(p_booking_id uuid, p_ticket_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.bookings set status = 'confirmed' where id = p_booking_id and status = 'pending';
  if found then
    insert into public.tickets (booking_id, code) values (p_booking_id, p_ticket_code)
    on conflict (booking_id) do nothing;
  end if;
end; $$;

-- Release a hold (payment failed/timed out): cancel booking + return the seats. Idempotent.
create function public.release_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_slot uuid; v_party integer;
begin
  update public.bookings set status = 'cancelled'
   where id = p_booking_id and status = 'pending'
  returning slot_id, party_size into v_slot, v_party;
  if found then
    update public.availability_slots set booked_count = greatest(booked_count - v_party, 0) where id = v_slot;
  end if;
end; $$;

-- Operator check-in: verify ownership + single-use, mark used. Returns a status string.
create function public.check_in_ticket(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_ticket public.tickets; v_owner uuid;
begin
  if v_user is null then return 'forbidden'; end if;
  select t.* into v_ticket from public.tickets t where t.code = p_code;
  if not found then return 'not_found'; end if;

  select o.owner_id into v_owner
  from public.bookings b join public.experiences e on e.id = b.experience_id
    join public.operators o on o.id = e.operator_id
  where b.id = v_ticket.booking_id;

  if v_owner is distinct from v_user then return 'forbidden'; end if;
  if v_ticket.status = 'used' then return 'already_used'; end if;

  update public.tickets set status = 'used', checked_in_at = now(), checked_in_by = v_user
   where id = v_ticket.id and status = 'valid';
  return 'ok';
end; $$;

-- ============================================================ grants
grant usage on schema public to anon, authenticated;
grant select on public.operators, public.experiences, public.availability_slots to anon, authenticated;
grant select on public.profiles, public.bookings, public.tickets to authenticated;

grant execute on function public.become_operator(text)            to authenticated;
grant execute on function public.create_pending_booking(uuid,int) to authenticated;
grant execute on function public.check_in_ticket(text)            to authenticated;
-- confirm_booking / release_booking are called by the service role (webhook) only — not granted to clients.

-- NOTE: never expose the service-role key client-side. The M-Pesa webhook handler runs
-- server-side with the service role, recomputes nothing it can trust from the client, and
-- calls confirm_booking / release_booking based on the verified provider callback only.
