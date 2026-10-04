import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

  startMatch: (matchId: string, contestId: string) => void;
  applyEvent: (event: BallEvent) => void;
  complete: () => void;
  reset: () => void;
};

const EMPTY_SCORE: MatchScore = { runs: 0, wickets: 0, balls: 0 };

export const useLiveMatchStore = create<LiveMatchState>()(
  persist(
    (set) => ({
      matchId: null,
      contestId: null,
      totalPoints: {},
      events: [],
      score: EMPTY_SCORE,
      isComplete: false,
      startedAt: null,

      startMatch: (matchId, contestId) =>
        set({
          matchId,
          contestId,
          totalPoints: {},
          events: [],
          score: EMPTY_SCORE,
          isComplete: false,
          startedAt: Date.now(),
        }),

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
          matchId: null,
          contestId: null,
          totalPoints: {},
          events: [],
          score: EMPTY_SCORE,
          isComplete: false,
          startedAt: null,
        }),
    }),
    {
      name: 'super7-live-match',
      partialize: (state) => ({
        matchId: state.matchId,
        contestId: state.contestId,
        totalPoints: state.totalPoints,
        events: state.events,
        score: state.score,
        isComplete: state.isComplete,
        startedAt: state.startedAt,
      }),
    }
  )
);