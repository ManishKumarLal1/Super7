import { create } from 'zustand';
import type { BallEvent } from './pointsEngine';
import { eventPoints } from './pointsEngine';

type MatchScore = {
  runs: number;
  wickets: number;
  balls: number;
};

type LiveMatchState = {
  totalPoints: Record<string, number>;
  events: BallEvent[];
  score: MatchScore;
  isComplete: boolean;

  applyEvent: (event: BallEvent) => void;
  reset: () => void;
  complete: () => void;
};

export const useLiveMatchStore = create<LiveMatchState>((set) => ({
  totalPoints: {},
  events: [],
  score: { runs: 0, wickets: 0, balls: 0 },
  isComplete: false,

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

  complete: () => set({ isComplete: true }),

  reset: () =>
    set({
      totalPoints: {},
      events: [],
      score: { runs: 0, wickets: 0, balls: 0 },
      isComplete: false,
    }),
}));