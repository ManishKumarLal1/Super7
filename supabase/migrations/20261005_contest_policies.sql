-- ============================================================
-- CONTESTS — policies
-- ============================================================
alter table public.contests enable row level security;

drop policy if exists "Anyone authenticated can view contests" on public.contests;
create policy "Anyone authenticated can view contests"
  on public.contests for select
  to authenticated
  using (true);

drop policy if exists "Users can create contests" on public.contests;
create policy "Users can create contests"
  on public.contests for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = creator_id);

drop policy if exists "Users can update own contests" on public.contests;
create policy "Users can update own contests"
  on public.contests for update
  to authenticated
  using (
    (select auth.jwt()->>'sub') = creator_id
    or exists (
      select 1 from public.contest_players
      where contest_id = contests.id
      and user_id = (select auth.jwt()->>'sub')
    )
  );

-- ============================================================
-- CONTEST PLAYERS — policies
-- ============================================================
alter table public.contest_players enable row level security;

drop policy if exists "Anyone authenticated can view contest players" on public.contest_players;
create policy "Anyone authenticated can view contest players"
  on public.contest_players for select
  to authenticated
  using (true);

drop policy if exists "Users can join contests" on public.contest_players;
create policy "Users can join contests"
  on public.contest_players for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);

drop policy if exists "Users can leave contests" on public.contest_players;
create policy "Users can leave contests"
  on public.contest_players for delete
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);