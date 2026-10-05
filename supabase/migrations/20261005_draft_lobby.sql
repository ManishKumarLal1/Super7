create table if not exists public.draft_lobby (
  contest_id uuid primary key references public.contests(id) on delete cascade,
  player_a_id text not null,
  player_b_id text not null,
  player_a_ready bool not null default false,
  player_b_ready bool not null default false,
  first_picker text,
  created_at timestamptz not null default now()
);

alter table public.draft_lobby enable row level security;

drop policy if exists "Auth can view draft lobby" on public.draft_lobby;
create policy "Auth can view draft lobby"
  on public.draft_lobby for select to authenticated using (true);

drop policy if exists "Auth can insert draft lobby" on public.draft_lobby;
create policy "Auth can insert draft lobby"
  on public.draft_lobby for insert to authenticated with check (true);

drop policy if exists "Auth can update draft lobby" on public.draft_lobby;
create policy "Auth can update draft lobby"
  on public.draft_lobby for update to authenticated using (true);

-- Trigger: assign first_picker randomly when both players are ready
create or replace function public.assign_first_picker()
returns trigger
language plpgsql
as $$
begin
  if new.player_a_ready and new.player_b_ready and new.first_picker is null then
    if random() < 0.5 then
      new.first_picker := new.player_a_id;
    else
      new.first_picker := new.player_b_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_first_picker on public.draft_lobby;
create trigger trg_assign_first_picker
  before update on public.draft_lobby
  for each row execute function public.assign_first_picker();

-- Enable realtime
alter publication supabase_realtime add table public.draft_lobby;