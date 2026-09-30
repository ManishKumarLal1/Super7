import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../../animations/gsap.config';
import { MOCK_MATCHES } from '../mockMatches';
import { useWallet } from '../../wallet/hooks/useWallet';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (matchId: string, stake: number) => void;
};

const STAKES = [0, 200, 400, 1000];

export function CreateContestModal({ open, onClose, onCreate }: Props) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [stake, setStake] = useState<number>(200);
  const { balance } = useWallet();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !panelRef.current || !overlayRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 20, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'power3.out',
        clearProps: 'all',
      }
    );
  }, [open]);

  if (!open) return null;

  const canCreate = matchId !== null && (stake === 0 || balance >= stake);

  const handleCreate = () => {
    if (!canCreate || !matchId) return;
    onCreate(matchId, stake);
  };

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-black p-8"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          Create contest
        </div>
        <h2 className="mt-3 text-3xl font-bold text-white">
          Set the stakes.
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Get a code, share it with a friend, and play when they join.
        </p>

        {/* Match */}
        <div className="mt-8">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
            Match
          </div>
          <div className="space-y-2">
            {MOCK_MATCHES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMatchId(m.id)}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                  matchId === m.id
                    ? 'border-emerald-400/60 bg-emerald-400/[0.06]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    {m.teamA} vs {m.teamB}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                    {m.format} · {m.venue}
                  </div>
                </div>
                {matchId === m.id && <span className="text-emerald-400">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Stake */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">
              Stake
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="text-yellow-400">●</span>
              {balance.toLocaleString()}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STAKES.map((s) => {
              const disabled = s > 0 && balance < s;
              return (
                <button
                  key={s}
                  onClick={() => !disabled && setStake(s)}
                  disabled={disabled}
                  className={`rounded-2xl border py-4 text-center transition ${
                    stake === s
                      ? 'border-emerald-400/60 bg-emerald-400/[0.06]'
                      : disabled
                      ? 'cursor-not-allowed border-white/5 bg-white/[0.01] opacity-30'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="text-base font-bold text-white">
                    {s === 0 ? 'Free' : s}
                  </div>
                  {s > 0 && (
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      coins
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-4 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex-1 rounded-2xl bg-emerald-400 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate code →
          </button>
        </div>
      </div>
    </div>
  );
}