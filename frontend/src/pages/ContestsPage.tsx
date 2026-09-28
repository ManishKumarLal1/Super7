import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { useWallet } from '../features/wallet/hooks/useWallet';
import { StakeTierGrid } from '../features/contests/components/StakeTierGrid';
import { MatchSelector } from '../features/contests/components/MatchSelector';
import { gsap } from '../animations/gsap.config';

export function ContestsPage() {
  const { balance } = useWallet();
  const [stake, setStake] = useState<number | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const canEnter = stake !== null && matchId !== null && balance >= stake;

  useGSAP(() => {
    gsap.from('.stagger-in', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
    });
  }, { scope: pageRef });

  const handleEnter = () => {
    if (!canEnter) return;
    navigate(`/draft/${matchId}?stake=${stake}`);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="stagger-in mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Contests
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Pick your battleground.
          </h1>
          <p className="mt-3 max-w-xl text-white/50">
            Choose a stake tier and a match, then wait to be matched with an
            opponent for a 1v1 Super 7 draft.
          </p>
        </div>

        <div className="stagger-in mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
              Stake tier
            </h2>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <span className="text-yellow-400">●</span>
              <span>{balance.toLocaleString()} coins</span>
            </div>
          </div>
          <StakeTierGrid
            selected={stake}
            onSelect={setStake}
            balance={balance}
          />
        </div>

        <div className="stagger-in mb-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            Select match
          </h2>
          <MatchSelector selected={matchId} onSelect={setMatchId} />
        </div>

        <div className="stagger-in sticky bottom-6 z-10">
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
              onClick={handleEnter}
              disabled={!canEnter}
              className={`rounded-full px-8 py-3.5 text-sm font-semibold transition-all ${
                canEnter
                  ? 'bg-emerald-400 text-black hover:scale-105 hover:bg-emerald-300'
                  : 'cursor-not-allowed bg-white/5 text-white/30'
              }`}
            >
              {balance < (stake ?? 0) ? 'Not enough coins' : 'Find opponent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}