import { create } from 'zustand';
import type { BallEvent } from './pointsEngine';
import { eventPoints } from './pointsEngine';

type MatchScore = {
  runs: number;
  wickets: number;
  balls: number;
};

type LiveMatchState = {
  matchId: string | null;
  contestId: string | null;
  totalPoints: Record<string, number>;
  events: BallEvent[];
  score: MatchScore;
  isComplete: boolean;
  startedAt: number | null;
  lastEventSeq: number;

  startMatch: (matchId: string, contestId: string) => void;
  applyEvent: (event: BallEvent) => void;
  setLastEventSeq: (seq: number) => void;
  rebuildFromEvents: (events: (BallEvent & { seq: number })[]) => void;
  complete: () => void;
  reset: () => void;
};

const EMPTY_SCORE: MatchScore = { runs: 0, wickets: 0, balls: 0 };

export const useLiveMatchStore = create<LiveMatchState>()((set, get) => ({
  matchId: null,
  contestId: null,
  totalPoints: {},
  events: [],
  score: EMPTY_SCORE,
  isComplete: false,
  startedAt: null,
  lastEventSeq: 0,

  // Only reset if the match ID actually changed
  startMatch: (matchId, contestId) => {
    if (get().matchId === matchId) return;
    set({
      matchId,
      contestId,
      totalPoints: {},
      events: [],
      score: EMPTY_SCORE,
      isComplete: false,
      startedAt: Date.now(),
      lastEventSeq: 0,
    });
  },

  applyEvent: (event) =>
    set((state) => {
      const deltas = eventPoints(event);
      const nextPoints = { ...state.totalPoints };
      for (const [id, pts] of Object.entries(deltas)) {
        nextPoints[id] = (nextPoints[id] ?? 0) + pts;
      }

      const legalBall = !event.isWide;
      const nextScore = {
        runs: state.score.runs + event.runs + (event.isWide ? 1 : 0),
        wickets: state.score.wickets + (event.isWicket ? 1 : 0),
        balls: state.score.balls + (legalBall ? 1 : 0),
      };

      return {
        totalPoints: nextPoints,
        events: [...state.events.slice(-99), event],
        score: nextScore,
      };
    }),

  setLastEventSeq: (seq) => set({ lastEventSeq: seq }),

  // Wipe accumulated state and replay a full event log
  rebuildFromEvents: (events) => {
    set({
      totalPoints: {},
      events: [],
      score: EMPTY_SCORE,
      lastEventSeq: 0,
    });
    for (const ev of events) {
      get().applyEvent(ev);
      get().setLastEventSeq(ev.seq);
    }
  },

  complete: () => set({ isComplete: true }),

  reset: () =>
    set({
      matchId: null,
      contestId: null,
      totalPoints: {},
      events: [],
      score: EMPTY_SCORE,
      isComplete: false,
      startedAt: null,
      lastEventSeq: 0,
    }),
}));