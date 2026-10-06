-- Add sender_id so we can track who sent each notification
alter table public.notifications
  add column if not exists sender_id text references public.users(id) on delete set null;

-- Drop old policies (they assumed only self-inserts)
drop policy if exists "Users can insert own notifications" on public.notifications;

-- Users can send notifications to anyone, but only as themselves
create policy "Users can send notifications"
  on public.notifications for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = sender_id);

-- Keep the "only see your own" rule
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);