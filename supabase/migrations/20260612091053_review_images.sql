-- RoaVa — review photos (M6+). Public-read bucket; a reviewer writes only under
-- their own profile-id folder. Path: {profile_id}/{booking_id}/{filename}.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-images',
  'review-images',
  true,
  5242880,
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do nothing;

create policy "review images public read"
  on storage.objects for select
  using (bucket_id = 'review-images');

create policy "review images own insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "review images own delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Expose photo keys on the public reviews projection.
create or replace view public.experience_reviews
with (security_invoker = off) as
select
  r.id,
  r.experience_id,
  r.rating,
  r.body,
  r.created_at,
  coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Guest') as reviewer_name,
  r.photos
from public.reviews r
join public.profiles p on p.id = r.consumer_profile_id;

grant select on public.experience_reviews to anon, authenticated;
