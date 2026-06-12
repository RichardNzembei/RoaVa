-- Roava — atomic ticket check-in (M5, CLAUDE.md §4.4).
-- Single-use enforcement: the conditional UPDATE ... WHERE status = 'valid'
-- under a row lock means two simultaneous scans can never both succeed, and a
-- screenshot of an already-used ticket is rejected. The HMAC signature is
-- verified in server code BEFORE this runs; the nonce check here is defence in
-- depth. Service-role only.
--
-- Returns one of: 'ok' | 'used' | 'not_owner' | 'not_confirmed' | 'invalid'.

set check_function_bodies = off;

create or replace function public.check_in_ticket(
  p_booking_id uuid,
  p_nonce text,
  p_operator_profile uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
  v_booking public.bookings%rowtype;
  v_owner uuid;
  v_updated integer;
begin
  select * into v_ticket from public.tickets
    where booking_id = p_booking_id
    for update;
  if not found or v_ticket.nonce <> p_nonce then
    return 'invalid';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;

  -- The scanning operator must own the experience being checked into.
  select o.owner_profile_id into v_owner
    from public.experiences e
    join public.operators o on o.id = e.operator_id
    where e.id = v_booking.experience_id;
  if v_owner is distinct from p_operator_profile then
    return 'not_owner';
  end if;

  if v_booking.status not in ('confirmed', 'completed') then
    return 'not_confirmed';
  end if;

  if v_ticket.status = 'used' then
    return 'used';
  end if;
  if v_ticket.status <> 'valid' then
    return 'invalid';
  end if;

  -- Atomic single-use claim.
  update public.tickets
    set status = 'used', checked_in_at = now(), checked_in_by = p_operator_profile
    where id = v_ticket.id and status = 'valid';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    return 'used'; -- lost the race to a concurrent scan
  end if;

  -- Attendance complete — also enables the consumer to review (M6).
  update public.bookings
    set status = 'completed'
    where id = p_booking_id and status = 'confirmed';

  return 'ok';
end;
$$;

revoke execute on function public.check_in_ticket(uuid, text, uuid) from public, anon, authenticated;
