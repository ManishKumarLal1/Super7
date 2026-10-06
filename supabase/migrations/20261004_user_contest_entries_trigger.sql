-- Auto-fill user_id from JWT on insert
create or replace function public.set_user_id_from_jwt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null then
    new.user_id := auth.jwt()->>'sub';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_contest_entries_set_user_id
  on public.user_contest_entries;

create trigger trg_user_contest_entries_set_user_id
  before insert on public.user_contest_entries
  for each row
  execute function public.set_user_id_from_jwt();