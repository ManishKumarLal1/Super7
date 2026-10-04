create table if not exists public.user_contest_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  contest_id uuid references public.contests(id) on delete cascade,
  code varchar(6),
  match_id text not null,
  stake integer not null default 0,
  status text not null default 'upcoming',  -- upcoming|drafting|live|completed
  result text,                              -- won|lost|tied (filled on complete)
  my_points numeric,
  opponent_points numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_uce_user_status
  on public.user_contest_entries(user_id, status, created_at desc);

alter table public.user_contest_entries enable row level security;

create policy "Users can view own contest entries"
  on public.user_contest_entries for select
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

create policy "Users can insert own contest entries"
  on public.user_contest_entries for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "Users can update own contest entries"
  on public.user_contest_entries for update
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);