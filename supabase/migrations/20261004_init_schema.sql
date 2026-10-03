-- ============================================================
-- Super 7 — Initial Schema
-- Created: 2026-10-04
-- ============================================================

-- ---------- USERS ----------
create table if not exists public.users (
  id text primary key,
  username text,
  display_name text,
  avatar_url text,
  friend_code text unique,
  created_at timestamptz not null default now()
);

-- ---------- WALLETS ----------
create table if not exists public.wallets (
  user_id text primary key references public.users(id) on delete cascade,
  balance integer not null default 1000,
  updated_at timestamptz not null default now(),
  constraint balance_non_negative check (balance >= 0)
);

-- ---------- TRANSACTIONS ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  amount integer not null,
  type text not null,
  label text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id, created_at desc);

-- ---------- CONTESTS ----------
create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  code varchar(6) unique not null,
  creator_id text not null references public.users(id),
  match_id text not null,
  stake integer not null default 0,
  status text not null default 'waiting',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_contests_status on public.contests(status);

-- ---------- CONTEST PLAYERS ----------
create table if not exists public.contest_players (
  contest_id uuid references public.contests(id) on delete cascade,
  user_id text not null references public.users(id),
  role text not null default 'joiner',
  joined_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);

-- ---------- DRAFT PICKS ----------
create table if not exists public.draft_picks (
  contest_id uuid references public.contests(id) on delete cascade,
  user_id text not null references public.users(id),
  player_id text not null,
  pick_index integer not null,
  created_at timestamptz not null default now(),
  primary key (contest_id, pick_index)
);

-- ---------- CONTEST POWERS ----------
create table if not exists public.contest_powers (
  contest_id uuid references public.contests(id) on delete cascade,
  user_id text not null references public.users(id),
  captain_id text,
  vice_captain_id text,
  poison_target_id text,
  substitute_id text,
  primary key (contest_id, user_id)
);

-- ---------- MATCH RESULTS ----------
create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references public.contests(id) on delete cascade,
  user_id text not null references public.users(id),
  base_points jsonb not null,
  final_points numeric not null,
  result text not null,
  payout integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- FRIENDSHIPS ----------
create table if not exists public.friendships (
  user_id text not null references public.users(id) on delete cascade,
  friend_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id < friend_id)
);

-- ---------- FRIEND REQUESTS ----------
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id text not null references public.users(id) on delete cascade,
  to_id text not null references public.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------- MESSAGES ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  sender_id text not null references public.users(id) on delete cascade,
  text text not null,
  metadata jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_thread on public.messages(thread_id, created_at desc);

-- ---------- NOTIFICATIONS ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  action_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- ---------- MATCHES ----------
create table if not exists public.matches (
  id text primary key,
  series_id text,
  format text not null,
  team_a text not null,
  team_b text not null,
  venue text,
  start_time timestamptz not null,
  status text not null default 'upcoming',
  playing_xi_a jsonb,
  playing_xi_b jsonb,
  toss_winner text,
  result text
);

-- ---------- MATCH SQUADS ----------
create table if not exists public.match_squads (
  match_id text references public.matches(id) on delete cascade,
  player_id text not null,
  name text not null,
  short_name text not null,
  team text not null,
  role text not null,
  credits numeric,
  is_playing_xi boolean default false,
  primary key (match_id, player_id)
);

-- ---------- MATCH EVENTS ----------
create table if not exists public.match_events (
  id bigserial primary key,
  match_id text references public.matches(id) on delete cascade,
  event_type text not null,
  player_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_match_events on public.match_events(match_id, created_at);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Escrow coins: safely deduct coins for a stake/entry
create or replace function public.escrow_coins(
  p_amount integer,
  p_label text,
  p_type text default 'escrow'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text := auth.jwt()->>'sub';
  v_current_balance integer;
  v_new_balance integer;
begin
  select balance into v_current_balance
  from public.wallets
  where user_id = v_user_id
  for update;

  if v_current_balance is null then
    raise exception 'Wallet not found';
  end if;

  if v_current_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  update public.wallets
  set balance = balance - p_amount, updated_at = now()
  where user_id = v_user_id
  returning balance into v_new_balance;

  insert into public.transactions (user_id, amount, type, label)
  values (v_user_id, -p_amount, p_type, p_label);

  return jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'deducted', p_amount
  );
end;
$$;

-- Credit coins: safely add coins for payouts/refunds/bonuses
create or replace function public.credit_coins(
  p_amount integer,
  p_label text,
  p_type text default 'payout'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text := auth.jwt()->>'sub';
  v_new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  update public.wallets
  set balance = balance + p_amount, updated_at = now()
  where user_id = v_user_id
  returning balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'Wallet not found';
  end if;

  insert into public.transactions (user_id, amount, type, label)
  values (v_user_id, p_amount, p_type, p_label);

  return jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'credited', p_amount
  );
end;
$$;

-- Grant execute permissions so authenticated users can call these
grant execute on function public.escrow_coins(integer, text, text) to authenticated;
grant execute on function public.credit_coins(integer, text, text) to authenticated;