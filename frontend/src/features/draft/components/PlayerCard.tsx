import { useRef } from 'react';
import { gsap } from '../../../animations/gsap.config';
import type { DraftPlayer } from '../mockSquad';

type Props = {
  player: DraftPlayer;
  picked: boolean;
  pickedBy?: 'me' | 'opponent';
  disabled: boolean;
  onClick: () => void;
};

const ROLE_COLORS: Record<string, string> = {
  BAT: 'text-sky-400 bg-sky-400/10 ring-sky-400/20',
  BOWL: 'text-rose-400 bg-rose-400/10 ring-rose-400/20',
  AR: 'text-violet-400 bg-violet-400/10 ring-violet-400/20',
  WK: 'text-amber-400 bg-amber-400/10 ring-amber-400/20',
};

const TEAM_COLORS: Record<string, string> = {
  IND: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  AUS: 'bg-yellow-500/10 text-yellow-300 ring-yellow-500/20',
};

export function PlayerCard({ player, picked, pickedBy, disabled, onClick }: Props) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card || disabled) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateY: x * 8,
      rotateX: -y * 8,
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
      disabled={disabled || picked}
      className={`group relative flex flex-col items-start overflow-hidden rounded-2xl border p-4 text-left transition-all ${
        picked
          ? pickedBy === 'me'
            ? 'border-emerald-400/30 bg-emerald-400/[0.04]'
            : 'border-rose-400/30 bg-rose-400/[0.04]'
          : disabled
          ? 'cursor-not-allowed border-white/5 bg-white/[0.01] opacity-40'
          : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
      }`}
    >
      <div className="mb-3 flex w-full items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${TEAM_COLORS[player.team]}`}
        >
          {player.team}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${ROLE_COLORS[player.role]}`}
        >
          {player.role}
        </span>
      </div>

      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white/60 ring-1 ring-white/10">
        {player.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
      </div>

      <div className="text-sm font-semibold leading-tight text-white">
        {player.shortName}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-white/40">Cr</span>
        <span className="font-semibold text-white/80">{player.credits.toFixed(1)}</span>
      </div>

      {picked && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest backdrop-blur-[2px] ${
            pickedBy === 'me' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {pickedBy === 'me' ? '✓ You' : '× Opponent'}
        </div>
      )}
    </button>
  );
}