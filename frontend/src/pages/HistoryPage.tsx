import { Link } from 'react-router-dom';
import { useMatchesStore } from '../features/wallet/matchesStore';

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

export function HistoryPage() {
  const history = useMatchesStore((s) => s.history);

  const wins = history.filter((h) => h.result === 'won').length;
  const losses = history.filter((h) => h.result === 'lost').length;
  const ties = history.filter((h) => h.result === 'tied').length;
  const netCoins = history.reduce((sum, h) => {
    // For a win, payout is 2x stake, but stake was already deducted.
    // Net gain = stake. For a tie, stake refunded, net 0. For a loss, -stake.
    if (h.result === 'won') return sum + h.stake;
    if (h.result === 'lost') return sum - h.stake;
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Match history
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Every battle, on record.
          </h1>
        </div>

        {/* Summary */}
        <div className="mb-10 grid grid-cols-4 gap-4">
          <Stat label="Played" value={history.length} />
          <Stat label="Won" value={wins} accent="text-emerald-400" />
          <Stat label="Lost" value={losses} accent="text-rose-400" />
          <Stat
            label="Net coins"
            value={`${netCoins >= 0 ? '+' : ''}${netCoins}`}
            accent={netCoins >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          />
        </div>

        {/* List */}
        {history.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
            <div className="text-lg font-semibold text-white">
              No matches yet.
            </div>
            <p className="mt-2 text-sm text-white/50">
              Enter a contest to start building your record.
            </p>
            <Link
              to="/contests"
              className="mt-6 inline-block rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:scale-105"
            >
              Find a contest →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {history.map((match, i) => {
              const style = RESULT_STYLES[match.result];
              return (
                <div
                  key={match.id}
                  className={`flex flex-wrap items-center gap-4 p-5 ${
                    i !== history.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${style.badge}`}
                  >
                    {style.label}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {match.matchId}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      {new Date(match.timestamp).toLocaleString()} ·{' '}
                      {match.stake} coins
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-lg font-bold ${style.accent}`}>
                      {match.myPoints.toFixed(1)}
                      <span className="mx-1 text-white/30">vs</span>
                      {match.opponentPoints.toFixed(1)}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        match.payout > match.stake
                          ? 'text-emerald-400'
                          : match.payout === 0
                          ? 'text-rose-400'
                          : 'text-white/50'
                      }`}
                    >
                      {match.payout > 0
                        ? `+${match.payout - match.stake} coins`
                        : `-${match.stake} coins`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = 'text-white',
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </div>
      <div className={`mt-1.5 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}