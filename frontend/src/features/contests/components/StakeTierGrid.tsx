import { StakeTierCard } from './StakeTierCard';

const TIERS = [
  {
    stake: 200,
    label: 'Rookie',
    description: 'Low stakes, high fun. Perfect for your first draft.',
    accent: 'from-emerald-500/10 to-transparent',
  },
  {
    stake: 400,
    label: 'Contender',
    description: 'The sweet spot. Balanced risk, real bragging rights.',
    accent: 'from-purple-500/10 to-transparent',
  },
  {
    stake: 1000,
    label: 'Legend',
    description: 'High rollers only. Win big or go home.',
    accent: 'from-yellow-500/10 to-transparent',
  },
];

type Props = {
  selected: number | null;
  onSelect: (stake: number) => void;
  balance: number;
};

export function StakeTierGrid({ selected, onSelect, balance }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:gap-6">
      {TIERS.map((tier) => (
        <StakeTierCard
          key={tier.stake}
          {...tier}
          selected={selected === tier.stake}
          onSelect={() => onSelect(tier.stake)}
          disabled={balance < tier.stake}
        />
      ))}
    </div>
  );
}