import { useLiveMatchStore } from '../liveMatchStore';

export function EventTicker() {
  const events = useLiveMatchStore((s) => s.events);
  const recent = events.slice(-6).reverse();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Live events
      </div>
      <div className="space-y-2">
        {recent.length === 0 && (
          <div className="text-sm text-white/30">Waiting for first ball…</div>
        )}
        {recent.map((event) => (
          <div
            key={event.id}
            className={`text-sm ${
              event.isWicket
                ? 'font-semibold text-rose-400'
                : event.runs === 6
                ? 'text-emerald-400'
                : event.runs === 4
                ? 'text-sky-400'
                : 'text-white/60'
            }`}
          >
            <span className="mr-2 font-mono text-xs text-white/30">
              {event.over}.{event.ballInOver}
            </span>
            {event.description}
          </div>
        ))}
      </div>
    </div>
  );
}