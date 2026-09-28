import type { MockMatch } from '../mockMatches';

type Props = {
  match: MockMatch;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
};

function formatCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'LIVE';

  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Starts in ${mins}m`;

  const hours = Math.floor(mins / 60);
  return `Starts in ${hours}h ${mins % 60}m`;
}

export function MatchRow({ match, selected, onSelect, disabled }: Props) {
  const isLive = match.status === 'live';

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`group flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all ${
        selected
          ? 'border-emerald-400/60 bg-emerald-400/[0.06]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-white ring-1 ring-white/10">
            {match.teamAShort}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/30">
            vs
          </span>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-white ring-1 ring-white/10">
            {match.teamBShort}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-white">
              {match.teamA} vs {match.teamB}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-white/50 ring-1 ring-white/10">
              {match.format}
            </span>
          </div>
          <div className="mt-1 text-sm text-white/40">{match.venue}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span
          className={`text-sm font-medium ${
            isLive ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {isLive ? '● LIVE' : formatCountdown(match.startTime)}
        </span>
        {selected && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-black">
            ✓
          </span>
        )}
      </div>
    </button>
  );
}