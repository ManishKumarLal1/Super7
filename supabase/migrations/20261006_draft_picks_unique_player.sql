-- Prevent the same player being picked twice in one contest
-- (covers both main picks and substitutes)
alter table public.draft_picks
  add constraint draft_picks_unique_player
  unique (contest_id, player_id);