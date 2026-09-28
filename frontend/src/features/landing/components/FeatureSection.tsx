import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../../animations/gsap.config';
import { FeatureCard } from './FeatureCard';

const FEATURES = [
  {
    title: 'Poison your rival',
    description:
      'Secretly target one of your opponent\'s players. Half their points flow to you. Pure mind games.',
    icon: '☠️',
    accent: 'from-purple-500/20 to-transparent',
  },
  {
    title: 'Live ball-by-ball points',
    description:
      'Every run, wicket, and catch updates your score in real time. Watch the lead swing each over.',
    icon: '⚡',
    accent: 'from-emerald-500/20 to-transparent',
  },
  {
    title: 'Play with friends',
    description:
      'Challenge friends to private contests. Stake coins, draft, and settle the score.',
    icon: '👥',
    accent: 'from-yellow-500/20 to-transparent',
  },
];

export function FeatureSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.feature-card', {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
      },
    });

    gsap.from('.feature-heading', {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative bg-black px-6 py-32 md:px-12 md:py-40"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-3xl">
          <span className="mb-6 inline-block text-xs uppercase tracking-[0.3em] text-emerald-400">
            Built to win
          </span>
          <h2 className="feature-heading text-5xl font-bold leading-[1.05] text-white md:text-7xl">
            Not just another fantasy game.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}