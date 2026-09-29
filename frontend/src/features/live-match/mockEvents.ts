import type { BallEvent, WicketType } from './pointsEngine';
import type { DraftPlayer } from '../draft/mockSquad';

// ---- Match state (kept outside the function so it persists ball to ball) ----
type MatchState = {
  strikerId: string | null;
  nonStrikerId: string | null;
  nextBatsmanIndex: number;   // who comes in next when a wicket falls
  battingOrder: DraftPlayer[];
  bowlingOrder: DraftPlayer[];
  wicketsDown: number;
};

let state: MatchState = {
  strikerId: null,
  nonStrikerId: null,
  nextBatsmanIndex: 2,
  battingOrder: [],
  bowlingOrder: [],
  wicketsDown: 0,
};

let eventCounter = 0;
const uid = () => `evt-${++eventCounter}`;

export function resetMockMatch(
  battingSquad: DraftPlayer[],
  bowlingSquad: DraftPlayer[]
) {
  // Choose a realistic batting order: openers first (BAT role), then others
  const batOrder = [...battingSquad].sort((a, b) => {
    const score = (p: DraftPlayer) =>
      p.role === 'BAT' ? 0 : p.role === 'WK' ? 1 : p.role === 'AR' ? 2 : 3;
    return score(a) - score(b);
  });
  const bowlOrder = bowlingSquad.filter(
    (p) => p.role === 'BOWL' || p.role === 'AR'
  );

  state = {
    strikerId: batOrder[0]?.id ?? null,
    nonStrikerId: batOrder[1]?.id ?? null,
    nextBatsmanIndex: 2,
    battingOrder: batOrder,
    bowlingOrder: bowlOrder,
    wicketsDown: 0,
  };
  eventCounter = 0;
}

export function generateBallEvent(over: number, ballInOver: number): BallEvent {
  if (!state.strikerId || !state.nonStrikerId) {
    throw new Error('Match not initialized — call resetMockMatch first');
  }

  const striker = findPlayer(state.strikerId);
  const nonStriker = findPlayer(state.nonStrikerId);
  const bowler = pickBowlerForOver(over);

  const roll = Math.random();
  const isWicket = roll < 0.055 && state.wicketsDown < 9;

  if (isWicket) {
    const types: WicketType[] = ['bowled', 'caught', 'lbw', 'runout', 'stumped'];
    const weights = [0.25, 0.45, 0.15, 0.1, 0.05];
    const wicketType = weightedPick(types, weights);
    const fielder = pickFielder(bowler.id, striker.id);
    const usesFielder = wicketType !== 'bowled' && wicketType !== 'lbw';

    const event: BallEvent = {
      id: uid(),
      over,
      ballInOver,
      batsmanId: striker.id,
      bowlerId: bowler.id,
      runs: 0,
      isWicket: true,
      wicketType,
      fielderId: usesFielder ? fielder.id : undefined,
      description: buildWicketDescription(striker, bowler, fielder, wicketType),
    };

    // Bring in new batsman
    state.wicketsDown += 1;
    const nextBatsman = state.battingOrder[state.nextBatsmanIndex];
    if (nextBatsman) {
      state.strikerId = nextBatsman.id;
      state.nextBatsmanIndex += 1;
    } else {
      state.strikerId = null; // all out
    }

    return event;
  }

  // Wides / byes
  if (roll < 0.08) {
    return {
      id: uid(),
      over,
      ballInOver,
      batsmanId: striker.id,
      bowlerId: bowler.id,
      runs: 1,
      isWicket: false,
      isWide: true,
      description: `${bowler.shortName} bowls wide, 1 extra`,
    };
  }

  // Runs distribution
  const runsRoll = Math.random();
  let runs = 0;
  if (runsRoll < 0.35) runs = 0;
  else if (runsRoll < 0.65) runs = 1;
  else if (runsRoll < 0.78) runs = 2;
  else if (runsRoll < 0.82) runs = 3;
  else if (runsRoll < 0.92) runs = 4;
  else runs = 6;

  // Rotate strike on odd runs
  if (runs === 1 || runs === 3) {
    [state.strikerId, state.nonStrikerId] = [state.nonStrikerId, state.strikerId];
  }

  return {
    id: uid(),
    over,
    ballInOver,
    batsmanId: striker.id,
    bowlerId: bowler.id,
    runs,
    isWicket: false,
    description:
      runs === 0
        ? `${bowler.shortName} to ${striker.shortName}, no run`
        : `${striker.shortName} ${runsLabel(runs)} off ${bowler.shortName}`,
  };
}

export function rotateStrikeOnOverEnd() {
  // Called by the match loop at end of over — swap striker and non-striker
  if (state.strikerId && state.nonStrikerId) {
    [state.strikerId, state.nonStrikerId] = [state.nonStrikerId, state.strikerId];
  }
}

// ---- Helpers ----

function findPlayer(id: string): DraftPlayer {
  const all = [...state.battingOrder, ...state.bowlingOrder];
  const p = all.find((x) => x.id === id);
  if (!p) throw new Error(`Player not found: ${id}`);
  return p;
}

function pickBowlerForOver(over: number): DraftPlayer {
  if (state.bowlingOrder.length === 0) {
    throw new Error('No bowlers available');
  }
  const idx = Math.floor(over / 2) % state.bowlingOrder.length;
  return state.bowlingOrder[idx];
}

function pickFielder(excludeBowlerId: string, excludeBatsmanId: string): DraftPlayer {
  const options = state.bowlingOrder.filter(
    (p) => p.id !== excludeBowlerId && p.id !== excludeBatsmanId
  );
  return options[Math.floor(Math.random() * options.length)] ?? state.bowlingOrder[0];
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function runsLabel(runs: number): string {
  if (runs === 4) return 'hits FOUR';
  if (runs === 6) return 'hits SIX';
  return `takes ${runs}`;
}

function buildWicketDescription(
  batsman: DraftPlayer,
  bowler: DraftPlayer,
  fielder: DraftPlayer,
  type: WicketType
): string {
  switch (type) {
    case 'bowled':
      return `${bowler.shortName} bowls ${batsman.shortName}`;
    case 'lbw':
      return `${batsman.shortName} LBW b ${bowler.shortName}`;
    case 'caught':
      return `${batsman.shortName} c ${fielder.shortName} b ${bowler.shortName}`;
    case 'stumped':
      return `${batsman.shortName} st ${fielder.shortName} b ${bowler.shortName}`;
    case 'runout':
      return `${batsman.shortName} run out (${fielder.shortName})`;
  }
}