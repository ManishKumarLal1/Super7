-- ============================================================
-- MATCH STATE — server-side source of truth
-- ============================================================
create table if not exists public.match_state (
  match_id text primary key,
  batting_order text[] not null default '{}',
  bowling_order text[] not null default '{}',
  current_over int not null default 0,
  runs int not null default 0,
  wickets int not null default 0,
  is_complete boolean not null default false,
  lock_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.match_state enable row level security;

drop policy if exists "Auth can view match state" on public.match_state;
create policy "Auth can view match state"
  on public.match_state for select to authenticated using (true);

drop policy if exists "Auth can insert match state" on public.match_state;
create policy "Auth can insert match state"
  on public.match_state for insert to authenticated with check (true);

drop policy if exists "Auth can update match state" on public.match_state;
create policy "Auth can update match state"
  on public.match_state for update to authenticated using (true);

-- ============================================================
-- MATCH EVENTS — RLS + Realtime
-- ============================================================
alter table public.match_events enable row level security;

drop policy if exists "Auth can view match events" on public.match_events;
create policy "Auth can view match events"
  on public.match_events for select to authenticated using (true);

drop policy if exists "Auth can insert match events" on public.match_events;
create policy "Auth can insert match events"
  on public.match_events for insert to authenticated with check (true);

-- Enable realtime on match_events so both clients get updates
alter publication supabase_realtime add table public.match_events;

-- Verify realtime enabled
select tablename from pg_publication_tables where pubname = 'supabase_realtime';