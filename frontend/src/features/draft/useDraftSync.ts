import { useEffect, useRef } from 'react';
import { useSupabase } from '../../lib/useSupabase';
import { useDraftStore, setDraftSupabase } from './draftStore';

export function useDraftSync(contestId: string | null) {
  const supabase = useSupabase();
  const tossAppliedRef = useRef(false);
  const appliedPicksRef = useRef<Set<string>>(new Set());

  // Keep the module-level ref fresh
  useEffect(() => {
    if (supabase) setDraftSupabase(supabase);
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !contestId) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    tossAppliedRef.current = false;
    appliedPicksRef.current = new Set();
    let cancelled = false;

    async function markReady() {
      // Fetch both players
      const { data: players } = await supabase!
        .from('contest_players')
        .select('user_id')
        .eq('contest_id', contestId);

      const ids = (players ?? []).map((p: any) => p.user_id).sort();
      if (ids.length < 2) {
        console.log('[sync] waiting for opponent to join contest');
        return;
      }

      const [playerA, playerB] = ids;
      const amA = me === playerA;

      // Try insert (first one to arrive creates the row)
      // Check if row exists
const { data: existing } = await supabase!
  .from('draft_lobby')
  .select('contest_id')
  .eq('contest_id', contestId)
  .maybeSingle();

if (existing) {
  // Just update my ready flag
  const patch: any = {};
  patch[amA ? 'player_a_ready' : 'player_b_ready'] = true;
  await supabase!
    .from('draft_lobby')
    .update(patch)
    .eq('contest_id', contestId);
} else {
  // First to arrive — insert
  await supabase!
    .from('draft_lobby')
    .insert({
      contest_id: contestId,
      player_a_id: playerA,
      player_b_id: playerB,
      player_a_ready: amA,
      player_b_ready: !amA,
    });
}

      console.log('[sync] marked ready');

      // Check current state (in case toss already happened)
      const { data: lobby } = await supabase!
        .from('draft_lobby')
        .select('first_picker')
        .eq('contest_id', contestId)
        .maybeSingle();

      if (lobby?.first_picker && !tossAppliedRef.current) {
        tossAppliedRef.current = true;
        useDraftStore.getState().recordToss(lobby.first_picker);
      }

      // Load any existing picks
      const { data: picks } = await supabase!
        .from('draft_picks')
        .select('user_id, player_id, pick_index')
        .eq('contest_id', contestId)
        .order('pick_index', { ascending: true });

      if (cancelled) return;

      for (const pick of picks ?? []) {
        const key = `${pick.pick_index}`;
        if (appliedPicksRef.current.has(key)) continue;
        appliedPicksRef.current.add(key);
        useDraftStore.getState().applyPickFromServer({
          userId: pick.user_id,
          playerId: pick.player_id,
          pickIndex: pick.pick_index,
        });
      }
    }

    markReady();

    // Realtime subscriptions
    const channel = supabase
      .channel(`draft-lobby:${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'draft_lobby',
          filter: `contest_id=eq.${contestId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row.first_picker && !tossAppliedRef.current) {
            tossAppliedRef.current = true;
            useDraftStore.getState().recordToss(row.first_picker);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'draft_lobby',
          filter: `contest_id=eq.${contestId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row.first_picker && !tossAppliedRef.current) {
            tossAppliedRef.current = true;
            useDraftStore.getState().recordToss(row.first_picker);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'draft_picks',
          filter: `contest_id=eq.${contestId}`,
        },
        (payload: any) => {
          const row = payload.new;
          const key = `${row.pick_index}`;
          if (appliedPicksRef.current.has(key)) return;
          appliedPicksRef.current.add(key);
          useDraftStore.getState().applyPickFromServer({
            userId: row.user_id,
            playerId: row.player_id,
            pickIndex: row.pick_index,
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, contestId]);
}