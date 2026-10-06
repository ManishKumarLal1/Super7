import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
  defaultCode?: string;
};

export function JoinContestModal({ open, onClose, onJoin, defaultCode }: Props) {
  const [code, setCode] = useState(defaultCode ?? '');

  useEffect(() => {
    if (open) setCode((defaultCode ?? '').toUpperCase());
  }, [open, defaultCode]);

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
    setCode('');
  }, [open]);

  if (!open) return null;

  const handleJoin = () => {
    if (code.trim().length !== 6) return;
    onJoin(code.trim().toUpperCase());
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
        className="w-full max-w-md rounded-3xl border border-white/10 bg-black p-8"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          Join contest
        </div>
        <h2 className="mt-3 text-3xl font-bold text-white">
          Enter the code.
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Paste the 6-character code your friend shared.
        </p>

        <input
          autoFocus
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
          }
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="A7X9Z2"
          maxLength={6}
          className="mt-8 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-center font-mono text-2xl tracking-[0.4em] text-white placeholder:text-white/20 outline-none focus:border-emerald-400/50"
        />

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-4 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={code.length !== 6}
            className="flex-1 rounded-2xl bg-emerald-400 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}