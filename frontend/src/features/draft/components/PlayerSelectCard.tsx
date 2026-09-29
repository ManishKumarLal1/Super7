import { useRef } from 'react';
import { gsap } from '../../../animations/gsap.config';
import type { DraftPlayer } from '../mockSquad';

type Props = {
  player: DraftPlayer;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
};

const TEAM_COLORS: Record<string, string> = {
  IND: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  AUS: 'bg-yellow-500/10 text-yellow-300 ring-yellow-500/20',
};

export function PlayerSelectCard({
  player,
  selected,
  disabled,
  badge,
  badgeColor = 'bg-emerald-400 text-black',
  onClick,
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
      transformPerspective: 800,
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
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      disabled={disabled}
      className={`group relative flex flex-col items-start overflow-hidden rounded-2xl border p-4 text-left transition-all ${
        selected
          ? 'border-emerald-400/60 bg-emerald-400/[0.06] shadow-[0_0_40px_rgba(16,185,129,0.15)]'
          : disabled
          ? 'cursor-not-allowed border-white/5 bg-white/[0.01] opacity-30'
          : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
      }`}
    >
      {badge && (
        <div
          className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${badgeColor}`}
        >
          {badge}
        </div>
      )}

      <span
        className={`mb-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${TEAM_COLORS[player.team]}`}
      >
        {player.team}
      </span>

      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white/60 ring-1 ring-white/10">
        {player.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)}
      </div>

      <div className="text-sm font-semibold leading-tight text-white">
        {player.shortName}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-white/40">{player.role}</span>
        <span className="font-semibold text-white/80">
          {player.credits.toFixed(1)}
        </span>
      </div>
    </button>
  );
}