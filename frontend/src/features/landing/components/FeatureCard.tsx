import { useRef } from 'react';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  title: string;
  description: string;
  icon: string;
  accent: string;
};

export function FeatureCard({ title, description, icon, accent }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(card, {
      rotateY: x * 12,
      rotateX: -y * 12,
      transformPerspective: 1000,
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  const handleLeave = () => {
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)',
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="feature-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-white/20 md:p-10"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      <div className="relative z-10">
        <div className="mb-8 text-5xl">{icon}</div>
        <h3 className="mb-4 text-2xl font-bold text-white">{title}</h3>
        <p className="text-white/60">{description}</p>
      </div>
    </div>
  );
}