import { MOCK_MATCHES } from '../mockMatches';
import { MatchRow } from './MatchRow';

type Props = {
  selected: string | null;
  onSelect: (matchId: string) => void;
};

export function MatchSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-3">
      {MOCK_MATCHES.map((match) => (
        <MatchRow
          key={match.id}
          match={match}
          selected={selected === match.id}
          onSelect={() => onSelect(match.id)}
        />
      ))}
    </div>
  );
}