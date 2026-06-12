-- Roava — local seed data for discovery (M3).
-- Runs on `supabase db reset`. Believable Nairobi-region experiences across
-- categories/counties, with future slots (some this week) and a few reviews.
-- Demo images are external URLs (passed through by experienceImageUrl); real
-- uploads use storage object keys.

-- The role/verified escalation guards exist to stop CLIENTS self-promoting.
-- For trusted seed data we set these directly, so disable just those two guards
-- (the profile-creation trigger on auth.users is left intact).
alter table public.profiles disable trigger profiles_guard_role;
alter table public.operators disable trigger operators_guard_verified;

-- ── Users (auth) → profiles auto-created by trigger ───────────────────────────
insert into auth.users (id, phone, aud, role) values
  ('a1000000-0000-0000-0000-000000000001', '+254700100001', 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000002', '+254700100002', 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000003', '+254700100003', 'authenticated', 'authenticated'),
  ('c2000000-0000-0000-0000-000000000001', '+254700200001', 'authenticated', 'authenticated'),
  ('c2000000-0000-0000-0000-000000000002', '+254700200002', 'authenticated', 'authenticated');

update public.profiles set name = 'Rift Valley Adventures', role = 'operator' where id = 'a1000000-0000-0000-0000-000000000001';
update public.profiles set name = 'Nairobi City Walks',    role = 'operator' where id = 'a1000000-0000-0000-0000-000000000002';
update public.profiles set name = 'Heritage Trails Kenya', role = 'operator' where id = 'a1000000-0000-0000-0000-000000000003';
update public.profiles set name = 'Wanjiru K.' where id = 'c2000000-0000-0000-0000-000000000001';
update public.profiles set name = 'Brian O.'   where id = 'c2000000-0000-0000-0000-000000000002';

-- ── Operators (verified guard is bypassed for the postgres seed role) ─────────
insert into public.operators (id, owner_profile_id, business_name, bio, verified) values
  ('b0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Rift Valley Adventures', 'Small-group hikes, cycling and lake trips across the Rift Valley.', true),
  ('b0000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Nairobi City Walks', 'Walking tours, safaris and food crawls in and around Nairobi.', true),
  ('b0000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Heritage Trails Kenya', 'Cultural visits and farm experiences with local hosts.', false);

insert into public.operator_payouts (operator_id, payout_msisdn) values
  ('b0000000-0000-0000-0000-000000000001', '+254700100001'),
  ('b0000000-0000-0000-0000-000000000002', '+254700100002'),
  ('b0000000-0000-0000-0000-000000000003', '+254700100003');

-- ── Experiences ──────────────────────────────────────────────────────────────
insert into public.experiences
  (id, operator_id, title, description, category, county, area, lat, lng, meeting_point, images, base_price_kes, duration_minutes, max_party_size, cancellation_policy, status) values
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Sunrise hike up Ngong Hills',
   'Catch the sunrise over the Rift Valley on this guided ridge walk along the seven Ngong Hills. Moderate pace, big views, and a ranger escort throughout.',
   'Hiking & nature', 'Kajiado', 'Ngong', -1.3833, 36.6500, 'Ngong Hills main gate, Kibiku',
   array['https://picsum.photos/seed/ngong/900/675'],
   2500, 240, 12, 'Free cancellation up to 24 hours before the start time.', 'published'),

  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
   'Nairobi National Park morning safari',
   'A 4x4 game drive minutes from the city — lions, giraffe, rhino and zebra against a skyline backdrop. Includes park transfer and a guide.',
   'Wildlife & safari', 'Nairobi', 'Lang''ata', -1.3733, 36.8590, 'Nairobi National Park, Lang''ata main gate',
   array['https://picsum.photos/seed/safari/900/675'],
   6500, 300, 6, 'Free cancellation up to 48 hours before.', 'published'),

  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'Karura Forest waterfall walk',
   'An easy, shaded walk to the Karura waterfall and caves. Great for families and first-timers. Bike hire available on request.',
   'Hiking & nature', 'Nairobi', 'Karura', -1.2360, 36.8330, 'Karura Forest, Limuru Road gate',
   array['https://picsum.photos/seed/karura/900/675'],
   1500, 150, 15, 'Free cancellation up to 12 hours before.', 'published'),

  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Hell''s Gate cycling and gorge walk',
   'Cycle past zebra and giraffe to the dramatic Hell''s Gate gorge, then walk through the canyon with a local guide. Bikes included.',
   'Adventure & sport', 'Nakuru', 'Naivasha', -0.8833, 36.3167, 'Hell''s Gate National Park, Elsa gate',
   array['https://picsum.photos/seed/hellsgate/900/675'],
   4500, 360, 10, 'Free cancellation up to 48 hours before.', 'published'),

  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
   'Lake Naivasha boat ride and Crescent Island',
   'A morning boat ride among hippos and birdlife, then a guided walk on Crescent Island among grazing wildlife. Lifejackets provided.',
   'Wildlife & safari', 'Nakuru', 'Naivasha', -0.7167, 36.3500, 'Lake Naivasha, Tawi jetty',
   array['https://picsum.photos/seed/naivasha/900/675'],
   5500, 240, 8, 'Free cancellation up to 24 hours before.', 'published'),

  ('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003',
   'Kiambethu tea farm tour and lunch',
   'Walk a working tea farm, learn how your cup is made, and sit down to a home-cooked lunch with views over the Kiambu hills.',
   'Food & drink', 'Kiambu', 'Limuru', -1.1167, 36.6500, 'Kiambethu Farm, Tigoni',
   array['https://picsum.photos/seed/teafarm/900/675'],
   4000, 180, 12, 'Free cancellation up to 24 hours before.', 'published'),

  ('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003',
   'Maasai village cultural visit',
   'Spend an afternoon with a Maasai community on the edge of the Mara — beadwork, dance, and stories from your hosts. Respectful, small groups.',
   'Cultural & heritage', 'Narok', 'Sekenani', -1.4060, 35.1380, 'Sekenani gate area, Maasai Mara',
   array['https://picsum.photos/seed/maasai/900/675'],
   3500, 180, 20, 'Free cancellation up to 48 hours before.', 'published'),

  ('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002',
   'Nairobi street food evening tour',
   'Eat your way through the city after dark — nyama choma, mutura, samosas and more, with a guide who knows every stall worth stopping at.',
   'Food & drink', 'Nairobi', 'CBD', -1.2864, 36.8172, 'Kenya National Archives steps, Tom Mboya St',
   array['https://picsum.photos/seed/streetfood/900/675'],
   3000, 180, 10, 'Free cancellation up to 12 hours before.', 'published'),

  ('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001',
   'Kereita forest zipline and waterfall',
   'Zip across the Kereita forest canopy, then hike to a hidden waterfall. All gear and a safety briefing included.',
   'Adventure & sport', 'Kiambu', 'Kereita', -0.9667, 36.6667, 'Kereita Forest, The Forest gate',
   array['https://picsum.photos/seed/kereita/900/675'],
   5000, 240, 12, 'Free cancellation up to 24 hours before.', 'published');

-- ── Slots: a near-term one (this week) + a couple later, per experience ───────
insert into public.availability_slots (experience_id, start_at, capacity, booked_count)
select e.id, d.start_at, d.capacity, 0
from public.experiences e
cross join lateral (
  values
    ((date_trunc('day', now()) + interval '3 days' + interval '7 hours'), 12),
    ((date_trunc('day', now()) + interval '6 days' + interval '7 hours'), 12),
    ((date_trunc('day', now()) + interval '13 days' + interval '8 hours'), 12)
) as d(start_at, capacity);

-- ── Reviews (need a completed booking; postgres seed role bypasses RLS) ───────
-- Booking + completed status on Ngong Hills for Wanjiru, with a 5★ review.
with s1 as (
  select id from public.availability_slots
  where experience_id = 'e0000000-0000-0000-0000-000000000001' order by start_at limit 1
), bk1 as (
  insert into public.bookings (experience_id, slot_id, consumer_profile_id, party_size, amount_kes, status)
  select 'e0000000-0000-0000-0000-000000000001', s1.id, 'c2000000-0000-0000-0000-000000000001', 2, 5000, 'completed' from s1
  returning id, experience_id, consumer_profile_id
)
insert into public.reviews (experience_id, booking_id, consumer_profile_id, rating, body)
select experience_id, id, consumer_profile_id, 5, 'Unreal sunrise and our guide was brilliant. Worth the early start.' from bk1;

with s2 as (
  select id from public.availability_slots
  where experience_id = 'e0000000-0000-0000-0000-000000000002' order by start_at limit 1
), bk2 as (
  insert into public.bookings (experience_id, slot_id, consumer_profile_id, party_size, amount_kes, status)
  select 'e0000000-0000-0000-0000-000000000002', s2.id, 'c2000000-0000-0000-0000-000000000002', 1, 6500, 'completed' from s2
  returning id, experience_id, consumer_profile_id
)
insert into public.reviews (experience_id, booking_id, consumer_profile_id, rating, body)
select experience_id, id, consumer_profile_id, 4, 'Saw three lions within twenty minutes. So close to town it''s mad.' from bk2;

-- Restore the escalation guards.
alter table public.profiles enable trigger profiles_guard_role;
alter table public.operators enable trigger operators_guard_verified;
