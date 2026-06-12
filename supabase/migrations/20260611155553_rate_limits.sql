-- RoaVa — fixed-window rate limiting, Postgres-backed so it works across
-- serverless instances (no external Redis needed). Protects costly/abusable
-- actions: OTP sends (real SMS cost) and booking initiation (capacity churn).
-- Service-role only.

set check_function_bodies = off;

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security; -- no policies: service role only

-- Atomically count a hit in the current fixed window and report whether the
-- caller is still within the limit. Returns true = allowed, false = throttled.
create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz;
  v_count integer;
begin
  v_bucket := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_bucket, 1)
  on conflict (key, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Prune old windows (called periodically by the reconciliation cron).
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.prune_rate_limits() from public, anon, authenticated;
