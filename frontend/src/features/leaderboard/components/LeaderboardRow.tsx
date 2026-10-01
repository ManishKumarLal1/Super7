import type { LeaderboardEntry } from '../leaderboardStore';

type Props = {
  entry: LeaderboardEntry & { rank: number };
  metric: 'coins' | 'winrate';
};

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-br from-yellow-300 to-amber-500 text-black',
  2: 'bg-gradient-to-br from-gray-200 to-gray-400 text-black',
  3: 'bg-gradient-to-br from-orange-400 to-amber-700 text-black',
};

export function LeaderboardRow({ entry, metric }: Props) {
  const rankStyle = RANK_STYLES[entry.rank];
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
        entry.isMe
          ? 'border-emerald-400/40 bg-emerald-400/[0.06]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
      }`}
    >
      {/* Rank badge */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
          rankStyle ?? 'bg-white/5 text-white/60 ring-1 ring-white/10'
        }`}
      >
        {entry.rank}
      </div>

      {/* Avatar */}
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ring-1 ${
          entry.isMe
            ? 'bg-emerald-400/20 text-emerald-300 ring-emerald-400/30'
            : 'bg-white/5 text-white/60 ring-white/10'
        }`}
      >
        {entry.avatarInitials}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">
            {entry.name}
          </span>
          {entry.isMe && (
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
              You
            </span>
          )}
          {isTop3 && !entry.isMe && (
            <span className="text-sm">{entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : '🥉'}</span>
          )}
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/40">
          {entry.wins}W · {entry.losses}L · {entry.ties}T
        </div>
      </div>

      {/* Metric */}
      <div className="text-right">
        {metric === 'coins' ? (
          <>
            <div className="text-lg font-bold text-white">
              {entry.coinsWon.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              coins won
            </div>
          </>
        ) : (
          <>
            <div
              className={`text-lg font-bold ${
                entry.winRate >= 50 ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {entry.winRate}%
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              win rate
            </div>
          </>
        )}
      </div>
    </div>
  );
}