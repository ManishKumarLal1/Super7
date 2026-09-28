import { useDraftStore } from '../draftStore';

type Props = {
  side: 'me' | 'opponent';
  title: string;
  accent: string;
};

export function PicksPanel({ side, title, accent }: Props) {
  const picks = useDraftStore((s) =>
    side === 'me' ? s.myPicks : s.opponentPicks
  );
  const substitute = useDraftStore((s) =>
    side === 'me' ? s.mySubstitute : s.opponentSubstitute
  );
  const players = useDraftStore((s) => s.players);

  const slots = Array.from({ length: 7 }).map((_, i) => {
    const id = picks[i];
    return id ? players.find((p) => p.id === id) : null;
  });

  const subPlayer = substitute
    ? players.find((p) => p.id === substitute)
    : null;

  const isMe = side === 'me';

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`text-xs font-semibold uppercase tracking-[0.2em] ${accent}`}
        >
          {title}
        </span>
        <span className="text-xs text-white/40">{picks.length}/7</span>
      </div>

      <div className="space-y-2">
        {slots.map((player, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
              player
                ? isMe
                  ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
                  : 'border-rose-400/20 bg-rose-400/[0.04]'
                : 'border-dashed border-white/10 bg-white/[0.01]'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                player
                  ? isMe
                    ? 'bg-emerald-400/20 text-emerald-300'
                    : 'bg-rose-400/20 text-rose-300'
                  : 'bg-white/5 text-white/20'
              }`}
            >
              {player
                ? player.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                : i + 1}
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium ${
                  player ? 'text-white' : 'text-white/20'
                }`}
              >
                {player ? player.shortName : `Slot ${i + 1}`}
              </div>
              {player && (
                <div className="text-[10px] uppercase tracking-widest text-white/40">
                  {player.team} · {player.role}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Substitute slot */}
      <div
        className={`mt-3 flex items-center gap-3 rounded-xl border p-3 transition-all ${
          subPlayer
            ? isMe
              ? 'border-amber-400/30 bg-amber-400/[0.05]'
              : 'border-amber-400/30 bg-amber-400/[0.05]'
            : 'border-dashed border-white/15 bg-white/[0.01]'
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            subPlayer
              ? 'bg-amber-400/20 text-amber-300'
              : 'bg-white/5 text-white/20'
          }`}
        >
          {subPlayer
            ? subPlayer.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
            : 'S'}
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-amber-400/60">
            Substitute
          </div>
          <div
            className={`text-sm font-medium ${
              subPlayer ? 'text-white' : 'text-white/20'
            }`}
          >
            {subPlayer ? subPlayer.shortName : 'Not picked'}
          </div>
        </div>
      </div>
    </div>
  );
}