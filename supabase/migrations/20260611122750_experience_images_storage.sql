-- Roava — Storage for experience images (M2).
-- Public-read bucket (images are shown to all consumers). Writes are scoped by
-- path: the first folder segment is the operator id, and only that operator may
-- write there. Path convention: {operator_id}/{experience_id}/{filename}.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'experience-images',
  'experience-images',
  true,
  5242880, -- 5 MB; client compresses before upload (data-light, perf budget)
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do nothing;

-- Public read for this bucket (objects are served via the public CDN path too).
create policy "experience images public read"
  on storage.objects for select
  using (bucket_id = 'experience-images');

-- Operators may write only inside their own operator-id folder.
create policy "experience images operator insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'experience-images'
    and public.owns_operator(((storage.foldername(name))[1])::uuid)
  );

create policy "experience images operator update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'experience-images'
    and public.owns_operator(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'experience-images'
    and public.owns_operator(((storage.foldername(name))[1])::uuid)
  );

create policy "experience images operator delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'experience-images'
    and public.owns_operator(((storage.foldername(name))[1])::uuid)
  );
