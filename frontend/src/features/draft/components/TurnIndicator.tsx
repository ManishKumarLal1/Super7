import { useEffect, useState, useRef } from 'react';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  side: 'me' | 'opponent';
  pickNumber: number;
  totalPicks: number;
  isSubstitutePhase?: boolean;
  onTimeout?: () => void;
  resetKey: number;
};

const TURN_SECONDS = 15;

export function TurnIndicator({
  side,
  pickNumber,
  totalPicks,
  isSubstitutePhase,
  onTimeout,
  resetKey,
}: Props) {
  const [seconds, setSeconds] = useState(TURN_SECONDS);
  const ringRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep latest onTimeout in a ref so we don't re-run the tick effect
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Reset timer on each new turn
  useEffect(() => {
    setSeconds(TURN_SECONDS);
  }, [resetKey]);

  // Tick — only when it's the human's turn, otherwise pause
  useEffect(() => {
    if (side !== 'me') return;
    if (seconds <= 0) {
      onTimeoutRef.current?.();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, side]);

  // Animate ring
  useEffect(() => {
    if (!ringRef.current) return;
    const circumference = 2 * Math.PI * 26;
    const progress = Math.max(seconds / TURN_SECONDS, 0);
    gsap.to(ringRef.current, {
      strokeDashoffset: circumference * (1 - progress),
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [seconds]);

  // Pulse when < 5s
  useEffect(() => {
    if (seconds <= 5 && seconds > 0 && side === 'me' && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 1 },
        { scale: 1.03, duration: 0.2, yoyo: true, repeat: 1 }
      );
    }
  }, [seconds, side]);

  const isMe = side === 'me';
  const circumference = 2 * Math.PI * 26;

  // Displayed seconds: for opponent turns, show a dash since we're not tracking
  const displaySeconds = isMe ? seconds : '–';

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-4 backdrop-blur-xl"
    >
      <div className="relative h-14 w-14">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="26"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
            fill="none"
          />
          <circle
            ref={ringRef}
            cx="28"
            cy="28"
            r="26"
            stroke={isMe ? '#10b981' : '#f59e0b'}
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {displaySeconds}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          {isSubstitutePhase
            ? 'Substitute pick'
            : `Pick ${pickNumber} of ${totalPicks}`}
        </div>
        <div
          className={`mt-1 text-lg font-semibold ${
            isMe ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {isMe ? 'Your turn' : 'Opponent is picking…'}
        </div>
      </div>
    </div>
  );
}