create or replace function public.start_match_if_needed(
  p_match_id text,
  p_batting_order text[],
  p_bowling_order text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Ensure a row exists in `matches` to satisfy the FK
  insert into public.matches (id, format, team_a, team_b, start_time, status)
  values (p_match_id, 'T20', 'Team A', 'Team B', now(), 'live')
  on conflict (id) do nothing;

  -- Ensure a match_state row exists
  insert into public.match_state (
    match_id,
    batting_order,
    bowling_order,
    current_over,
    runs,
    wickets,
    striker_index,
    non_striker_index,
    next_batsman_index,
    is_complete
  )
  values (
    p_match_id,
    p_batting_order,
    p_bowling_order,
    0, 0, 0, 0, 1, 2, false
  )
  on conflict (match_id) do nothing;
end;
$$;

grant execute on function public.start_match_if_needed(text, text[], text[]) to authenticated;

create or replace function public.simulate_over(p_match_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state record;
  v_batting_order text[];
  v_bowling_order text[];
  v_bowler_id text;
  v_striker_id text;
  v_non_striker_id text;
  v_striker_idx int;
  v_non_striker_idx int;
  v_next_batsman_idx int;
  v_ball int;
  v_runs_this_ball int;
  v_is_wicket bool;
  v_is_wide bool;
  v_wicket_type text;
  v_fielder_id text;
  v_description text;
  v_events jsonb := '[]'::jsonb;
  v_total_runs int;
  v_total_wickets int;
  v_current_over int;
  v_this_over_balls int;
  v_rand float;
  v_temp_id text;
  v_temp_idx int;
  v_batting_len int;
  v_bowling_len int;
begin
  -- Lock the row for this match — prevents concurrent calls
  select * into v_state
  from public.match_state
  where match_id = p_match_id
  for update;

  if not found then
    return jsonb_build_object('error', 'match state not found');
  end if;

  if v_state.is_complete then
    return jsonb_build_object('skipped', true, 'reason', 'complete');
  end if;

  if v_state.lock_until is not null and v_state.lock_until > now() then
    return jsonb_build_object('skipped', true, 'reason', 'locked');
  end if;

  -- Lock for 10 seconds
  update public.match_state
  set lock_until = now() + interval '10 seconds', updated_at = now()
  where match_id = p_match_id;

  v_batting_order := v_state.batting_order;
  v_bowling_order := v_state.bowling_order;
  v_batting_len := array_length(v_batting_order, 1);
  v_bowling_len := array_length(v_bowling_order, 1);

  v_current_over := v_state.current_over;
  v_total_runs := v_state.runs;
  v_total_wickets := v_state.wickets;

  v_striker_idx := v_state.striker_index;
  v_non_striker_idx := v_state.non_striker_index;
  v_next_batsman_idx := v_state.next_batsman_index;

  v_striker_id := v_batting_order[v_striker_idx + 1];
  v_non_striker_id := v_batting_order[v_non_striker_idx + 1];

  v_bowler_id := v_bowling_order[(v_current_over % v_bowling_len) + 1];

  v_this_over_balls := 0;

  for v_ball in 1..6 loop
    exit when v_total_wickets >= 10;

    v_rand := random();

    -- Wide: 4% chance, doesn't count as a legal ball
    if v_rand < 0.04 then
      v_total_runs := v_total_runs + 1;
      v_description := format('%s bowls wide, 1 extra', v_bowler_id);

      v_events := v_events || jsonb_build_object(
        'over', v_current_over,
        'ballInOver', v_this_over_balls + 1,
        'batsmanId', v_striker_id,
        'bowlerId', v_bowler_id,
        'runs', 1,
        'isWicket', false,
        'isWide', true,
        'description', v_description
      );
      continue;
    end if;

    v_this_over_balls := v_this_over_balls + 1;

    -- Wicket: ~5.5% chance
    if random() < 0.055 and v_total_wickets < 10 then
      v_rand := random();
      if v_rand < 0.25 then v_wicket_type := 'bowled';
      elsif v_rand < 0.70 then v_wicket_type := 'caught';
      elsif v_rand < 0.85 then v_wicket_type := 'lbw';
      elsif v_rand < 0.95 then v_wicket_type := 'runout';
      else v_wicket_type := 'stumped';
      end if;

      v_fielder_id := v_bowling_order[(floor(random() * v_bowling_len)::int) + 1];

      v_description := case v_wicket_type
        when 'bowled' then format('%s bowls %s', v_bowler_id, v_striker_id)
        when 'lbw' then format('%s LBW b %s', v_striker_id, v_bowler_id)
        when 'caught' then format('%s c %s b %s', v_striker_id, v_fielder_id, v_bowler_id)
        when 'stumped' then format('%s st %s b %s', v_striker_id, v_fielder_id, v_bowler_id)
        when 'runout' then format('%s run out (%s)', v_striker_id, v_fielder_id)
      end;

      v_total_wickets := v_total_wickets + 1;

      v_events := v_events || jsonb_build_object(
        'over', v_current_over,
        'ballInOver', v_this_over_balls,
        'batsmanId', v_striker_id,
        'bowlerId', v_bowler_id,
        'runs', 0,
        'isWicket', true,
        'wicketType', v_wicket_type,
        'fielderId', case when v_wicket_type in ('bowled','lbw') then null else v_fielder_id end,
        'description', v_description
      );

      -- New batsman
      if v_next_batsman_idx < v_batting_len then
        v_striker_id := v_batting_order[v_next_batsman_idx + 1];
        v_striker_idx := v_next_batsman_idx;
        v_next_batsman_idx := v_next_batsman_idx + 1;
      end if;

      -- End of over swap
      if v_this_over_balls = 6 then
        v_temp_id := v_striker_id; v_temp_idx := v_striker_idx;
        v_striker_id := v_non_striker_id; v_striker_idx := v_non_striker_idx;
        v_non_striker_id := v_temp_id; v_non_striker_idx := v_temp_idx;
      end if;
      continue;
    end if;

    -- Runs
    v_rand := random();
    if v_rand < 0.35 then v_runs_this_ball := 0;
    elsif v_rand < 0.65 then v_runs_this_ball := 1;
    elsif v_rand < 0.78 then v_runs_this_ball := 2;
    elsif v_rand < 0.82 then v_runs_this_ball := 3;
    elsif v_rand < 0.92 then v_runs_this_ball := 4;
    else v_runs_this_ball := 6;
    end if;

    v_total_runs := v_total_runs + v_runs_this_ball;

    v_description := case
      when v_runs_this_ball = 0 then format('%s to %s, no run', v_bowler_id, v_striker_id)
      when v_runs_this_ball = 4 then format('%s hits FOUR off %s', v_striker_id, v_bowler_id)
      when v_runs_this_ball = 6 then format('%s hits SIX off %s', v_striker_id, v_bowler_id)
      else format('%s takes %s off %s', v_striker_id, v_runs_this_ball, v_bowler_id)
    end;

    v_events := v_events || jsonb_build_object(
      'over', v_current_over,
      'ballInOver', v_this_over_balls,
      'batsmanId', v_striker_id,
      'bowlerId', v_bowler_id,
      'runs', v_runs_this_ball,
      'isWicket', false,
      'description', v_description
    );

    -- Odd runs → swap strike
    if v_runs_this_ball in (1, 3) then
      v_temp_id := v_striker_id; v_temp_idx := v_striker_idx;
      v_striker_id := v_non_striker_id; v_striker_idx := v_non_striker_idx;
      v_non_striker_id := v_temp_id; v_non_striker_idx := v_temp_idx;
    end if;

    -- End of over → swap strike
    if v_this_over_balls = 6 then
      v_temp_id := v_striker_id; v_temp_idx := v_striker_idx;
      v_striker_id := v_non_striker_id; v_striker_idx := v_non_striker_idx;
      v_non_striker_id := v_temp_id; v_non_striker_idx := v_temp_idx;
    end if;
  end loop;

  v_current_over := v_current_over + 1;

  -- Insert events into match_events
  insert into public.match_events (match_id, event_type, payload)
  select
    p_match_id,
    'ball',
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'over', (e->>'over')::int,
      'ballInOver', (e->>'ballInOver')::int,
      'batsmanId', e->>'batsmanId',
      'bowlerId', e->>'bowlerId',
      'runs', (e->>'runs')::int,
      'isWicket', (e->>'isWicket')::boolean,
      'wicketType', e->>'wicketType',
      'fielderId', e->>'fielderId',
      'isWide', coalesce((e->>'isWide')::boolean, false),
      'description', e->>'description'
    )
  from jsonb_array_elements(v_events) as e;

  -- Update state
  update public.match_state
  set
    current_over = v_current_over,
    runs = v_total_runs,
    wickets = v_total_wickets,
    striker_index = v_striker_idx,
    non_striker_index = v_non_striker_idx,
    next_batsman_index = v_next_batsman_idx,
    is_complete = (v_total_wickets >= 10 or v_current_over >= 20),
    updated_at = now()
  where match_id = p_match_id;

  return jsonb_build_object(
    'success', true,
    'over', v_current_over - 1,
    'runs', v_total_runs,
    'wickets', v_total_wickets,
    'events', jsonb_array_length(v_events)
  );
end;
$$;

grant execute on function public.simulate_over(text) to authenticated;