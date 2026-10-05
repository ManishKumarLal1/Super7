import { useMemo, useState } from 'react';
import { useDraftStore, currentSide } from '../draftStore';
import { PlayerCard } from './PlayerCard';
import type { PlayerRole } from '../mockSquad';

type TeamFilter = 'ALL' | 'IND' | 'AUS';
type RoleFilter = 'ALL' | PlayerRole;

type Props = {
  onPick: (playerId: string) => void;
};

export function SquadPool({ onPick }: Props) {
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  const players = useDraftStore((s) => s.players);
  const myPicks = useDraftStore((s) => s.myPicks);
  const opponentPicks = useDraftStore((s) => s.opponentPicks);

  const phase = useDraftStore((s) => s.phase);
  const pickIndex = useDraftStore((s) => s.pickIndex);
  const firstPicker = useDraftStore((s) => s.firstPicker);
  const substituteTurn = useDraftStore((s) => s.substituteTurn);
  const pickSubstitute = useDraftStore((s) => s.pickSubstitute);

  const isMyTurn =
    (phase === 'drafting' && currentSide(pickIndex, firstPicker) === 'me') ||
    (phase === 'substitute' && substituteTurn === 'me');

  const handleClick = (id: string) => {
  if (phase === 'drafting' || phase === 'substitute') onPick(id);
};

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (teamFilter !== 'ALL' && p.team !== teamFilter) return false;
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      return true;
    });
  }, [players, teamFilter, roleFilter]);

  const mySub = useDraftStore((s) => s.mySubstitute);
const oppSub = useDraftStore((s) => s.opponentSubstitute);

const isPicked = (id: string) =>
  myPicks.includes(id) ||
  opponentPicks.includes(id) ||
  mySub === id ||
  oppSub === id;

const pickedBy = (id: string): 'me' | 'opponent' | undefined => {
  if (myPicks.includes(id) || mySub === id) return 'me';
  if (opponentPicks.includes(id) || oppSub === id) return 'opponent';
  return undefined;
};

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['ALL', 'IND', 'AUS'] as TeamFilter[]).map((t) => (
          <FilterChip key={t} active={teamFilter === t} onClick={() => setTeamFilter(t)}>
            {t === 'ALL' ? 'All teams' : t}
          </FilterChip>
        ))}
        <div className="mx-2 h-5 w-px bg-white/10" />
        {(['ALL', 'BAT', 'BOWL', 'AR', 'WK'] as RoleFilter[]).map((r) => (
          <FilterChip key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>
            {r === 'ALL' ? 'All roles' : r}
          </FilterChip>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            picked={isPicked(player.id)}
            pickedBy={pickedBy(player.id)}
            disabled={!isMyTurn}
            onClick={() => handleClick(player.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-white text-black'
          : 'bg-white/5 text-white/60 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}