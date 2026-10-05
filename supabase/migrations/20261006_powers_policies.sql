alter table public.contest_powers enable row level security;

drop policy if exists "Auth can view contest powers" on public.contest_powers;
create policy "Auth can view contest powers"
  on public.contest_powers for select
  to authenticated
  using (true);

drop policy if exists "Users can insert own powers" on public.contest_powers;
create policy "Users can insert own powers"
  on public.contest_powers for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);

drop policy if exists "Users can update own powers" on public.contest_powers;
create policy "Users can update own powers"
  on public.contest_powers for update
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);