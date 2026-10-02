import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../../animations/gsap.config';

type PointRow = {
  action: string;
  points: string;
  highlight?: boolean;
};

const BATTING: PointRow[] = [
  { action: 'Run scored', points: '+1' },
  { action: 'Boundary (4)', points: '+1' },
  { action: 'Six (6)', points: '+2' },
  { action: 'Half-century', points: '+8', highlight: true },
  { action: 'Century', points: '+24', highlight: true },
  { action: 'Duck (out for 0)', points: '−2' },
];

const BOWLING: PointRow[] = [
  { action: 'Wicket (excl. run-out)', points: '+25', highlight: true },
  { action: 'Maiden over', points: '+12', highlight: true },
  { action: 'Economy < 5 RPO', points: '+6' },
  { action: 'Economy 5–6 RPO', points: '+4' },
  { action: 'Economy 6–7 RPO', points: '+2' },
  { action: 'Economy 10+ RPO', points: '−2' },
];

const FIELDING: PointRow[] = [
  { action: 'Catch', points: '+8' },
  { action: 'Stumping', points: '+12', highlight: true },
  { action: 'Direct run-out', points: '+12', highlight: true },
  { action: 'Indirect run-out', points: '+6' },
];

const MULTIPLIERS = [
  {
    label: 'Captain',
    badge: 'C',
    effect: '2.0×',
    description: 'Every point this player earns is doubled.',
    color: 'text-yellow-400',
    badgeColor: 'bg-yellow-400 text-black',
  },
  {
    label: 'Vice-Captain',
    badge: 'VC',
    effect: '1.5×',
    description: 'A safer pick with strong upside.',
    color: 'text-amber-300',
    badgeColor: 'bg-amber-300 text-black',
  },
  {
    label: 'Poison',
    badge: '☠',
    effect: '0.5×',
    description:
      'You halve one opponent player\'s points. The other half flows to you.',
    color: 'text-purple-400',
    badgeColor: 'bg-purple-500 text-white',
  },
];

export function PointsDistributionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const heading = sectionRef.current?.querySelector('.pts-heading');
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

    const cards = gsap.utils.toArray<HTMLElement>('.pts-card');
    if (cards.length === 0) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
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
            Points system
          </span>
          <h2 className="pts-heading text-5xl font-bold leading-[1.05] text-white md:text-7xl">
            Every ball matters.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/50">
            Points are earned ball-by-ball, in real time. Standard T20 scoring
            with a few twists — see the tables below.
          </p>
        </div>

        {/* Points tables */}
        <div className="grid gap-6 lg:grid-cols-3">
          <PointsCard title="Batting" rows={BATTING} />
          <PointsCard title="Bowling" rows={BOWLING} />
          <PointsCard title="Fielding" rows={FIELDING} />
        </div>

        {/* Multipliers */}
        <div className="mt-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                Special powers
              </div>
              <h3 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                The multipliers that decide it.
              </h3>
            </div>
            <p className="max-w-md text-sm text-white/50">
              Powers are chosen after the draft. They can swing a match by 100+
              points — use them wisely.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {MULTIPLIERS.map((m) => (
              <div
                key={m.label}
                className="pts-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all hover:border-white/20"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold ${m.badgeColor}`}
                  >
                    {m.badge}
                  </div>
                  <div className={`text-4xl font-black ${m.color}`}>
                    {m.effect}
                  </div>
                </div>

                <h4 className="mb-2 text-xl font-bold text-white">
                  {m.label}
                </h4>
                <p className="text-sm leading-relaxed text-white/50">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Worked example */}
        <div className="mt-20 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.06] to-transparent p-8 md:p-12">
          <div className="mb-8 text-xs uppercase tracking-[0.3em] text-emerald-400">
            Worked example
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-white md:text-3xl">
                Virat Kohli scores 84 off 52.
              </h3>
              <p className="mt-3 text-white/50">
                A typical top-order performance. Here's what it earns you:
              </p>
            </div>

            <div className="space-y-2">
              <ExampleRow label="84 runs" value="+84" />
              <ExampleRow label="7 boundaries" value="+7" />
              <ExampleRow label="3 sixes" value="+6" />
              <ExampleRow label="Half-century bonus" value="+8" />
              <div className="my-3 h-px bg-white/10" />
              <ExampleRow label="Base points" value="105" bold />
              <ExampleRow
                label="As Captain (2×)"
                value="210"
                accent="text-yellow-400"
                bold
              />
              <ExampleRow
                label="As Vice-Captain (1.5×)"
                value="157.5"
                accent="text-amber-300"
                bold
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PointsCard({ title, rows }: { title: string; rows: PointRow[] }) {
  return (
    <div className="pts-card overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/5 px-6 py-5">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          {title}
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <div
            key={row.action}
            className="flex items-center justify-between px-6 py-4"
          >
            <span
              className={
                row.highlight ? 'font-medium text-white' : 'text-white/60'
              }
            >
              {row.action}
            </span>
            <span
              className={`font-mono font-bold ${
                row.highlight ? 'text-emerald-400' : 'text-white/80'
              }`}
            >
              {row.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleRow({
  label,
  value,
  bold,
  accent = 'text-white',
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/[0.02]">
      <span className="text-sm text-white/60">{label}</span>
      <span
        className={`font-mono ${accent} ${bold ? 'text-lg font-bold' : 'text-sm'}`}
      >
        {value}
      </span>
    </div>
  );
}