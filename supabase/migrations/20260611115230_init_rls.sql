-- Roava — Row-Level Security (M0).
-- Default-deny on every table, with explicit policies (CLAUDE.md §5).
-- The service role bypasses RLS and performs all payment/booking/ticket writes;
-- clients only ever read/write what these policies allow.
--
-- Access helpers are SECURITY DEFINER so policy subqueries don't re-trigger the
-- RLS of referenced tables (which would recurse or silently over-filter).

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- Access helper functions
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

create or replace function public.owns_operator(p_operator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.operators
    where id = p_operator_id and owner_profile_id = auth.uid()
  );
$$;

create or replace function public.owns_experience(p_experience_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.experiences e
    join public.operators o on o.id = e.operator_id
    where e.id = p_experience_id and o.owner_profile_id = auth.uid()
  );
$$;

create or replace function public.experience_is_published(p_experience_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.experiences
    where id = p_experience_id and status = 'published'
  );
$$;

create or replace function public.consumer_owns_booking(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bookings
    where id = p_booking_id and consumer_profile_id = auth.uid()
  );
$$;

-- Consumer who booked, or the operator who owns the booked experience.
create or replace function public.can_view_booking(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = p_booking_id
      and (
        b.consumer_profile_id = auth.uid()
        or public.owns_experience(b.experience_id)
      )
  );
$$;

-- A review is allowed only from the consumer's own COMPLETED booking, and the
-- review's experience must match the booking's experience.
create or replace function public.can_review_booking(p_booking_id uuid, p_experience_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bookings
    where id = p_booking_id
      and consumer_profile_id = auth.uid()
      and status = 'completed'
      and experience_id = p_experience_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Escalation guards (RLS is row-level, not column-level)
-- ---------------------------------------------------------------------------
-- Only an admin (or the service role) may change a profile's role. Blocks a
-- consumer from making themselves an admin/operator via a profile update.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not public.is_service_role()
     and not public.is_admin() then
    raise exception 'role can only be changed by an administrator';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- The verified badge is admin-controlled. Force it false on self-service insert
-- and block self-promotion on update.
create or replace function public.guard_operator_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.verified and not public.is_service_role() and not public.is_admin() then
      new.verified := false;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.verified is distinct from old.verified
       and not public.is_service_role()
       and not public.is_admin() then
      raise exception 'verified status can only be changed by an administrator';
    end if;
  end if;
  return new;
end;
$$;

create trigger operators_guard_verified
  before insert or update on public.operators
  for each row execute function public.guard_operator_verified();

-- ---------------------------------------------------------------------------
-- Enable RLS (default-deny once enabled)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.operators enable row level security;
alter table public.operator_payouts enable row level security;
alter table public.experiences enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.tickets enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- operators (business profile is public; payout details are not)
-- ---------------------------------------------------------------------------
create policy operators_select_public on public.operators
  for select using (true);
create policy operators_insert_own on public.operators
  for insert with check (owner_profile_id = auth.uid());
create policy operators_update_own on public.operators
  for update using (owner_profile_id = auth.uid() or public.is_admin())
  with check (owner_profile_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- operator_payouts (owner-only)
-- ---------------------------------------------------------------------------
create policy operator_payouts_select_own on public.operator_payouts
  for select using (public.owns_operator(operator_id) or public.is_admin());
create policy operator_payouts_insert_own on public.operator_payouts
  for insert with check (public.owns_operator(operator_id));
create policy operator_payouts_update_own on public.operator_payouts
  for update using (public.owns_operator(operator_id))
  with check (public.owns_operator(operator_id));

-- ---------------------------------------------------------------------------
-- experiences (published readable by all; owner manages own)
-- ---------------------------------------------------------------------------
create policy experiences_select_visible on public.experiences
  for select using (
    status = 'published'
    or public.owns_operator(operator_id)
    or public.is_admin()
  );
create policy experiences_insert_own on public.experiences
  for insert with check (public.owns_operator(operator_id));
create policy experiences_update_own on public.experiences
  for update using (public.owns_operator(operator_id) or public.is_admin())
  with check (public.owns_operator(operator_id) or public.is_admin());
create policy experiences_delete_own on public.experiences
  for delete using (public.owns_operator(operator_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- availability_slots (visible when the experience is published; owner manages)
-- ---------------------------------------------------------------------------
create policy slots_select_visible on public.availability_slots
  for select using (
    public.experience_is_published(experience_id)
    or public.owns_experience(experience_id)
    or public.is_admin()
  );
create policy slots_insert_own on public.availability_slots
  for insert with check (public.owns_experience(experience_id));
create policy slots_update_own on public.availability_slots
  for update using (public.owns_experience(experience_id) or public.is_admin())
  with check (public.owns_experience(experience_id) or public.is_admin());
create policy slots_delete_own on public.availability_slots
  for delete using (public.owns_experience(experience_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- bookings (read-only to clients; all writes via the service role in M4)
-- ---------------------------------------------------------------------------
create policy bookings_select_involved on public.bookings
  for select using (
    consumer_profile_id = auth.uid()
    or public.owns_experience(experience_id)
    or public.is_admin()
  );
-- No insert/update/delete policies: clients cannot mutate bookings. Capacity
-- reservation, price calculation, and status changes happen server-side with
-- the service role (CLAUDE.md §3, §4).

-- ---------------------------------------------------------------------------
-- payments (consumer-readable for their own booking; writes service-role only)
-- ---------------------------------------------------------------------------
create policy payments_select_own on public.payments
  for select using (
    public.consumer_owns_booking(booking_id) or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- tickets (consumer + operator readable for check-in; writes service-role only)
-- ---------------------------------------------------------------------------
create policy tickets_select_involved on public.tickets
  for select using (
    public.can_view_booking(booking_id) or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- reviews (public read; write only from your own completed booking)
-- ---------------------------------------------------------------------------
create policy reviews_select_public on public.reviews
  for select using (true);
create policy reviews_insert_completed on public.reviews
  for insert with check (
    consumer_profile_id = auth.uid()
    and public.can_review_booking(booking_id, experience_id)
  );
create policy reviews_update_own on public.reviews
  for update using (consumer_profile_id = auth.uid())
  with check (consumer_profile_id = auth.uid());
create policy reviews_delete_own on public.reviews
  for delete using (consumer_profile_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- wishlist (owner-only)
-- ---------------------------------------------------------------------------
create policy wishlist_all_own on public.wishlist
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
