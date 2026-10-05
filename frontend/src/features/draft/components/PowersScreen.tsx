import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useDraftStore } from '../draftStore';
import { usePowersStore } from '../powersStore';
import { useSupabase } from '../../../lib/useSupabase';
import { gsap } from '../../../animations/gsap.config';
import { PlayerSelectCard } from './PlayerSelectCard';
import { PowersProgress } from './PowersProgress';

const STEP_COPY: Record<
  string,
  { eyebrow: string; title: string; subtitle: string }
> = {
  captain: {
    eyebrow: 'Step 1 of 4',
    title: 'Choose your Captain.',
    subtitle: 'Every run, wicket, and catch from this player counts double.',
  },
  'vice-captain': {
    eyebrow: 'Step 2 of 4',
    title: 'Choose your Vice-Captain.',
    subtitle: 'A steady hand. This player earns 1.5× points.',
  },
  poison: {
    eyebrow: 'Step 3 of 4',
    title: 'Poison one of their players.',
    subtitle:
      "Half of that player's points flow to you. They won't see it coming.",
  },
  confirm: {
    eyebrow: 'Final step',
    title: 'Lock it in.',
    subtitle: 'Review your powers. No changes after this.',
  },
};

const VALID_STEPS = ['captain', 'vice-captain', 'poison', 'confirm'] as const;
type ValidStep = (typeof VALID_STEPS)[number];

type Props = {
  contestId: string;
  matchId: string;
  stake: number;
};

export function PowersScreen({ contestId, matchId, stake }: Props) {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const supabase = useSupabase();

  const myPicks = useDraftStore((s) => s.myPicks);
  const opponentPicks = useDraftStore((s) => s.opponentPicks);
  const players = useDraftStore((s) => s.players);
  const mySubstitute = useDraftStore((s) => s.mySubstitute);

  const rawStep = usePowersStore((s) => s.step);
  const myCaptain = usePowersStore((s) => s.myCaptain);
  const myViceCaptain = usePowersStore((s) => s.myViceCaptain);
  const myPoison = usePowersStore((s) => s.myPoison);
  const setContestId = usePowersStore((s) => s.setContestId);
  const setCaptain = usePowersStore((s) => s.setCaptain);
  const setViceCaptain = usePowersStore((s) => s.setViceCaptain);
  const setPoison = usePowersStore((s) => s.setPoison);
  const confirmPowers = usePowersStore((s) => s.confirm);
  const setPowersSupabase = usePowersStore((s: any) => s.__setSupabase);
  const resetPowers = usePowersStore((s) => s.reset);

  // Set contestId + supabase ref
  useEffect(() => {
    setContestId(contestId);
    if (supabase) {
      import('../powersStore').then((mod) => {
        if (mod.setPowersSupabase) mod.setPowersSupabase(supabase);
      });
    }
  }, [contestId, supabase, setContestId]);

  // Fallback to 'captain' if step is invalid
  const step: ValidStep = (VALID_STEPS as readonly string[]).includes(rawStep)
    ? (rawStep as ValidStep)
    : 'captain';

  // Self-heal an invalid step
  useEffect(() => {
    const state = usePowersStore.getState();
    if (
      state.step === 'complete' ||
      !(VALID_STEPS as readonly string[]).includes(state.step)
    ) {
      state.reset();
      state.setContestId(contestId);
    }
  }, [contestId]);

  // Entrance animation
  useGSAP(() => {
    const targets = gsap.utils.toArray<HTMLElement>('.powers-fade');
    if (targets.length === 0) return;

    gsap.fromTo(
      targets,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      }
    );
  }, { scope: pageRef, dependencies: [step] });

  const myPlayers = myPicks
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as typeof players;

  const opponentPlayers = opponentPicks
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as typeof players;

  const copy = STEP_COPY[step];

  const handleConfirm = async () => {
    await confirmPowers();
    navigate(`/live-match/${matchId}?stake=${stake}`);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-black pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="powers-fade mb-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
              {copy.eyebrow}
            </div>
            <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-xl text-white/50">{copy.subtitle}</p>
          </div>
          <PowersProgress current={step} />
        </div>

        {/* Body — switches by step */}
        {step === 'captain' && (
          <Section title="Your Super 7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {myPlayers.map((player) => (
                <PlayerSelectCard
                  key={player.id}
                  player={player}
                  selected={false}
                  onClick={() => setCaptain(player.id)}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 'vice-captain' && (
          <Section title="Your Super 7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {myPlayers.map((player) => {
                const isCaptain = player.id === myCaptain;
                return (
                  <PlayerSelectCard
                    key={player.id}
                    player={player}
                    selected={false}
                    disabled={isCaptain}
                    badge={isCaptain ? 'C' : undefined}
                    badgeColor="bg-yellow-400 text-black"
                    onClick={() => setViceCaptain(player.id)}
                  />
                );
              })}
            </div>
          </Section>
        )}

        {step === 'poison' && (
          <Section title="Opponent's Super 7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {opponentPlayers.map((player) => (
                <PlayerSelectCard
                  key={player.id}
                  player={player}
                  selected={false}
                  badge="☠"
                  badgeColor="bg-purple-500 text-white"
                  onClick={() => setPoison(player.id)}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 'confirm' && (
          <ConfirmPanel
            myCaptain={myCaptain}
            myViceCaptain={myViceCaptain}
            myPoison={myPoison}
            mySubstitute={mySubstitute}
            players={players}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="powers-fade rounded-3xl border border-white/10 bg-white/[0.01] p-6 md:p-8">
      <div className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        {title}
      </div>
      {children}
    </div>
  );
}

function ConfirmPanel({
  myCaptain,
  myViceCaptain,
  myPoison,
  mySubstitute,
  players,
  onConfirm,
}: {
  myCaptain: string | null;
  myViceCaptain: string | null;
  myPoison: string | null;
  mySubstitute: string | null;
  players: any[];
  onConfirm: () => void;
}) {
  const find = (id: string | null) => players.find((p) => p.id === id);

  const rows = [
    {
      label: 'Captain',
      badge: 'C',
      badgeColor: 'bg-yellow-400 text-black',
      player: find(myCaptain),
      multiplier: '2.0×',
    },
    {
      label: 'Vice-Captain',
      badge: 'VC',
      badgeColor: 'bg-amber-300 text-black',
      player: find(myViceCaptain),
      multiplier: '1.5×',
    },
    {
      label: 'Poison target',
      badge: '☠',
      badgeColor: 'bg-purple-500 text-white',
      player: find(myPoison),
      multiplier: 'steals 0.5×',
    },
    {
      label: 'Substitute',
      badge: 'S',
      badgeColor: 'bg-amber-400/20 text-amber-300',
      player: find(mySubstitute),
      multiplier: 'auto-swap',
    },
  ];

  return (
    <div className="powers-fade space-y-4">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center gap-4 p-5 ${
              i !== rows.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${row.badgeColor}`}
            >
              {row.badge}
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                {row.label}
              </div>
              <div className="mt-1 text-base font-semibold text-white">
                {row.player ? row.player.shortName : '—'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-white/40">
                Effect
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-400">
                {row.multiplier}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onConfirm}
        className="w-full rounded-2xl bg-emerald-400 py-5 text-base font-semibold text-black transition-transform hover:scale-[1.01]"
      >
        Lock in & enter match →
      </button>
    </div>
  );
}