import type { DraftPlayer } from '../../draft/mockSquad';

type Props = {
  player: DraftPlayer;
  points: number;
  badge?: { label: string; color: string };
  poisoned?: boolean;
  substitute?: boolean;
};

export function PlayerPointsRow({
  player,
  points,
  badge,
  poisoned,
  substitute,
}: Props) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
        poisoned
          ? 'border-purple-500/30 bg-purple-500/[0.06]'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/70 ring-1 ring-white/10">
          {player.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)}
        </div>
        {badge && (
          <div
            className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${badge.color}`}
          >
            {badge.label}
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="text-sm font-medium text-white">
          {player.shortName}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          {player.team} · {player.role}
          {substitute && ' · SUB'}
        </div>
      </div>

      <div className="text-right">
        <div
          className={`text-lg font-bold ${
            poisoned ? 'text-purple-300' : 'text-white'
          }`}
        >
          {points.toFixed(1)}
        </div>
      </div>
    </div>
  );
}