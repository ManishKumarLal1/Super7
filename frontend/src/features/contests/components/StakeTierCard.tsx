import { useRef } from 'react';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  stake: number;
  label: string;
  description: string;
  accent: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
};

export function StakeTierCard({
  stake,
  label,
  description,
  accent,
  selected,
  onSelect,
  disabled,
}: Props) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card || disabled) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(card, {
      rotateY: x * 10,
      rotateX: -y * 10,
      transformPerspective: 1000,
      duration: 0.3,
    });
  };

  const handleLeave = () => {
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    });
  };

  return (
    <button
      ref={cardRef}
      onClick={onSelect}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      disabled={disabled}
      className={`group relative flex flex-col items-start overflow-hidden rounded-3xl border p-6 text-left transition-all md:p-8 ${
        selected
          ? 'border-emerald-400/60 bg-emerald-400/[0.06]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      <div className="relative z-10 w-full">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            {label}
          </span>
          {selected && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-black">
              ✓
            </span>
          )}
        </div>

        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white md:text-5xl">
            {stake}
          </span>
          <span className="text-sm text-white/50">coins</span>
        </div>

        <p className="text-sm text-white/50">{description}</p>
      </div>
    </button>
  );
}