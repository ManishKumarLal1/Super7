import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  useDraftStore,
  currentSide,
  TOTAL_PICKS,
  getDraftSupabase,
} from './draftStore';
import { gsap } from '../../animations/gsap.config';
import { SquadPool } from './components/SquadPool';
import { PicksPanel } from './components/PicksPanel';
import { TurnIndicator } from './components/TurnIndicator';
import { CoinToss } from './components/CoinToss';
import { PowersScreen } from './components/PowersScreen';
import { useMyContestsStore } from '../contests/myContestsStore';
import { useContestsStore } from '../contests/contestsStore';
import { useDraftSync } from './useDraftSync';
import { useSupabase } from '../../lib/useSupabase';
import { setPowersSupabase } from './powersStore';

async function resyncPicks(supabase: any, contestId: string) {
  const { data: picks } = await supabase
    .from('draft_picks')
    .select('user_id, player_id, pick_index')
    .eq('contest_id', contestId)
    .order('pick_index', { ascending: true });

  // Reset local picks then re-apply everything from DB
  useDraftStore.setState({
    myPicks: [],
    opponentPicks: [],
    pickIndex: 0,
    phase: 'drafting',
    substituteTurn: null,
  });

  const me = (window as any).Clerk?.user?.id;
  for (const pick of picks ?? []) {
    useDraftStore.getState().applyPickFromServer({
      userId: pick.user_id,
      playerId: pick.player_id,
      pickIndex: pick.pick_index,
    });
  }
}

export function DraftRoom() {
  const { matchId } = useParams<{ matchId: string }>();
  const [search] = useSearchParams();
  const stake = Number(search.get('stake') ?? 200);
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const contestId = useContestsStore((s) => s.active?.id ?? null);
  useDraftSync(contestId);

  const initDraft = useDraftStore((s) => s.initDraft);
  const phase = useDraftStore((s) => s.phase);
  const firstPicker = useDraftStore((s) => s.firstPicker);
  const pickIndex = useDraftStore((s) => s.pickIndex);
  const substituteTurn = useDraftStore((s) => s.substituteTurn);
  const tossCoin = useDraftStore((s) => s.tossCoin);

  const updateStatus = useMyContestsStore((s) => s.updateStatus);

  // Init once — only when matchId changes (not on every remount)
  useEffect(() => {
    if (!matchId) return;
    const current = useDraftStore.getState().matchId;
    if (current !== matchId) {
      initDraft(matchId, stake);
    }
  }, [matchId, stake, initDraft]);

  // Flip entry status to 'drafting'
  useEffect(() => {
    const entryId = sessionStorage.getItem('super7-entry-id');
    if (entryId) updateStatus(entryId, 'drafting');
  }, [updateStatus]);

  // Compute turn BEFORE defining handlePick
  const currentTurnSide =
    phase === 'drafting'
      ? currentSide(pickIndex, firstPicker)
      : phase === 'substitute'
      ? substituteTurn ?? 'me'
      : 'me';

  const isMyTurn =
    (phase === 'drafting' && currentTurnSide === 'me') ||
    (phase === 'substitute' && substituteTurn === 'me');

  const handlePick = async (playerId: string) => {
  if (!isMyTurn || !contestId) return;
  const me = (window as any).Clerk?.user?.id;
  if (!me) return;

  const supabase = getDraftSupabase();
  if (!supabase) return;

  const state = useDraftStore.getState();
  const isSub = state.phase === 'substitute';

  // Sub pick index: 14 for firstPicker, 15 for the other
  const pickIndexNow = isSub
    ? state.firstPicker === 'me'
      ? 14
      : 15
    : state.pickIndex;

  const { error } = await supabase.from('draft_picks').insert({
    contest_id: contestId,
    user_id: me,
    player_id: playerId,
    pick_index: pickIndexNow,
  });

  if (error) {
  if (error.code === '23505') {
    console.warn('[pick] duplicate, resyncing');
    await resyncPicks(supabase, contestId);
  } else {
    console.error('[pick] FAILED:', error);
  }
  return;
}

  // Optimistic apply — realtime will also fire, but idempotency guards prevent double
  useDraftStore.getState().applyPickFromServer({
    userId: me,
    playerId,
    pickIndex: pickIndexNow,
  });
};

  // Guarded entrance animation
  useGSAP(() => {
    if (phase !== 'drafting' && phase !== 'substitute') return;
    gsap.from('.draft-fade', {
      opacity: 0,
      y: 20,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
    });
  }, { scope: pageRef, dependencies: [phase] });

  const handleTimeout = () => {
    if (!isMyTurn) return;
    const state = useDraftStore.getState();
    const taken = new Set([...state.myPicks, ...state.opponentPicks]);
    const available = state.players.filter((p) => !taken.has(p.id));
    if (available.length === 0) return;
    const random = available[Math.floor(Math.random() * available.length)];
    if (phase === 'drafting') handlePick(random.id);
    else if (phase === 'substitute') state.pickSubstitute(random.id);
  };

  const supabase = useSupabase();
useEffect(() => {
  if (supabase) setPowersSupabase(supabase);
}, [supabase]);

  return (
    <div ref={pageRef} className="min-h-screen bg-black pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-6">
        {phase === 'lobby' && (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
    <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
      Draft lobby
    </div>
    <h2 className="mt-4 text-3xl font-bold text-white">
      Waiting for your opponent…
    </h2>
    <p className="mt-3 max-w-md text-white/50">
      You're in. The coin toss will fire automatically the moment both players
      enter the room.
    </p>
    <div className="mt-10 flex gap-3">
      <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-2 text-sm font-semibold text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        You
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/40">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30" />
        Opponent
      </div>
    </div>
  </div>
)}

{phase === 'toss' && (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
    <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
      Coin toss
    </div>
    <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
      {firstPicker === 'me' ? 'You pick first!' : 'Opponent picks first'}
    </h2>
    <p className="mt-3 text-white/50">
      Draft begins in a moment…
    </p>
    <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-white/10">
      <div className="h-full animate-[shrink_2.5s_linear] bg-emerald-400" />
    </div>
  </div>
)}

        {(phase === 'drafting' || phase === 'substitute') && (
          <>
            <div className="draft-fade mb-8 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate('/contests')}
                className="flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
              >
                ← Back to contests
              </button>

              <TurnIndicator
                side={currentTurnSide}
                pickNumber={
                  phase === 'substitute'
                    ? 8
                    : Math.min(pickIndex + 1, TOTAL_PICKS)
                }
                totalPicks={phase === 'substitute' ? 8 : TOTAL_PICKS}
                isSubstitutePhase={phase === 'substitute'}
                onTimeout={handleTimeout}
                resetKey={phase === 'substitute' ? 1000 : pickIndex}
              />

              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
                <span className="text-yellow-400">●</span>
                <span className="text-sm font-semibold text-white">
                  {stake} at stake
                </span>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="draft-fade min-h-[600px] rounded-3xl border border-white/10 bg-white/[0.01] p-6">
                <SquadPool onPick={handlePick} />
              </div>

              <div className="draft-fade space-y-8">
                <PicksPanel side="me" title="Your Super 7" accent="text-emerald-400" />
                <PicksPanel side="opponent" title="Opponent" accent="text-rose-400" />
              </div>
            </div>
          </>
        )}

        {phase === 'powers' && contestId && matchId && (
  <PowersScreen contestId={contestId} matchId={matchId} stake={stake} />
)}
      </div>
    </div>
  );
}