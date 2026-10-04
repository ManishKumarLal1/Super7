-- ============================================================
-- FRIENDSHIPS
-- ============================================================
alter table public.friendships enable row level security;

drop policy if exists "Users can view own friendships" on public.friendships;
create policy "Users can view own friendships"
  on public.friendships for select
  to authenticated
  using (
    (select auth.jwt()->>'sub') = user_id
    or (select auth.jwt()->>'sub') = friend_id
  );

drop policy if exists "Users can create friendships" on public.friendships;
create policy "Users can create friendships"
  on public.friendships for insert
  to authenticated
  with check (
    (select auth.jwt()->>'sub') = user_id
    or (select auth.jwt()->>'sub') = friend_id
  );

drop policy if exists "Users can remove own friendships" on public.friendships;
create policy "Users can remove own friendships"
  on public.friendships for delete
  to authenticated
  using (
    (select auth.jwt()->>'sub') = user_id
    or (select auth.jwt()->>'sub') = friend_id
  );

-- ============================================================
-- FRIEND REQUESTS
-- ============================================================
alter table public.friend_requests enable row level security;

drop policy if exists "Users can view own requests" on public.friend_requests;
create policy "Users can view own requests"
  on public.friend_requests for select
  to authenticated
  using (
    (select auth.jwt()->>'sub') = from_id
    or (select auth.jwt()->>'sub') = to_id
  );

drop policy if exists "Users can send requests" on public.friend_requests;
create policy "Users can send requests"
  on public.friend_requests for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = from_id);

drop policy if exists "Users can update own requests" on public.friend_requests;
create policy "Users can update own requests"
  on public.friend_requests for update
  to authenticated
  using (
    (select auth.jwt()->>'sub') = from_id
    or (select auth.jwt()->>'sub') = to_id
  );

-- ============================================================
-- MESSAGES
-- ============================================================
alter table public.messages enable row level security;

drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages"
  on public.messages for select
  to authenticated
  using (
    split_part(thread_id, ':', 1) = (select auth.jwt()->>'sub')
    or split_part(thread_id, ':', 2) = (select auth.jwt()->>'sub')
  );

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (
    (select auth.jwt()->>'sub') = sender_id
    and (
      split_part(thread_id, ':', 1) = (select auth.jwt()->>'sub')
      or split_part(thread_id, ':', 2) = (select auth.jwt()->>'sub')
    )
  );

drop policy if exists "Users can mark messages read" on public.messages;
create policy "Users can mark messages read"
  on public.messages for update
  to authenticated
  using (
    split_part(thread_id, ':', 1) = (select auth.jwt()->>'sub')
    or split_part(thread_id, ':', 2) = (select auth.jwt()->>'sub')
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications"
  on public.notifications for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);