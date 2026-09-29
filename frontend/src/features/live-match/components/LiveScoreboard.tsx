import { useLiveMatchStore } from '../liveMatchStore';

export function LiveScoreboard() {
  const score = useLiveMatchStore((s) => s.score);
  const overs = `${Math.floor(score.balls / 6)}.${score.balls % 6}`;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-red-400">
          Live
        </span>
      </div>

      <div className="flex items-baseline gap-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{score.runs}</span>
          <span className="text-lg text-white/50">/</span>
          <span className="text-3xl font-bold text-white">{score.wickets}</span>
        </div>
        <div className="text-sm text-white/50">{overs} overs</div>
      </div>
    </div>
  );
}