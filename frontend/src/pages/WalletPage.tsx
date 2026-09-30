import { useWallet } from '../features/wallet/hooks/useWallet';
import { useMatchesStore } from '../features/wallet/matchesStore';

const TX_STYLES: Record<string, { icon: string; color: string }> = {
  deposit: { icon: '↓', color: 'text-emerald-400 bg-emerald-400/10' },
  bonus: { icon: '★', color: 'text-yellow-400 bg-yellow-400/10' },
  escrow: { icon: '↗', color: 'text-rose-400 bg-rose-400/10' },
  payout: { icon: '🏆', color: 'text-emerald-400 bg-emerald-400/10' },
  refund: { icon: '↻', color: 'text-sky-400 bg-sky-400/10' },
};

export function WalletPage() {
  const { balance, transactions } = useWallet();
  const history = useMatchesStore((s) => s.history);

  const wins = history.filter((h) => h.result === 'won').length;
  const coinsWon = history
    .filter((h) => h.result === 'won')
    .reduce((s, h) => s + h.payout, 0);

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        {/* Balance card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.10] to-transparent p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
              Your balance
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-6xl font-bold text-white md:text-7xl">
                {balance.toLocaleString()}
              </span>
              <span className="text-sm text-white/50">coins</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-white/50">
              Coins are virtual and free to earn. They unlock higher-stakes
              contests — but they have no cash value.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <StatCard label="Matches played" value={history.length} />
          <StatCard label="Wins" value={wins} accent="text-emerald-400" />
          <StatCard
            label="Coins won"
            value={coinsWon.toLocaleString()}
            accent="text-emerald-400"
          />
        </div>

        {/* Transactions */}
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">
              Recent activity
            </div>
            <span className="text-xs text-white/30">
              {transactions.length} transactions
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {transactions.length === 0 && (
              <div className="p-8 text-center text-sm text-white/40">
                No transactions yet
              </div>
            )}
            {transactions.map((tx, i) => {
              const style = TX_STYLES[tx.type] ?? TX_STYLES.deposit;
              const positive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-4 p-4 ${
                    i !== transactions.length - 1
                      ? 'border-b border-white/5'
                      : ''
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${style.color}`}
                  >
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {tx.label}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`text-base font-semibold ${
                      positive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {tx.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'text-white',
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-white/40">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}