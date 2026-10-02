import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../../animations/gsap.config';

const STEPS = [
  {
    number: '01',
    icon: '🎯',
    title: 'Enter a contest',
    description:
      'Pick a stake — 200, 400, or 1000 coins — and a match. We pair you 1v1 against another player for the same game.',
  },
  {
    number: '02',
    icon: '🏏',
    title: 'Draft your Super 7',
    description:
      'Take turns picking 7 players from the match squad. No duplicates. Then lock in 1 substitute who auto-swaps for any non-playing pick.',
  },
  {
    number: '03',
    icon: '⚡',
    title: 'Assign your powers',
    description:
      'Choose a Captain (2× points), a Vice-Captain (1.5×), and secretly Poison one of your opponent\'s players. Half of their points flow to you.',
  },
  {
    number: '04',
    icon: '🏆',
    title: 'Win the pot',
    description:
      'Live points tick ball-by-ball. The player with the highest score takes the whole pot — 2× your stake, minus nothing.',
  },
];

export function HowToPlaySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const heading = sectionRef.current?.querySelector('.htp-heading');
    if (heading) {
      gsap.fromTo(
        heading,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: { trigger: heading, start: 'top 80%' },
        }
      );
    }

    const cards = gsap.utils.toArray<HTMLElement>('.htp-card');
    if (cards.length === 0) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      }
    );
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative bg-black px-6 py-32 md:px-12 md:py-40"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-20 max-w-3xl">
          <span className="mb-6 inline-block text-xs uppercase tracking-[0.3em] text-emerald-400">
            How to play
          </span>
          <h2 className="htp-heading text-5xl font-bold leading-[1.05] text-white md:text-7xl">
            Four steps. Then glory.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/50">
            Super 7 isn't just another fantasy game — it's a head-to-head duel
            that plays out over a single cricket match.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="htp-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              {/* Big number background */}
              <div className="pointer-events-none absolute -right-6 -top-8 text-[10rem] font-black leading-none text-white/[0.03] transition-colors group-hover:text-emerald-400/[0.06]">
                {step.number}
              </div>

              <div className="relative z-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl ring-1 ring-white/10">
                  {step.icon}
                </div>

                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Step {step.number}
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.04] p-8">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
              One match. Two players. Seven picks.
            </div>
            <div className="mt-3 text-2xl font-bold text-white md:text-3xl">
              Zero excuses.
            </div>
          </div>
          <div className="flex items-center gap-8">
            <Stat label="Draft picks" value="7 + 1" />
            <Stat label="Special powers" value="3" />
            <Stat label="Winner takes" value="2× stake" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}