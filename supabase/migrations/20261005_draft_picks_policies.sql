-- Enable RLS (safe if already enabled)
alter table public.draft_picks enable row level security;

-- SELECT: both players need to read all picks for their contest
drop policy if exists "Anyone authenticated can view draft picks" on public.draft_picks;
create policy "Anyone authenticated can view draft picks"
  on public.draft_picks for select
  to authenticated
  using (true);

-- INSERT: users can only insert picks as themselves
drop policy if exists "Users can make their own picks" on public.draft_picks;
create policy "Users can make their own picks"
  on public.draft_picks for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);

-- UPDATE: users can update their own picks (for future use)
drop policy if exists "Users can update own picks" on public.draft_picks;
create policy "Users can update own picks"
  on public.draft_picks for update
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

-- DELETE: users can delete their own picks (for re-draft / cancel)
drop policy if exists "Users can delete own picks" on public.draft_picks;
create policy "Users can delete own picks"
  on public.draft_picks for delete
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);