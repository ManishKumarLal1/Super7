import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMyContestsStore } from '../features/contests/myContestsStore';
import { useMatchesStore } from '../features/wallet/matchesStore';
import { useLiveMatchStore } from '../features/live-match/liveMatchStore';
import { useDraftStore } from '../features/draft/draftStore';
import { usePowersStore } from '../features/draft/powersStore';
import { applyMultiplier } from '../features/live-match/pointsEngine';

type ReportRow = {
  playerId: string;
  shortName: string;
  name: string;
  team: string;
  role: string;
  points: number;
  basePoints: number;
  poisoned: boolean;
  badge?: { label: string; color: string };
  isSub: boolean;
  owner: 'me' | 'opponent';
};

export function MatchReportPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();

  const entries = useMyContestsStore((s) => s.entries);
  const entry = entries.find((e) => e.id === entryId);

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

  const liveTotalPoints = useLiveMatchStore((s) => s.totalPoints);
  const liveMatchId = useLiveMatchStore((s) => s.matchId);
  const history = useMatchesStore((s) => s.history);

  // Build the report data
  const report = useMemo(() => {
    if (!entry) return null;

    const isCompleted = entry.status === 'completed';

    // Find the completed match record for completed entries
    const historyMatch = isCompleted
      ? [...history].find((h) => h.matchId === entry.matchId)
      : null;

    // Determine source of picks + powers + base points
    const source =
      isCompleted && historyMatch?.details
        ? {
            myPicks: historyMatch.details.myPicks,
            opponentPicks: historyMatch.details.opponentPicks,
            mySubstitute: historyMatch.details.mySubstitute,
            opponentSubstitute: historyMatch.details.opponentSubstitute,
            myCaptain: historyMatch.details.myCaptain,
            myViceCaptain: historyMatch.details.myViceCaptain,
            myPoison: historyMatch.details.myPoison,
            opponentCaptain: historyMatch.details.opponentCaptain,
            opponentViceCaptain: historyMatch.details.opponentViceCaptain,
            opponentPoison: historyMatch.details.opponentPoison,
            basePoints: historyMatch.details.basePoints,
          }
        : {
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
            basePoints: liveMatchId === entry.matchId ? liveTotalPoints : {},
          };

    const findPlayer = (id: string | null) =>
      id ? players.find((p) => p.id === id) : undefined;

    const computePoints = (pid: string, side: 'me' | 'opponent') => {
      const base = source.basePoints[pid] ?? 0;
      const isMe = side === 'me';
      const multipliers = {
        isCaptain: isMe ? pid === source.myCaptain : pid === source.opponentCaptain,
        isViceCaptain: isMe
          ? pid === source.myViceCaptain
          : pid === source.opponentViceCaptain,
        isPoisoned: isMe ? pid === source.opponentPoison : pid === source.myPoison,
      };
      const { final, poisonTransfer } = applyMultiplier(base, multipliers);
      return { final, base, poisoned: multipliers.isPoisoned, transfer: poisonTransfer };
    };

    const buildRows = (side: 'me' | 'opponent'): ReportRow[] => {
      const picks = side === 'me' ? source.myPicks : source.opponentPicks;
      const sub = side === 'me' ? source.mySubstitute : source.opponentSubstitute;
      const captain = side === 'me' ? source.myCaptain : source.opponentCaptain;
      const vc = side === 'me' ? source.myViceCaptain : source.opponentViceCaptain;

      const rows = picks
        .map((pid) => {
          const player = findPlayer(pid);
          if (!player) return null;
          const { final, base, poisoned } = computePoints(pid, side);
          const badge =
            pid === captain
              ? { label: 'C', color: 'bg-yellow-400 text-black' }
              : pid === vc
              ? { label: 'VC', color: 'bg-amber-300 text-black' }
              : undefined;
          return {
            playerId: pid,
            shortName: player.shortName,
            name: player.name,
            team: player.team,
            role: player.role,
            points: final,
            basePoints: base,
            poisoned,
            badge,
            isSub: false,
            owner: side,
          } as ReportRow;
        })
        .filter(Boolean) as ReportRow[];

      if (sub) {
        const subPlayer = findPlayer(sub);
        if (subPlayer) {
          rows.push({
            playerId: sub,
            shortName: subPlayer.shortName,
            name: subPlayer.name,
            team: subPlayer.team,
            role: subPlayer.role,
            points: source.basePoints[sub] ?? 0,
            basePoints: source.basePoints[sub] ?? 0,
            poisoned: false,
            badge: { label: 'S', color: 'bg-amber-400/30 text-amber-200' },
            isSub: true,
            owner: side,
          });
        }
      }

      return rows.sort((a, b) => b.points - a.points);
    };

    const myRows = buildRows('me');
    const opponentRows = buildRows('opponent');

    const myPoisonTransfer = source.myPoison
      ? computePoints(source.myPoison, 'opponent').transfer
      : 0;
    const opponentPoisonTransfer = source.opponentPoison
      ? computePoints(source.opponentPoison, 'me').transfer
      : 0;

    const myTotal =
      myRows.reduce((s, r) => s + r.points, 0) + myPoisonTransfer;
    const opponentTotal =
      opponentRows.reduce((s, r) => s + r.points, 0) + opponentPoisonTransfer;

    return {
      isCompleted,
      myRows,
      opponentRows,
      myTotal,
      opponentTotal,
      myPoisonTransfer,
      opponentPoisonTransfer,
      result: entry.result ?? (myTotal > opponentTotal ? 'won' : myTotal < opponentTotal ? 'lost' : 'tied'),
    };
  }, [
    entry,
    history,
    players,
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
    liveTotalPoints,
    liveMatchId,
  ]);

  if (!entry || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <div className="text-white/60">Match report not available.</div>
        <Link
          to="/my-contests"
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Back to My Contests
        </Link>
      </div>
    );
  }

  const { myRows, opponentRows, myTotal, opponentTotal, result } = report;
  const won = result === 'won';
  const lost = result === 'lost';

  // Combined list — both sides, sorted by points
  const allRows: ReportRow[] = [...myRows, ...opponentRows].sort(
    (a, b) => b.points - a.points
  );

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-sm text-white/50 transition hover:text-white"
        >
          ← Back
        </button>

        {/* Header */}
        <div
          className={`rounded-3xl border p-8 ${
            won
              ? 'border-emerald-400/30 bg-emerald-400/[0.06]'
              : lost
              ? 'border-rose-400/30 bg-rose-400/[0.06]'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                    won
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : lost
                      ? 'bg-rose-400/10 text-rose-400'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {entry.status === 'completed' ? result : 'Live'}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Match report
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white">
                {entry.matchId}
              </h1>
              <div className="mt-1 text-sm text-white/50">
                {entry.stake === 0 ? 'Free entry' : `${entry.stake} coins staked`}
              </div>
            </div>

            <div className="flex items-baseline gap-6">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400">
                  You
                </div>
                <div className="text-4xl font-bold text-emerald-400">
                  {myTotal.toFixed(1)}
                </div>
              </div>
              <div className="text-2xl text-white/20">–</div>
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
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <SummaryCard label="Your players" value={myRows.length} />
          <SummaryCard
            label="Top scorer"
            value={
              allRows[0]
                ? `${allRows[0].shortName} · ${allRows[0].points.toFixed(0)}`
                : '—'
            }
          />
          <SummaryCard
            label="Poison swap"
            value={`${
              report.myPoisonTransfer > 0
                ? `+${report.myPoisonTransfer.toFixed(1)}`
                : '0'
            } / -${report.opponentPoisonTransfer.toFixed(1)}`}
          />
        </div>

        {/* Full player breakdown */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">
              All players · ranked by points
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/30">
              {allRows.length} players
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {allRows.map((row, i) => (
              <ReportRowView
                key={`${row.owner}-${row.playerId}`}
                row={row}
                isLast={i === allRows.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest text-white/40">
          <LegendItem color="bg-emerald-400/20 text-emerald-300" label="You" />
          <LegendItem color="bg-rose-400/20 text-rose-300" label="Opponent" />
          <LegendItem color="bg-yellow-400 text-black" label="Captain" />
          <LegendItem color="bg-amber-300 text-black" label="Vice-Captain" />
          <LegendItem color="bg-purple-500 text-white" label="Poisoned" />
          <LegendItem color="bg-amber-400/30 text-amber-200" label="Substitute" />
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/my-contests"
            className="flex-1 rounded-2xl border border-white/10 py-4 text-center text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            Back to My Contests
          </Link>
          <Link
            to="/contests"
            className="flex-1 rounded-2xl bg-emerald-400 py-4 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Play again →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReportRowView({ row, isLast }: { row: ReportRow; isLast: boolean }) {
  const isMe = row.owner === 'me';

  return (
    <div
      className={`flex items-center gap-4 p-4 ${
        !isLast ? 'border-b border-white/5' : ''
      } ${row.poisoned ? 'bg-purple-500/[0.04]' : ''}`}
    >
      {/* Owner pill */}
      <span
        className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
          isMe
            ? 'bg-emerald-400/20 text-emerald-300'
            : 'bg-rose-400/20 text-rose-300'
        }`}
      >
        {isMe ? 'You' : 'Opp'}
      </span>

      {/* Avatar + badge */}
      <div className="relative flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/70 ring-1 ring-white/10">
          {row.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)}
        </div>
        {row.badge && (
          <div
            className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${row.badge.color}`}
          >
            {row.badge.label}
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">
            {row.shortName}
          </span>
          {row.poisoned && <span className="text-xs">☠</span>}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          {row.team} · {row.role}
          {row.isSub && ' · SUB'}
        </div>
      </div>

      {/* Multiplier badge */}
      <div className="text-right text-[10px] uppercase tracking-widest text-white/40">
        {row.badge?.label === 'C' && '2.0×'}
        {row.badge?.label === 'VC' && '1.5×'}
        {row.poisoned && '0.5×'}
      </div>

      {/* Base + final */}
      <div className="w-20 text-right">
        {row.basePoints !== row.points && (
          <div className="text-[10px] text-white/30">
            {row.basePoints.toFixed(1)} base
          </div>
        )}
        <div
          className={`text-lg font-bold ${
            row.poisoned ? 'text-purple-300' : 'text-white'
          }`}
        >
          {row.points.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-white">{value}</div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
      {label}
    </div>
  );
}