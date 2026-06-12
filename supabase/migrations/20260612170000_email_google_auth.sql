-- Add email + Google as alternative sign-in methods alongside phone-OTP.
-- Phone stays the primary identity, but email-OTP and Google-OAuth users have
-- no phone, so we capture email and (where the provider gives it) name too.

-- Profiles gain an optional email. Phone was already nullable.
alter table public.profiles add column if not exists email text;

-- Broaden the on-signup trigger: a new auth user may arrive via phone, email,
-- or an OAuth provider. Pull whichever identifiers exist, and pre-fill the name
-- from OAuth metadata so Google users skip the onboarding name step.
-- GoTrue stores absent identifiers as '' rather than NULL → nullif() cleans them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email, name)
  values (
    new.id,
    nullif(new.phone, ''),
    nullif(new.email, ''),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      ),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
