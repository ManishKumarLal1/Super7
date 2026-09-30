import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWallet } from '../features/wallet/hooks/useWallet';
import { useMatchesStore } from '../features/wallet/matchesStore';
import { useContestsStore } from '../features/contests/contestsStore';
import { StakeTierGrid } from '../features/contests/components/StakeTierGrid';
import { MatchSelector } from '../features/contests/components/MatchSelector';
import { CreateContestModal } from '../features/contests/components/CreateContestModal';
import { JoinContestModal } from '../features/contests/components/JoinContestModal';

type Tab = 'quick' | 'create' | 'join';

export function ContestsPage() {
  const [tab, setTab] = useState<Tab>('quick');
  const [stake, setStake] = useState<number | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { balance } = useWallet();
  const beginContest = useMatchesStore((s) => s.beginContest);
  const createContest = useContestsStore((s) => s.create);
  const joinContest = useContestsStore((s) => s.join);

  // Auto-open join modal if ?join=CODE
  useEffect(() => {
    const joinCode = search.get('join');
    if (joinCode) {
      setJoinOpen(true);
    }
  }, [search]);

  const canEnter = stake !== null && matchId !== null && balance >= stake;

  const handleQuickMatch = () => {
    if (!canEnter || !matchId || !stake) return;
    const ok = beginContest(matchId, stake);
    if (!ok) return alert('Not enough coins');
    navigate(`/draft/${matchId}?stake=${stake}`);
  };

  const handleCreate = (mId: string, s: number) => {
    const contest = createContest(mId, s);
    if (!contest) return alert('Not enough coins');
    setCreateOpen(false);
    navigate(`/contest/${contest.code}`);
  };

  const handleJoin = (code: string) => {
    const contest = joinContest(code);
    if (!contest) return alert('Not enough coins or invalid code');
    setJoinOpen(false);
    navigate(`/contest/${contest.code}`);
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Contests
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Pick your battleground.
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-10 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
          {(['quick', 'create', 'join'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-widest transition ${
                tab === t
                  ? 'bg-emerald-400 text-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t === 'quick' ? 'Quick match' : t === 'create' ? 'Create' : 'Join'}
            </button>
          ))}
        </div>

        {/* Quick match */}
        {tab === 'quick' && (
          <>
            <div className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                  Stake tier
                </h2>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <span className="text-yellow-400">●</span>
                  {balance.toLocaleString()}
                </div>
              </div>
              <StakeTierGrid selected={stake} onSelect={setStake} balance={balance} />
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                Select match
              </h2>
              <MatchSelector selected={matchId} onSelect={setMatchId} />
            </div>

            <div className="sticky bottom-6 z-10">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 p-5 backdrop-blur-xl">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Ready to enter
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {stake ? `${stake} coins` : 'Select a stake'}
                    {matchId ? ' · Match selected' : ' · Select a match'}
                  </div>
                </div>
                <button
                  onClick={handleQuickMatch}
                  disabled={!canEnter}
                  className={`rounded-full px-8 py-3.5 text-sm font-semibold transition-all ${
                    canEnter
                      ? 'bg-emerald-400 text-black hover:scale-105'
                      : 'cursor-not-allowed bg-white/5 text-white/30'
                  }`}
                >
                  {balance < (stake ?? 0) ? 'Not enough coins' : 'Find opponent'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Create */}
        {tab === 'create' && (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.06] to-transparent p-10 text-center">
            <div className="mx-auto max-w-md">
              <div className="text-5xl">🎯</div>
              <h2 className="mt-6 text-2xl font-bold text-white">
                Host a private contest
              </h2>
              <p className="mt-3 text-sm text-white/50">
                Pick a match, set the stake (or make it free), get a code, and
                share it with anyone.
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-8 rounded-full bg-emerald-400 px-8 py-4 text-sm font-semibold text-black transition hover:scale-105"
              >
                Create a contest
              </button>
            </div>
          </div>
        )}

        {/* Join */}
        {tab === 'join' && (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/[0.06] to-transparent p-10 text-center">
            <div className="mx-auto max-w-md">
              <div className="text-5xl">🎟️</div>
              <h2 className="mt-6 text-2xl font-bold text-white">
                Have a code?
              </h2>
              <p className="mt-3 text-sm text-white/50">
                Paste the 6-character code from your friend's invite to join
                their contest.
              </p>
              <button
                onClick={() => setJoinOpen(true)}
                className="mt-8 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition hover:scale-105"
              >
                Enter code
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateContestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
      <JoinContestModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoin={handleJoin}
      />
    </div>
  );
}