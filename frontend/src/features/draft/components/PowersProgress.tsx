import { POWER_STEPS } from '../powersStore';

type Props = {
  current: string;
};

const LABELS: Record<string, string> = {
  captain: 'Captain',
  'vice-captain': 'Vice-Captain',
  poison: 'Poison',
  confirm: 'Confirm',
};

export function PowersProgress({ current }: Props) {
  const currentIndex = POWER_STEPS.indexOf(current as any);

  return (
    <div className="flex items-center gap-2">
      {POWER_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-7 items-center gap-2 rounded-full px-3 text-xs font-semibold uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-emerald-400 text-black'
                  : isDone
                  ? 'bg-emerald-400/20 text-emerald-300'
                  : 'bg-white/5 text-white/30'
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/20 text-[10px]">
                {isDone ? '✓' : i + 1}
              </span>
              {LABELS[step]}
            </div>
            {i < POWER_STEPS.length - 1 && (
              <div
                className={`h-px w-4 ${
                  isDone ? 'bg-emerald-400/40' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}