import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '../../../animations/gsap.config';

const STEPS = [
  {
    number: '01',
    title: 'Pick your stake',
    description:
      'Choose 200, 400, or 1000 coins. Face off 1v1 against another player for the same match.',
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    number: '02',
    title: 'Draft your Super 7',
    description:
      'Snake-draft 7 players from the match squad. Lock in your Captain, Vice-Captain, and secret Poison.',
    accent: 'from-purple-400 to-pink-500',
  },
  {
    number: '03',
    title: 'Win the pot',
    description:
      'Live points tick ball-by-ball. Poison halves your opponent\'s player. Highest score takes it all.',
    accent: 'from-yellow-400 to-orange-500',
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !trackRef.current) return;

    const track = trackRef.current;
    const totalScroll = track.scrollWidth - window.innerWidth;

    gsap.to(track, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // Progress bar fill
    gsap.to('.how-progress-fill', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        scrub: 1,
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-black"
    >
      <div className="absolute top-20 left-6 right-6 z-10 flex items-center gap-4 md:top-24 md:left-12 md:right-12">
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">
          How it works
        </span>
        <div className="relative h-px flex-1 bg-white/10">
          <div className="how-progress-fill absolute inset-0 origin-left scale-x-0 bg-emerald-400" />
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex h-full items-center gap-8 pl-6 md:pl-12"
        style={{ width: `${STEPS.length * 100}vw` }}
      >
        {STEPS.map((step, index) => (
          <HowItWorksStep key={step.number} {...step} index={index} />
        ))}
      </div>
    </section>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
  accent,
  index,
}: {
  number: string;
  title: string;
  description: string;
  accent: string;
  index: number;
}) {
  return (
    <div className="step-card flex h-[70vh] w-[80vw] flex-shrink-0 flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm md:w-[70vw] md:p-16">
      <div
        className={`bg-gradient-to-br ${accent} bg-clip-text text-7xl font-bold text-transparent md:text-9xl`}
      >
        {number}
      </div>
      <div>
        <h3 className="mb-4 text-4xl font-bold leading-tight text-white md:text-6xl">
          {title}
        </h3>
        <p className="max-w-xl text-lg text-white/60 md:text-xl">
          {description}
        </p>
      </div>
    </div>
  );
}