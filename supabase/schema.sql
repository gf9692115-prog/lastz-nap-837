-- ============================================================================
-- Last Z · Server 837 NAP violation detector
-- Run this file once in the Supabase SQL editor.
-- It is safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enum
-- ----------------------------------------------------------------------------
do $$
begin
  create type public.report_type as enum (
    'BOUNTY_PLUNDER',
    'RESOURCE_TILE',
    'TRUCK_PLUNDER'
  );
exception
  when duplicate_object then null;
end
$$;

-- ----------------------------------------------------------------------------
-- Main table
-- ----------------------------------------------------------------------------
create table if not exists public.violations (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  report_type        public.report_type not null,
  offending_alliance text not null default 'UNKNOWN',
  offending_player   text not null,
  offending_server   text not null default '837',
  victim_player      text,
  battle_timestamp   timestamptz not null,
  is_violation       boolean not null default true,
  reason             text not null,
  image_url          text
);

comment on table public.violations is
  'Every parsed battle report. Only rows with is_violation = true count toward the Server 837 NAP leaderboard.';
comment on column public.violations.offending_alliance is
  'Alliance tag without square brackets. Case and characters are preserved exactly.';
comment on column public.violations.offending_player is
  'Full visible player label without the leading #server prefix, including the [alliance] tag.';
comment on column public.violations.offending_server is
  'Server extracted from the #XXX prefix. No prefix means 837.';
comment on column public.violations.battle_timestamp is
  'Battle display time, normalized to the minute and stored as UTC.';
comment on column public.violations.is_violation is
  'true only when the offending player belongs to Server 837.';

-- One report may not be uploaded twice. Seconds are removed from
-- battle_timestamp before insertion, so this is a minute-level dedupe key.
create unique index if not exists violations_dedupe_idx
  on public.violations (
    report_type,
    offending_alliance,
    offending_player,
    battle_timestamp
  );

create index if not exists violations_public_feed_idx
  on public.violations (created_at desc)
  where is_violation = true;

create index if not exists violations_leaderboard_idx
  on public.violations (offending_alliance)
  where is_violation = true;

create index if not exists violations_battle_time_idx
  on public.violations (battle_timestamp desc)
  where is_violation = true;

-- ----------------------------------------------------------------------------
-- Public leaderboard view
-- ----------------------------------------------------------------------------
create or replace view public.alliance_leaderboard
with (security_invoker = true)
as
select
  offending_alliance as alliance,
  count(*)::integer as violation_count,
  count(distinct offending_player)::integer as offender_count,
  max(battle_timestamp) as last_violation_at
from public.violations
where is_violation = true
group by offending_alliance
order by violation_count desc, last_violation_at desc, alliance asc;

comment on view public.alliance_leaderboard is
  'Server 837 NAP violations grouped by offending alliance, highest count first.';

-- ----------------------------------------------------------------------------
-- Row-level security
-- The API writes with the service-role key. Anonymous table/view queries may
-- only read confirmed Server 837 violations; external-server rows are retained
-- for audit but are not publicly queryable through the Data API.
-- ----------------------------------------------------------------------------
alter table public.violations enable row level security;

drop policy if exists "Public can read confirmed violations"
  on public.violations;

create policy "Public can read confirmed violations"
  on public.violations
  for select
  to anon, authenticated
  using (is_violation = true);

revoke all on table public.violations from anon, authenticated;
grant select on table public.violations to anon, authenticated;

-- service_role bypasses RLS, but it still needs SQL privileges on the table.
-- The Edge Function upload-report uses this role for inserts and audits.
grant select, insert, update, delete
  on table public.violations
  to service_role;

revoke all on table public.alliance_leaderboard from anon, authenticated;
grant select on table public.alliance_leaderboard to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Storage: public evidence bucket
-- Uploads are performed by the server with the service-role key. No anonymous
-- insert/update/delete policy is created. HEIC/HEIF are converted to JPEG by
-- the browser before reaching Storage because DeepSeek vision does not accept
-- those formats directly.
-- ----------------------------------------------------------------------------
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'reports',
  'reports',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view report evidence"
  on storage.objects;

create policy "Public can view report evidence"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'reports');
