-- Roava — public reviews projection (M3).
-- Reviews are public, but `profiles` is private (RLS), so a join from the
-- client can't read the reviewer's name. This view exposes only the reviewer's
-- FIRST name alongside the (already public) review fields. It runs with the
-- definer's rights (security_invoker = off) so it can read the name, while
-- deliberately exposing nothing more.

create view public.experience_reviews
with (security_invoker = off) as
select
  r.id,
  r.experience_id,
  r.rating,
  r.body,
  r.created_at,
  coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Guest') as reviewer_name
from public.reviews r
join public.profiles p on p.id = r.consumer_profile_id;

grant select on public.experience_reviews to anon, authenticated;
