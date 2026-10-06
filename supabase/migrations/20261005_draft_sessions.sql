create table if not exists public.draft_sessions (
  contest_id uuid primary key references public.contests(id) on delete cascade,
  first_picker text not null,       -- the Clerk user ID of whoever picked first
  created_at timestamptz not null default now()
);

alter table public.draft_sessions enable row level security;

drop policy if exists "Anyone authenticated can view draft sessions" on public.draft_sessions;
create policy "Anyone authenticated can view draft sessions"
  on public.draft_sessions for select to authenticated using (true);

drop policy if exists "Anyone authenticated can create draft sessions" on public.draft_sessions;
create policy "Anyone authenticated can create draft sessions"
  on public.draft_sessions for insert to authenticated with check (true);