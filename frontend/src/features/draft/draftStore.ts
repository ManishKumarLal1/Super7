import { create } from 'zustand';
import { MOCK_SQUAD, type DraftPlayer } from './mockSquad';

export type Side = 'me' | 'opponent';
export type DraftPhase = 'toss' | 'drafting' | 'substitute' | 'powers' | 'complete';

type DraftState = {
  matchId: string | null;
  stake: number;
  players: DraftPlayer[];
  phase: DraftPhase;

  // Toss
  firstPicker: Side | null;
  tossResult: 'won' | 'lost' | null;

  // Draft
  pickIndex: number;
  myPicks: string[];
  opponentPicks: string[];

  // Substitutes
  mySubstitute: string | null;
  opponentSubstitute: string | null;
  substituteTurn: Side | null;

  initDraft: (matchId: string, stake: number) => void;
  tossCoin: () => void;
  pickPlayer: (playerId: string) => void;
  simulateOpponentPick: () => void;
  pickSubstitute: (playerId: string) => void;
  simulateOpponentSubstitute: () => void;
  reset: () => void;
};

export const useDraftStore = create<DraftState>((set, get) => ({
  matchId: null,
  stake: 0,
  players: MOCK_SQUAD,
  phase: 'toss',

  firstPicker: null,
  tossResult: null,

  pickIndex: 0,
  myPicks: [],
  opponentPicks: [],

  mySubstitute: null,
  opponentSubstitute: null,
  substituteTurn: null,

  initDraft: (matchId, stake) =>
    set({
      matchId,
      stake,
      players: MOCK_SQUAD,
      phase: 'toss',
      firstPicker: null,
      tossResult: null,
      pickIndex: 0,
      myPicks: [],
      opponentPicks: [],
      mySubstitute: null,
      opponentSubstitute: null,
      substituteTurn: null,
    }),

  tossCoin: () => {
    const iWon = Math.random() < 0.5;
    set({
      firstPicker: iWon ? 'me' : 'opponent',
      tossResult: iWon ? 'won' : 'lost',
      phase: 'drafting',
      pickIndex: 0,
    });
  },

  pickPlayer: (playerId) => {
    const { phase, pickIndex, myPicks, opponentPicks, firstPicker } = get();
    if (phase !== 'drafting') return;
    if (pickIndex >= 14) return;
    if (currentSide(pickIndex, firstPicker) !== 'me') return;
    if (myPicks.includes(playerId) || opponentPicks.includes(playerId)) return;

    const nextMyPicks = [...myPicks, playerId];
    const nextIndex = pickIndex + 1;

    set({
      myPicks: nextMyPicks,
      pickIndex: nextIndex,
      phase: nextIndex >= 14 ? 'substitute' : 'drafting',
      substituteTurn: nextIndex >= 14 ? 'me' : null,
    });
  },

  simulateOpponentPick: () => {
    const { phase, pickIndex, myPicks, opponentPicks, players, firstPicker } = get();
    if (phase !== 'drafting') return;
    if (pickIndex >= 14) return;
    if (currentSide(pickIndex, firstPicker) !== 'opponent') return;

    const taken = new Set([...myPicks, ...opponentPicks]);
    const available = players.filter((p) => !taken.has(p.id));
    if (available.length === 0) return;

    // Weighted: prefers BAT/AR with high credits
    const weighted = available.map((p) => ({
      player: p,
      weight: (p.role === 'BAT' || p.role === 'AR' ? 2 : 1) * p.credits,
    }));
    const total = weighted.reduce((sum, w) => sum + w.weight, 0);
    let r = Math.random() * total;
    let chosen = weighted[0].player;
    for (const w of weighted) {
      r -= w.weight;
      if (r <= 0) {
        chosen = w.player;
        break;
      }
    }

    const nextOpponentPicks = [...opponentPicks, chosen.id];
    const nextIndex = pickIndex + 1;

    set({
      opponentPicks: nextOpponentPicks,
      pickIndex: nextIndex,
      phase: nextIndex >= 14 ? 'substitute' : 'drafting',
      substituteTurn: nextIndex >= 14 ? 'me' : null,
    });
  },

  pickSubstitute: (playerId) => {
    const { phase, myPicks, opponentPicks, substituteTurn } = get();
    if (phase !== 'substitute') return;
    if (substituteTurn !== 'me') return;
    if (myPicks.includes(playerId) || opponentPicks.includes(playerId)) return;

    set({
      mySubstitute: playerId,
      substituteTurn: 'opponent',
    });
  },

  simulateOpponentSubstitute: () => {
    const { phase, myPicks, opponentPicks, substituteTurn, players } = get();
    if (phase !== 'substitute') return;
    if (substituteTurn !== 'opponent') return;

    const taken = new Set([...myPicks, ...opponentPicks]);
    const available = players.filter((p) => !taken.has(p.id));
    if (available.length === 0) return;

    const pick = available[Math.floor(Math.random() * available.length)];

    set({
      opponentSubstitute: pick.id,
      substituteTurn: null,
      phase: 'powers',
    });
  },

  reset: () =>
    set({
      matchId: null,
      stake: 0,
      phase: 'toss',
      firstPicker: null,
      tossResult: null,
      pickIndex: 0,
      myPicks: [],
      opponentPicks: [],
      mySubstitute: null,
      opponentSubstitute: null,
      substituteTurn: null,
    }),
}));

export function currentSide(pickIndex: number, firstPicker: Side | null): Side {
  if (!firstPicker) return 'me';
  // Straight alternating: even index → firstPicker, odd → other
  return pickIndex % 2 === 0 ? firstPicker : firstPicker === 'me' ? 'opponent' : 'me';
}

export const TOTAL_PICKS = 14;