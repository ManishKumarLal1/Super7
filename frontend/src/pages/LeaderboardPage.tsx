import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { buildLeaderboard } from '../features/leaderboard/leaderboardStore';
import { LeaderboardRow } from '../features/leaderboard/components/LeaderboardRow';

type Scope = 'global' | 'friends';
type Metric = 'coins' | 'winrate';

export function LeaderboardPage() {
  const { user } = useUser();
  const [scope, setScope] = useState<Scope>('global');
  const [metric, setMetric] = useState<Metric>('coins');

  const { global, friends, myRank } = useMemo(() => buildLeaderboard(), []);

  const rawList = scope === 'global' ? global : friends;

  const sorted = useMemo(() => {
    const copy = [...rawList];
    if (metric === 'coins') {
      copy.sort((a, b) => b.coinsWon - a.coinsWon);
    } else {
      copy.sort((a, b) => b.winRate - a.winRate || b.matchesPlayed - a.matchesPlayed);
    }
    return copy.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [rawList, metric]);

  const myEntry = sorted.find((e) => e.isMe);

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Leaderboard
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Where do you stand?
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
            {(['global', 'friends'] as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                  scope === s
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {s === 'global' ? 'Global' : 'Friends'}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
            {(['coins', 'winrate'] as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                  metric === m
                    ? 'bg-emerald-400 text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {m === 'coins' ? 'Coins' : 'Win rate'}
              </button>
            ))}
          </div>
        </div>

        {/* Your rank strip (only if signed in and not top 3 already visible) */}
        {user && myEntry && myEntry.rank > 3 && (
          <div className="mb-4">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
              Your position
            </div>
            <LeaderboardRow entry={myEntry} metric={metric} />
          </div>
        )}

        {/* Top ranks */}
        <div className="mt-8">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
            Top players
          </div>
          <div className="space-y-2">
            {sorted.slice(0, 10).map((entry) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                metric={metric}
              />
            ))}
          </div>
        </div>

        {/* Extended list (11+) */}
        {sorted.length > 10 && (
          <div className="mt-8">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
              More players
            </div>
            <div className="space-y-2">
              {sorted.slice(10).map((entry) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  metric={metric}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state for friends */}
        {scope === 'friends' && sorted.length === 1 && (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
            <div className="text-lg font-semibold text-white">
              No friends on the board yet.
            </div>
            <p className="mt-2 text-sm text-white/50">
              Add friends to see how you stack up.
            </p>
            <Link
              to="/friends"
              className="mt-6 inline-block rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:scale-105"
            >
              Add friends →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}