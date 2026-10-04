import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyContests } from '../features/contests/myContestsStore';
import { MOCK_MATCHES } from '../features/contests/mockMatches';

type Tab = 'upcoming' | 'ongoing' | 'completed';

export function MyContestsPage() {
  const [tab, setTab] = useState<Tab>('ongoing');
  const { entries, loaded } = useMyContests();

  const upcoming = entries.filter((e) => e.status === 'upcoming');
  const ongoing = entries.filter(
    (e) => e.status === 'drafting' || e.status === 'live'
  );
  const completed = entries.filter((e) => e.status === 'completed');

  // Available matches from mock — later this comes from Supabase `matches` table
  const openMatches = MOCK_MATCHES.filter((m) => m.status === 'upcoming');

  const tabs: { id: Tab; label: string; count: number }[] = [
    {
      id: 'upcoming',
      label: 'Upcoming',
      count: upcoming.length + openMatches.length,
    },
    { id: 'ongoing', label: 'Ongoing', count: ongoing.length },
    { id: 'completed', label: 'Completed', count: completed.length },
  ];

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            My contests
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Every match, one place.
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition ${
                tab === t.id
                  ? 'bg-emerald-400 text-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    tab === t.id
                      ? 'bg-black/20 text-black'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {!loaded && (
          <div className="py-16 text-center text-sm text-white/40">
            Loading your contests…
          </div>
        )}

        {loaded && (
          <>
            {/* UPCOMING */}
            {tab === 'upcoming' && (
              <div className="space-y-8">
                {upcoming.length > 0 && (
                  <div>
                    <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
                      Waiting for you
                    </div>
                    <div className="space-y-3">
                      {upcoming.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                                  Waiting
                                </span>
                                {entry.code && (
                                  <span className="font-mono text-sm text-white/60">
                                    {entry.code}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 text-sm text-white/70">
                                {entry.matchId} ·{' '}
                                {entry.stake === 0 ? 'Free' : `${entry.stake} coins`}
                              </div>
                            </div>
                            {entry.code && (
                              <Link
                                to={`/contest/${entry.code}`}
                                className="rounded-full bg-amber-400 px-5 py-2.5 text-xs font-semibold text-black transition hover:scale-105"
                              >
                               Resume →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
                    Matches open for entry
                  </div>
                  <div className="space-y-3">
                    {openMatches.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/20"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {m.teamA} vs {m.teamB}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                              {m.format} · {m.venue}
                            </div>
                          </div>
                          <Link
                            to="/contests"
                            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
                          >
                            Enter →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ONGOING */}
            {tab === 'ongoing' && (
              <div>
                {ongoing.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
                    <div className="text-4xl">⏱️</div>
                    <div className="mt-4 text-lg font-semibold text-white">
                      No live matches right now
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      Enter a contest to start playing.
                    </p>
                    <Link
                      to="/contests"
                      className="mt-6 inline-block rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:scale-105"
                    >
                      Find a match →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ongoing.map((entry) => (
  <div
    key={entry.id}
    className="overflow-hidden rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/[0.08] to-transparent p-6 transition hover:border-emerald-400/60"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
          Live now
        </span>
      </div>
      <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
        {entry.stake} coins
      </span>
    </div>

    <div className="mt-6">
      <div className="text-xs uppercase tracking-widest text-white/40">
        Match
      </div>
      <div className="mt-1 text-lg font-semibold text-white">
        {entry.matchId}
      </div>
    </div>

    <div className="mt-6 flex gap-3">
      <Link
        to={`/live-match/${entry.matchId}?stake=${entry.stake}`}
        className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
      >
        Watch live →
      </Link>
      <Link
        to={`/report/${entry.id}`}
        className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/[0.08]"
      >
        Report
      </Link>
    </div>
  </div>
))}
                  </div>
                )}
              </div>
            )}

            {/* COMPLETED */}
            {tab === 'completed' && (
              <div>
                {completed.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
                    <div className="text-4xl">🏆</div>
                    <div className="mt-4 text-lg font-semibold text-white">
                      No completed matches yet
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      Play a match to see it here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completed.map((entry) => {
                      const won = entry.result === 'won';
                      const lost = entry.result === 'lost';
                      return (
                        <Link
                          key={entry.id}
                          to={`/report/${entry.id}`}
                          className={`block rounded-2xl border p-5 transition ${
                            won
                              ? 'border-emerald-400/20 bg-emerald-400/[0.04] hover:border-emerald-400/40'
                              : lost
                              ? 'border-rose-400/20 bg-rose-400/[0.04] hover:border-rose-400/40'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/30'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                  won
                                    ? 'bg-emerald-400/20 text-emerald-300'
                                    : lost
                                    ? 'bg-rose-400/20 text-rose-300'
                                    : 'bg-white/10 text-white/60'
                                }`}
                              >
                                {entry.result ?? 'done'}
                              </span>
                              <span className="text-sm text-white/70">
                                {entry.matchId}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              {entry.myPoints != null && entry.opponentPoints != null && (
                                <div className="text-right">
                                  <div className="text-sm font-bold text-white">
                                    {entry.myPoints.toFixed(1)} –{' '}
                                    {entry.opponentPoints.toFixed(1)}
                                  </div>
                                  <div className="text-[10px] text-white/40">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}