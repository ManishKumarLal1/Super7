import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { findMatchById } from '../features/wallet/matchesStore';
import { useDraftStore } from '../features/draft/draftStore';
import { applyMultiplier } from '../features/live-match/pointsEngine';

const RESULT_STYLES = {
  won: {
    label: 'Won',
    badge: 'bg-emerald-400/10 text-emerald-400',
    accent: 'text-emerald-400',
  },
  lost: {
    label: 'Lost',
    badge: 'bg-rose-400/10 text-rose-400',
    accent: 'text-rose-400',
  },
  tied: {
    label: 'Tied',
    badge: 'bg-white/10 text-white/60',
    accent: 'text-white',
  },
};

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const match = useMemo(() => (id ? findMatchById(id) : null), [id]);
  const players = useDraftStore((s) => s.players);

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <div className="text-white/60">
          This match isn't available anymore.
        </div>
        <Link
          to="/history"
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Back to history
        </Link>
      </div>
    );
  }

  const style = RESULT_STYLES[match.result];

  // Old matches saved before the drill-down feature won't have details
  if (!match.details) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-24">
        <div className="mx-auto max-w-2xl px-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 text-sm text-white/50 transition hover:text-white"
          >
            ← Back
          </button>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <div className={`text-xs uppercase tracking-[0.3em] ${style.accent}`}>
              {style.label}
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white">
              {match.matchId}
            </h1>
            <p className="mt-3 text-white/50">
              Detailed breakdown not available for this match.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-2xl font-bold">
              <span className="text-emerald-400">{match.myPoints.toFixed(1)}</span>
              <span className="text-white/30">–</span>
              <span className="text-rose-400">{match.opponentPoints.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { details } = match;
  const {
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
    basePoints,
  } = details;

  const findPlayer = (pid: string | null) =>
    pid ? players.find((p) => p.id === pid) : undefined;

  // Compute final points + poison transfer per player
  const computePoints = (pid: string, side: 'me' | 'opponent') => {
  const base = basePoints[pid] ?? 0;
  const isMe = side === 'me';
  const multipliers = {
    isCaptain: isMe ? pid === myCaptain : pid === opponentCaptain,
    isViceCaptain: isMe ? pid === myViceCaptain : pid === opponentViceCaptain,
    isPoisoned: isMe ? pid === opponentPoison : pid === myPoison,
  };
  const { final, poisonTransfer } = applyMultiplier(base, multipliers);
  return { final, poisonTransfer, poisoned: multipliers.isPoisoned };
};

  const buildRows = (side: 'me' | 'opponent') => {
    const picks = side === 'me' ? myPicks : opponentPicks;
    const sub = side === 'me' ? mySubstitute : opponentSubstitute;
    const captain = side === 'me' ? myCaptain : opponentCaptain;
    const vc = side === 'me' ? myViceCaptain : opponentViceCaptain;

    return picks.map((pid) => {
      const player = findPlayer(pid);
      const { final, poisoned } = computePoints(pid, side);
      const badge =
        pid === captain
          ? { label: 'C', color: 'bg-yellow-400 text-black' }
          : pid === vc
          ? { label: 'VC', color: 'bg-amber-300 text-black' }
          : undefined;
      return { player, pid, points: final, poisoned, badge, isSub: false };
    }).concat(
      sub && findPlayer(sub)
        ? [{
            player: findPlayer(sub)!,
            pid: sub,
            points: basePoints[sub] ?? 0,
            poisoned: false,
            badge: { label: 'S', color: 'bg-amber-400/30 text-amber-200' },
            isSub: true,
          }]
        : []
    );
  };

  const myRows = buildRows('me');
  const opponentRows = buildRows('opponent');

  const myPoisonTransfer = myPoison
    ? computePoints(myPoison, 'opponent').poisonTransfer
    : 0;
  const opponentPoisonTransfer = opponentPoison
    ? computePoints(opponentPoison, 'me').poisonTransfer
    : 0;

  const myTotal = myRows.reduce((s, r) => s + r.points, 0) + myPoisonTransfer;
  const opponentTotal =
    opponentRows.reduce((s, r) => s + r.points, 0) + opponentPoisonTransfer;

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-sm text-white/50 transition hover:text-white"
        >
          ← Back
        </button>

        {/* Header */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-8 ${
            match.result === 'won'
              ? 'border-emerald-400/30 bg-emerald-400/[0.06]'
              : match.result === 'lost'
              ? 'border-rose-400/30 bg-rose-400/[0.06]'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${style.badge}`}
                >
                  {style.label}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  {new Date(match.timestamp).toLocaleString()}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white">
                {match.matchId}
              </h1>
              <div className="mt-1 text-sm text-white/50">
                {match.stake} coins stake
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400">
                  You
                </div>
                <div className="text-4xl font-bold text-emerald-400">
                  {myTotal.toFixed(1)}
                </div>
              </div>
              <div className="text-white/20 text-2xl">–</div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-rose-400">
                  Opponent
                </div>
                <div className="text-4xl font-bold text-rose-400">
                  {opponentTotal.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm">
            <span className="text-white/50">Payout: </span>
            <span
              className={
                match.result === 'won'
                  ? 'text-emerald-400 font-semibold'
                  : match.result === 'tied'
                  ? 'text-white/70'
                  : 'text-rose-400 font-semibold'
              }
            >
              {match.result === 'won'
                ? `+${match.payout - match.stake} coins`
                : match.result === 'tied'
                ? 'Stake refunded'
                : `-${match.stake} coins`}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <TeamBreakdown
            title="Your Super 7"
            accent="text-emerald-400"
            rows={myRows}
            poisonLabel={myPoisonTransfer > 0 ? `Poison steal +${myPoisonTransfer.toFixed(1)}` : null}
            poisonTransfer={myPoisonTransfer}
            isPoisonSteal={true}
          />
          <TeamBreakdown
            title="Opponent"
            accent="text-rose-400"
            rows={opponentRows}
            poisonLabel={
              opponentPoisonTransfer > 0
                ? `They stole +${opponentPoisonTransfer.toFixed(1)}`
                : null
            }
            poisonTransfer={opponentPoisonTransfer}
            isPoisonSteal={false}
          />
        </div>
      </div>
    </div>
  );
}

type Row = {
  player?: { id: string; name: string; shortName: string; team: string; role: string };
  pid: string;
  points: number;
  poisoned: boolean;
  badge?: { label: string; color: string };
  isSub: boolean;
};

function TeamBreakdown({
  title,
  accent,
  rows,
  poisonLabel,
  poisonTransfer,
  isPoisonSteal,
}: {
  title: string;
  accent: string;
  rows: Row[];
  poisonLabel: string | null;
  poisonTransfer: number;
  isPoisonSteal: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${accent}`}>
        {title}
      </div>
      {rows.map((row) => (
        <div
          key={row.pid}
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            row.poisoned
              ? 'border-purple-500/30 bg-purple-500/[0.06]'
              : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/70 ring-1 ring-white/10">
              {row.player
                ? row.player.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
                : '??'}
            </div>
            {row.badge && (
              <div
                className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${row.badge.color}`}
              >
                {row.badge.label}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">
              {row.player?.shortName ?? row.pid}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              {row.player?.team} · {row.player?.role}
              {row.isSub && ' · SUBSTITUTE'}
              {row.poisoned && ' · POISONED'}
            </div>
          </div>

          <div
            className={`text-right text-lg font-bold ${
              row.poisoned ? 'text-purple-300' : 'text-white'
            }`}
          >
            {row.points.toFixed(1)}
          </div>
        </div>
      ))}

      {poisonLabel && (
        <div className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-sm">
              ☠
            </div>
            <div className="text-sm font-medium text-purple-300">
              {isPoisonSteal ? 'Poison steal' : 'Poison stolen'}
            </div>
          </div>
          <div className="text-lg font-bold text-purple-300">
            +{poisonTransfer.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
}