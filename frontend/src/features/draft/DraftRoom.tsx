import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useDraftStore, currentSide, TOTAL_PICKS } from './draftStore';
import { gsap } from '../../animations/gsap.config';
import { SquadPool } from './components/SquadPool';
import { PicksPanel } from './components/PicksPanel';
import { TurnIndicator } from './components/TurnIndicator';
import { CoinToss } from './components/CoinToss';
import { PowersScreen } from './components/PowersScreen';
import { useMyContestsStore } from '../contests/myContestsStore';

export function DraftRoom() {
  const { matchId } = useParams<{ matchId: string }>();
  const [search] = useSearchParams();
  const stake = Number(search.get('stake') ?? 200);
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const initDraft = useDraftStore((s) => s.initDraft);
  const phase = useDraftStore((s) => s.phase);
  const firstPicker = useDraftStore((s) => s.firstPicker);
  const pickIndex = useDraftStore((s) => s.pickIndex);
  const substituteTurn = useDraftStore((s) => s.substituteTurn);
  const tossCoin = useDraftStore((s) => s.tossCoin);
  const simulateOpponentPick = useDraftStore((s) => s.simulateOpponentPick);
  const simulateOpponentSubstitute = useDraftStore(
    (s) => s.simulateOpponentSubstitute
  );

  const updateStatus = useMyContestsStore((s) => s.updateStatus);

useEffect(() => {
  const entryId = sessionStorage.getItem('super7-entry-id');
  if (entryId) updateStatus(entryId, 'live');
}, [updateStatus]);

  // Init once
  useEffect(() => {
    if (matchId) initDraft(matchId, stake);
  }, [matchId, stake, initDraft]);

  // Opponent simulation
  useEffect(() => {
    if (phase === 'drafting') {
      const side = currentSide(pickIndex, firstPicker);
      if (side !== 'opponent') return;
      const t = setTimeout(simulateOpponentPick, 1800 + Math.random() * 1200);
      return () => clearTimeout(t);
    }

    if (phase === 'substitute' && substituteTurn === 'opponent') {
      const t = setTimeout(
        simulateOpponentSubstitute,
        1800 + Math.random() * 1000
      );
      return () => clearTimeout(t);
    }
  }, [
    phase,
    pickIndex,
    firstPicker,
    substituteTurn,
    simulateOpponentPick,
    simulateOpponentSubstitute,
  ]);

  // Guarded entrance animation — only when draft elements exist
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

  const currentTurnSide =
    phase === 'drafting'
      ? currentSide(pickIndex, firstPicker)
      : phase === 'substitute'
      ? substituteTurn ?? 'me'
      : 'me';

  const isMyTurn =
    (phase === 'drafting' && currentTurnSide === 'me') ||
    (phase === 'substitute' && substituteTurn === 'me');

  const handleTimeout = () => {
    if (!isMyTurn) return;
    const state = useDraftStore.getState();
    const taken = new Set([...state.myPicks, ...state.opponentPicks]);
    const available = state.players.filter((p) => !taken.has(p.id));
    if (available.length === 0) return;
    const random = available[Math.floor(Math.random() * available.length)];
    if (phase === 'drafting') state.pickPlayer(random.id);
    else if (phase === 'substitute') state.pickSubstitute(random.id);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-black pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-6">
        {phase === 'toss' && <CoinToss onResult={tossCoin} />}

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
                <SquadPool />
              </div>

              <div className="draft-fade space-y-8">
                <PicksPanel side="me" title="Your Super 7" accent="text-emerald-400" />
                <PicksPanel side="opponent" title="Opponent" accent="text-rose-400" />
              </div>
            </div>
          </>
        )}

        {phase === 'powers' && <PowersScreen />}
      </div>
    </div>
  );
}