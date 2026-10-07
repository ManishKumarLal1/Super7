import { useEffect, useRef } from 'react';
import { useLiveMatchStore } from './liveMatchStore';
import { useMatchesStore } from '../wallet/matchesStore';
import { useContestsStore } from '../contests/contestsStore';
import { useDraftStore } from '../draft/draftStore';
import { useSupabase } from '../../lib/useSupabase';
import type { BallEvent } from './pointsEngine';

const POLL_INTERVAL_MS = 3000;

function rowToEvent(row: any): BallEvent & { seq: number } {
  const p = row.payload ?? {};
  return {
    id: p.id ?? String(row.id),
    seq: row.id,
    over: p.over ?? 0,
    ballInOver: p.ballInOver ?? 1,
    batsmanId: p.batsmanId,
    bowlerId: p.bowlerId,
    runs: p.runs ?? 0,
    isWicket: p.isWicket ?? false,
    wicketType: p.wicketType,
    fielderId: p.fielderId,
    isWide: p.isWide ?? false,
    description: p.description ?? '',
  };
}

export function useLiveMatchEngine() {
  const supabase = useSupabase();
  const players = useDraftStore((s) => s.players);

  const matchesMatchId = useMatchesStore((s) => s.active?.matchId);
  const contestMatchId = useContestsStore((s) => s.active?.matchId);
  const activeMatchId = matchesMatchId ?? contestMatchId;

  const bootedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase || !activeMatchId) return;
    if (bootedRef.current === activeMatchId) return;
    bootedRef.current = activeMatchId;

    const matchId = activeMatchId;
    const sb = supabase;

    let cancelled = false;
    let pollTimer: number | null = null;
    let channel: any = null;

    async function boot() {
      const me = (window as any).Clerk?.user?.id;
      if (!me) return;

      const { data: existingState } = await sb
        .from('match_state')
        .select('match_id, is_complete')
        .eq('match_id', matchId)
        .maybeSingle();

      if (cancelled) return;

      if (!existingState) {
        const battingOrder = players.filter((p) => p.team === 'IND').map((p) => p.id);
        const bowlingOrder = players
          .filter((p) => p.team === 'AUS' && (p.role === 'BOWL' || p.role === 'AR'))
          .map((p) => p.id);

        await sb.rpc('start_match_if_needed', {
          p_match_id: matchId,
          p_batting_order: battingOrder,
          p_bowling_order: bowlingOrder,
        });
      }

      if (cancelled) return;

      useLiveMatchStore.getState().startMatch(matchId, `live-${Date.now()}`);

      // Replay events
      const { data: allEvents } = await sb
        .from('match_events')
        .select('id, payload')
        .eq('match_id', matchId)
        .order('id', { ascending: true });

      if (cancelled) return;

      if (allEvents && allEvents.length > 0) {
        useLiveMatchStore.getState().rebuildFromEvents(allEvents.map(rowToEvent));
        console.log('[engine] replayed events:', allEvents.length);
      }

      // Force-sync score from match_state
      const { data: stateSnapshot } = await sb
        .from('match_state')
        .select('runs, wickets, current_over, is_complete')
        .eq('match_id', matchId)
        .maybeSingle();

      if (cancelled) return;

      if (stateSnapshot) {
        useLiveMatchStore.setState({
          score: {
            runs: stateSnapshot.runs,
            wickets: stateSnapshot.wickets,
            balls: stateSnapshot.current_over * 6,
          },
        });
        console.log('[engine] score synced from server:', stateSnapshot);
      }

      if (existingState?.is_complete || stateSnapshot?.is_complete) {
        useLiveMatchStore.getState().complete();
        return;
      }

      // Subscribe to events
      channel = sb
        .channel(`match:${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'match_events',
            filter: `match_id=eq.${matchId}`,
          },
          (payload: any) => {
            const row = payload.new;
            const store = useLiveMatchStore.getState();
            if (row.id <= store.lastEventSeq) return;
            store.applyEvent(rowToEvent(row));
            store.setLastEventSeq(row.id);
          }
        )
        .subscribe((status: string) => {
          console.log('[engine] realtime status:', status);
        });

      // Poll
      async function poll() {
        if (cancelled) return;
        if (useLiveMatchStore.getState().isComplete) return;

        const { data, error } = await sb.rpc('simulate_over', {
          p_match_id: matchId,
        });

        if (cancelled) return;

        if (error) {
          console.warn('[engine] simulate_over error:', error);
        } else if (data?.skipped && data.reason === 'complete') {
          useLiveMatchStore.getState().complete();
          return;
        } else if (data?.success) {
          console.log('[engine] over simulated:', {
            over: data.over,
            runs: data.runs,
            wickets: data.wickets,
          });
        }

        const { data: stateRow } = await sb
          .from('match_state')
          .select('runs, wickets, current_over, is_complete')
          .eq('match_id', matchId)
          .maybeSingle();

        if (cancelled) return;

        if (stateRow) {
          useLiveMatchStore.setState({
            score: {
              runs: stateRow.runs,
              wickets: stateRow.wickets,
              balls: stateRow.current_over * 6,
            },
          });
        }

        if (stateRow?.is_complete) {
          useLiveMatchStore.getState().complete();
          return;
        }

        pollTimer = window.setTimeout(poll, POLL_INTERVAL_MS);
      }

      poll();
    }

    boot();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (channel) sb.removeChannel(channel);
      bootedRef.current = null;
    };
  }, [supabase, activeMatchId, players]);
}