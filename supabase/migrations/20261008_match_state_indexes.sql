alter table public.match_state
  add column if not exists striker_index int not null default 0,
  add column if not exists non_striker_index int not null default 1,
  add column if not exists next_batsman_index int not null default 2;