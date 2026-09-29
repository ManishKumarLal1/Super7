import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useDraftStore } from '../draftStore';
import { usePowersStore } from '../powersStore';
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
      'Half of that player\'s points flow to you. They won\'t see it coming.',
  },
  confirm: {
    eyebrow: 'Final step',
    title: 'Lock it in.',
    subtitle: 'Review your powers. No changes after this.',
  },
};

export function PowersScreen() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const myPicks = useDraftStore((s) => s.myPicks);
  const opponentPicks = useDraftStore((s) => s.opponentPicks);
  const players = useDraftStore((s) => s.players);
  const mySubstitute = useDraftStore((s) => s.mySubstitute);

  const step = usePowersStore((s) => s.step);
  const myCaptain = usePowersStore((s) => s.myCaptain);
  const myViceCaptain = usePowersStore((s) => s.myViceCaptain);
  const myPoison = usePowersStore((s) => s.myPoison);
  const setCaptain = usePowersStore((s) => s.setCaptain);
  const setViceCaptain = usePowersStore((s) => s.setViceCaptain);
  const setPoison = usePowersStore((s) => s.setPoison);
  const confirmPowers = usePowersStore((s) => s.confirm);
  const simulateOpponentPowers = usePowersStore((s) => s.simulateOpponentPowers);
  

  // Simulate opponent powers when entering confirm
  useEffect(() => {
    if (step === 'confirm') {
      simulateOpponentPowers(opponentPicks, myPicks);
    }
  }, [step, opponentPicks, myPicks, simulateOpponentPowers]);

  // Reset powers whenever we enter a fresh powers phase
useEffect(() => {
  const state = usePowersStore.getState();
  const isFreshPhase =
    state.step === 'complete' ||
    !['captain', 'vice-captain', 'poison', 'confirm'].includes(state.step);

  if (isFreshPhase) {
    state.reset();
  }
}, []);


 const myPlayers = myPicks
  .map((id) => players.find((p) => p.id === id))
  .filter(Boolean) as typeof players;

console.log('DEBUG myPicks:', myPicks);
console.log('DEBUG players:', players);
console.log('DEBUG myPlayers:', myPlayers);

  const opponentPlayers = opponentPicks
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as typeof players;

  const copy = STEP_COPY[step] ?? STEP_COPY.captain;

  const handleConfirm = () => {
    confirmPowers();
    // Navigate to live match (route we'll build next)
    navigate('/live-match/demo?stake=200');
  };

  console.log('DEBUG step:', step);
console.log('DEBUG full powers store:', usePowersStore.getState());

  return (
    <div ref={pageRef} className="min-h-screen bg-black pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className=" mb-10 flex flex-wrap items-center justify-between gap-6">
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
    <div className=" rounded-3xl border border-white/10 bg-white/[0.01] p-6 md:p-8">
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
    <div className="space-y-4">
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