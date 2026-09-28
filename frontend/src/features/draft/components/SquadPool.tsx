import { useMemo, useState } from 'react';
import { useDraftStore, currentSide } from '../draftStore';
import { PlayerCard } from './PlayerCard';
import type { PlayerRole } from '../mockSquad';

type TeamFilter = 'ALL' | 'IND' | 'AUS';
type RoleFilter = 'ALL' | PlayerRole;

export function SquadPool() {
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  // Store reads
  const players = useDraftStore((s) => s.players);
  const myPicks = useDraftStore((s) => s.myPicks);
  const opponentPicks = useDraftStore((s) => s.opponentPicks);

  const phase = useDraftStore((s) => s.phase);
  const pickIndex = useDraftStore((s) => s.pickIndex);
  const firstPicker = useDraftStore((s) => s.firstPicker);
  const substituteTurn = useDraftStore((s) => s.substituteTurn);

  const pickPlayer = useDraftStore((s) => s.pickPlayer);
  const pickSubstitute = useDraftStore((s) => s.pickSubstitute);

  // Turn logic
  const isMyTurn =
    (phase === 'drafting' && currentSide(pickIndex, firstPicker) === 'me') ||
    (phase === 'substitute' && substituteTurn === 'me');

  // Route clicks to the right action based on phase
  const handlePick = (id: string) => {
    if (phase === 'drafting') pickPlayer(id);
    else if (phase === 'substitute') pickSubstitute(id);
  };

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (teamFilter !== 'ALL' && p.team !== teamFilter) return false;
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      return true;
    });
  }, [players, teamFilter, roleFilter]);

  const isPicked = (id: string) =>
    myPicks.includes(id) || opponentPicks.includes(id);

  const pickedBy = (id: string): 'me' | 'opponent' | undefined => {
    if (myPicks.includes(id)) return 'me';
    if (opponentPicks.includes(id)) return 'opponent';
    return undefined;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['ALL', 'IND', 'AUS'] as TeamFilter[]).map((t) => (
          <FilterChip
            key={t}
            active={teamFilter === t}
            onClick={() => setTeamFilter(t)}
          >
            {t === 'ALL' ? 'All teams' : t}
          </FilterChip>
        ))}
        <div className="mx-2 h-5 w-px bg-white/10" />
        {(['ALL', 'BAT', 'BOWL', 'AR', 'WK'] as RoleFilter[]).map((r) => (
          <FilterChip
            key={r}
            active={roleFilter === r}
            onClick={() => setRoleFilter(r)}
          >
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
            onClick={() => handlePick(player.id)}
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