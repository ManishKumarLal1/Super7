import { Link } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { useWallet } from '../features/wallet/hooks/useWallet';
import { useMatchesStore } from '../features/wallet/matchesStore';

export function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { balance } = useWallet();
  const history = useMatchesStore((s) => s.history);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/40">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black">
        <div className="text-white/60">You need to sign in first.</div>
        <Link
          to="/sign-in"
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const wins = history.filter((h) => h.result === 'won').length;
  const losses = history.filter((h) => h.result === 'lost').length;
  const ties = history.filter((h) => h.result === 'tied').length;
  const winRate =
    history.length > 0 ? Math.round((wins / history.length) * 100) : 0;

  const bestScore = history.reduce(
    (max, h) => Math.max(max, h.myPoints),
    0
  );

  const recent = history.slice(0, 5);

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        {/* Profile header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-transparent p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
            <img
              src={user.imageUrl}
              alt={user.fullName ?? 'Profile'}
              className="h-24 w-24 rounded-full ring-4 ring-white/10"
            />

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                {user.fullName ?? user.username ?? 'Player'}
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {user.primaryEmailAddress?.emailAddress}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/10">
                  🏏 Rookie
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/10">
                  {history.length} matches played
                </span>
              </div>
            </div>

            <Link
              to="/wallet"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 transition hover:bg-white/[0.08]"
            >
              <span className="text-yellow-400">●</span>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-white/40">
                  Balance
                </div>
                <div className="text-xl font-bold text-white">
                  {balance.toLocaleString()}
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Wins" value={wins} accent="text-emerald-400" />
          <Stat label="Losses" value={losses} accent="text-rose-400" />
          <Stat label="Ties" value={ties} />
          <Stat
            label="Win rate"
            value={`${winRate}%`}
            accent={winRate >= 50 ? 'text-emerald-400' : 'text-white'}
          />
        </div>

        {/* Best score */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Best single-match score
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-400">
              {bestScore.toFixed(1)}
            </span>
            <span className="text-sm text-white/40">points</span>
          </div>
        </div>

        {/* Recent matches */}
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">
              Recent matches
            </div>
            {history.length > 5 && (
              <Link
                to="/history"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                View all →
              </Link>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center">
              <div className="text-sm text-white/40">
                No matches yet — start your first contest.
              </div>
              <Link
                to="/contests"
                className="mt-4 inline-block rounded-full bg-emerald-400 px-5 py-2.5 text-xs font-semibold text-black transition hover:scale-105"
              >
                Play now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((match) => {
                const won = match.result === 'won';
                const lost = match.result === 'lost';
                return (
                  <Link
                    key={match.id}
                    to={`/match/${match.id}`}
                    className={`flex items-center gap-4 rounded-2xl border p-4 ${
                      won
                        ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
                        : lost
                        ? 'border-rose-400/20 bg-rose-400/[0.04]'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        won
                          ? 'bg-emerald-400/20 text-emerald-300'
                          : lost
                          ? 'bg-rose-400/20 text-rose-300'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {match.result}
                    </div>
                    <div className="flex-1 text-sm text-white/70">
                      {match.matchId}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">
                        {match.myPoints.toFixed(1)} –{' '}
                        {match.opponentPoints.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {new Date(match.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}