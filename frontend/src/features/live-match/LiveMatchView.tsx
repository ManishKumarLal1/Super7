import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useDraftStore } from '../draft/draftStore';
import { usePowersStore } from '../draft/powersStore';
import { useLiveMatchStore } from './liveMatchStore';
import { applyMultiplier, type PlayerMultipliers } from './pointsEngine';
import { generateBallEvent, resetMockMatch,rotateStrikeOnOverEnd,} from './mockEvents';
import { gsap } from '../../animations/gsap.config';
import { LiveScoreboard } from './components/LiveScoreboard';
import { HeadToHeadBar } from './components/HeadToHeadBar';
import { PlayerPointsRow } from './components/PlayerPointsRow';
import { EventTicker } from './components/EventTicker';
import { useMatchesStore } from '../wallet/matchesStore';
import { useMyContestsStore } from '../contests/myContestsStore';
  


export function LiveMatchView() {
  const [search] = useSearchParams();
  const stake = Number(search.get('stake') ?? 200);
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const completeEntry = useMyContestsStore((s) => s.completeEntry);
  const updateStatus = useMyContestsStore((s) => s.updateStatus);

  const players = useDraftStore((s) => s.players);
  const myPicks = useDraftStore((s) => s.myPicks);
  const opponentPicks = useDraftStore((s) => s.opponentPicks);
  const mySubstitute = useDraftStore((s) => s.mySubstitute);
  const opponentSubstitute = useDraftStore((s) => s.opponentSubstitute);

  const myCaptain = usePowersStore((s) => s.myCaptain);
  const myViceCaptain = usePowersStore((s) => s.myViceCaptain);
  const myPoison = usePowersStore((s) => s.myPoison);
  const opponentCaptain = usePowersStore((s) => s.opponentCaptain);
  const opponentViceCaptain = usePowersStore((s) => s.opponentViceCaptain);
  const opponentPoison = usePowersStore((s) => s.opponentPoison);

  const totalPoints = useLiveMatchStore((s) => s.totalPoints);
  const score = useLiveMatchStore((s) => s.score);
  const isComplete = useLiveMatchStore((s) => s.isComplete);
  const applyEvent = useLiveMatchStore((s) => s.applyEvent);
  const complete = useLiveMatchStore((s) => s.complete);



// Flip entry status to 'live' when the live match view opens
useEffect(() => {
  const entryId = sessionStorage.getItem('super7-entry-id');
  if (entryId) updateStatus(entryId, 'live');
}, [updateStatus]);



  // Entrance animation
  useGSAP(() => {
    gsap.from('.live-fade', {
      opacity: 0,
      y: 20,
      duration: 0.7,
      stagger: 0.06,
      ease: 'power3.out',
    });
  }, { scope: pageRef });

  // Helper to compute final points with multipliers
  const computePlayerPoints = (
    playerId: string,
    side: 'me' | 'opponent'
  ): { final: number; poisoned: boolean; transfer: number } => {
    const base = totalPoints[playerId] ?? 0;
    const isMe = side === 'me';

    const multipliers: PlayerMultipliers = {
      isCaptain: isMe ? playerId === myCaptain : playerId === opponentCaptain,
      isViceCaptain: isMe
        ? playerId === myViceCaptain
        : playerId === opponentViceCaptain,
      isPoisoned: isMe
        ? playerId === opponentPoison
        : playerId === myPoison,
    };

    const { final, poisonTransfer } = applyMultiplier(base, multipliers);
    return { final, poisoned: multipliers.isPoisoned, transfer: poisonTransfer };
  };

  const myBreakdown = useMemo(
    () =>
      myPicks.map((id) => {
        const player = players.find((p) => p.id === id)!;
        const { final, poisoned } = computePlayerPoints(id, 'me');
        const badge = id === myCaptain
          ? { label: 'C', color: 'bg-yellow-400 text-black' }
          : id === myViceCaptain
          ? { label: 'VC', color: 'bg-amber-300 text-black' }
          : undefined;
        return { player, points: final, badge, poisoned };
      }),
    [myPicks, players, totalPoints, myCaptain, myViceCaptain, opponentPoison]
  );

  const opponentBreakdown = useMemo(
    () =>
      opponentPicks.map((id) => {
        const player = players.find((p) => p.id === id)!;
        const { final, poisoned } = computePlayerPoints(id, 'opponent');
        const badge = id === opponentCaptain
          ? { label: 'C', color: 'bg-yellow-400 text-black' }
          : id === opponentViceCaptain
          ? { label: 'VC', color: 'bg-amber-300 text-black' }
          : undefined;
        return { player, points: final, badge, poisoned };
      }),
    [
      opponentPicks,
      players,
      totalPoints,
      opponentCaptain,
      opponentViceCaptain,
      myPoison,
    ]
  );

  // Poison transfers
  const myPoisonTransfer = useMemo(() => {
    if (!myPoison) return 0;
    return computePlayerPoints(myPoison, 'opponent').transfer;
  }, [myPoison, totalPoints]);

  const opponentPoisonTransfer = useMemo(() => {
    if (!opponentPoison) return 0;
    return computePlayerPoints(opponentPoison, 'me').transfer;
  }, [opponentPoison, totalPoints]);

  const myPoints =
    myBreakdown.reduce((sum, p) => sum + p.points, 0) + myPoisonTransfer;
  const opponentPoints =
    opponentBreakdown.reduce((sum, p) => sum + p.points, 0) + opponentPoisonTransfer;

  const iWon = myPoints > opponentPoints;
  const tied = myPoints === opponentPoints;

  

  const settleContest = useMatchesStore((s) => s.settleContest);
const activeContest = useMatchesStore((s) => s.active);

  useEffect(() => {
  if (!isComplete) return;
  if (!activeContest) return;

  const result: 'won' | 'lost' | 'tied' =
    myPoints > opponentPoints ? 'won' : myPoints < opponentPoints ? 'lost' : 'tied';

  (async () => {
    try {
      await settleContest({
        result,
        myPoints,
        opponentPoints,
        details: {
          myPicks,
          opponentPicks,
          mySubstitute,
          opponentSubstitute,
          myCaptain,
          myViceCaptain,
          myPoison,
          opponentCaptain,
          opponentViceCaptain,
          opponentPoison,
          basePoints: { ...totalPoints },
        },
      });

      // Mark the contest entry as completed
      const entryId = sessionStorage.getItem('super7-entry-id');
      if (entryId) {
        await completeEntry(entryId, result, myPoints, opponentPoints);
        sessionStorage.removeItem('super7-entry-id');
      }
    } catch (err) {
      console.error('settleContest failed:', err);
    }
  })();
}, [
  isComplete,
  activeContest,
  myPoints,
  opponentPoints,
  settleContest,
  completeEntry,
  myPicks,
  opponentPicks,
  mySubstitute,
  opponentSubstitute,
  myCaptain,
  myViceCaptain,
  myPoison,
  opponentCaptain,
  opponentViceCaptain,
  opponentPoison,
  totalPoints,
]);

  return (
    <div ref={pageRef} className="min-h-screen bg-black pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Top bar */}
        <div className="live-fade mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/contests')}
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Back to contests
          </button>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
            <span className="text-yellow-400">●</span>
            <span className="text-sm font-semibold text-white">
              {stake} at stake
            </span>
          </div>
        </div>

        {/* Match state */}
        <div className="live-fade mb-4">
          <LiveScoreboard />
        </div>

        {/* Head-to-head */}
        <div className="live-fade mb-8">
          <HeadToHeadBar myPoints={myPoints} opponentPoints={opponentPoints} />
        </div>

        {/* End banner */}
        {isComplete && (
          <div
            className={`live-fade mb-8 rounded-3xl border p-8 text-center ${
              iWon
                ? 'border-emerald-400/30 bg-emerald-400/[0.06]'
                : tied
                ? 'border-white/10 bg-white/[0.04]'
                : 'border-rose-400/30 bg-rose-400/[0.06]'
            }`}
          >
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">
              Match complete
            </div>
            <h2
              className={`mt-3 text-4xl font-bold ${
                iWon ? 'text-emerald-400' : tied ? 'text-white' : 'text-rose-400'
              }`}
            >
              {iWon ? 'You won!' : tied ? 'Tied match' : 'You lost'}
            </h2>
            <p className="mt-3 text-white/60">
              {iWon
                ? `You take the pot: ${stake * 2} coins`
                : tied
                ? 'Stakes refunded'
                : `Opponent takes the pot: ${stake * 2} coins`}
            </p>
            <button
              onClick={() => navigate('/contests')}
              className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:scale-105"
            >
              Find another match →
            </button>
          </div>
        )}

        {/* Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="live-fade space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Your players
            </div>
            {myBreakdown.map((row) => (
              <PlayerPointsRow
                key={row.player.id}
                player={row.player}
                points={row.points}
                badge={row.badge}
                poisoned={row.poisoned}
              />
            ))}
            {myPoisonTransfer > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-500/[0.06] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-sm">
                    ☠
                  </div>
                  <div className="text-sm font-medium text-purple-300">
                    Poison steal
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-300">
                  +{myPoisonTransfer.toFixed(1)}
                </div>
              </div>
            )}
          </div>

          <div className="live-fade space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">
              Opponent players
            </div>
            {opponentBreakdown.map((row) => (
              <PlayerPointsRow
                key={row.player.id}
                player={row.player}
                points={row.points}
                badge={row.badge}
                poisoned={row.poisoned}
              />
            ))}
            {opponentPoisonTransfer > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-500/[0.06] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-sm">
                    ☠
                  </div>
                  <div className="text-sm font-medium text-purple-300">
                    They stole from you
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-300">
                  +{opponentPoisonTransfer.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ticker */}
        <div className="live-fade mt-8">
          <EventTicker />
        </div>
      </div>
    </div>
  );
}