import { useEffect, useRef } from 'react';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  myPoints: number;
  opponentPoints: number;
};

export function HeadToHeadBar({ myPoints, opponentPoints }: Props) {
  const myBarRef = useRef<HTMLDivElement>(null);
  const total = myPoints + opponentPoints || 1;
  const myShare = (myPoints / total) * 100;

  useEffect(() => {
    if (!myBarRef.current) return;
    gsap.to(myBarRef.current, {
      width: `${myShare}%`,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, [myShare]);

  const lead = myPoints - opponentPoints;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-emerald-400">
            {myPoints.toFixed(1)}
          </span>
          <span className="text-xs uppercase tracking-widest text-white/40">
            You
          </span>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
            lead > 0
              ? 'bg-emerald-400/10 text-emerald-400'
              : lead < 0
              ? 'bg-rose-400/10 text-rose-400'
              : 'bg-white/5 text-white/50'
          }`}
        >
          {lead > 0
            ? `Leading by ${lead.toFixed(1)}`
            : lead < 0
            ? `Behind by ${Math.abs(lead).toFixed(1)}`
            : 'Tied'}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-widest text-white/40">
            Opponent
          </span>
          <span className="text-3xl font-bold text-rose-400">
            {opponentPoints.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-rose-400/20">
        <div
          ref={myBarRef}
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-none"
          style={{ width: '50%' }}
        />
      </div>
    </div>
  );
}