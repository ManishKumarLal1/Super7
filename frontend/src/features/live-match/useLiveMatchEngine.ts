import { useEffect } from 'react';
import { useLiveMatchStore } from './liveMatchStore';
import { useMatchesStore } from '../wallet/matchesStore';
import { useDraftStore } from '../draft/draftStore';
import {
  generateBallEvent,
  resetMockMatch,
  rotateStrikeOnOverEnd,
} from './mockEvents';

const BALL_INTERVAL_MS = 2000;
const MATCH_DURATION_BALLS = 120;

export function useLiveMatchEngine() {
  const players = useDraftStore((s) => s.players);
  const activeMatchId = useMatchesStore((s) => s.active?.matchId);
  const storeMatchId = useLiveMatchStore((s) => s.matchId);
  const isComplete = useLiveMatchStore((s) => s.isComplete);

  const applyEvent = useLiveMatchStore((s) => s.applyEvent);
  const complete = useLiveMatchStore((s) => s.complete);
  const startMatch = useLiveMatchStore((s) => s.startMatch);

  // Initialize mock state when a new match becomes active
  useEffect(() => {
    if (!activeMatchId) return;
    if (storeMatchId === activeMatchId) return; // already running

    const battingSquad = players.filter((p) => p.team === 'IND');
    const bowlingSquad = players.filter((p) => p.team === 'AUS');

    startMatch(activeMatchId, `live-${Date.now()}`);
    resetMockMatch(battingSquad, bowlingSquad);
  }, [activeMatchId, storeMatchId, players, startMatch]);

  // Run the ball stream — the actual engine
  useEffect(() => {
    if (!activeMatchId) return;
    if (isComplete) return;

    const interval = setInterval(() => {
      const state = useLiveMatchStore.getState();
      const { score: s, matchId } = state;

      if (!matchId) return;

      if (s.balls >= MATCH_DURATION_BALLS || s.wickets >= 10) {
        complete();
        return;
      }

      const over = Math.floor(s.balls / 6);
      const ballInOver = (s.balls % 6) + 1;

      const event = generateBallEvent(over, ballInOver);
      applyEvent(event);

      if (ballInOver === 6) {
        rotateStrikeOnOverEnd();
      }
    }, BALL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [activeMatchId, isComplete, applyEvent, complete]);
}