import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_SQUAD, type DraftPlayer } from './mockSquad';
import { usePowersStore } from './powersStore';

export type Side = 'me' | 'opponent';
export type DraftPhase =
  | 'toss'
  | 'drafting'
  | 'substitute'
  | 'powers'
  | 'complete';

type DraftState = {
  matchId: string | null;
  stake: number;
  players: DraftPlayer[];
  phase: DraftPhase;

  firstPicker: Side | null;
  tossResult: 'won' | 'lost' | null;

  pickIndex: number;
  myPicks: string[];
  opponentPicks: string[];

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

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
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

      initDraft: (matchId, stake) => {
        // 🔑 Reset powers so stale C/VC/Poison don't carry over
        usePowersStore.getState().reset();

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
        });
      },

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
        if (myPicks.includes(playerId) || opponentPicks.includes(playerId))
          return;

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
        const { phase, pickIndex, myPicks, opponentPicks, players, firstPicker } =
          get();
        if (phase !== 'drafting') return;
        if (pickIndex >= 14) return;
        if (currentSide(pickIndex, firstPicker) !== 'opponent') return;

        const taken = new Set([...myPicks, ...opponentPicks]);
        const available = players.filter((p) => !taken.has(p.id));
        if (available.length === 0) return;

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
        if (myPicks.includes(playerId) || opponentPicks.includes(playerId))
          return;

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
    }),
    {
      name: 'super7-draft',
      partialize: (state) => ({
        matchId: state.matchId,
        stake: state.stake,
        players: state.players,          // 🔑 added — fixes hydration bug
        phase: state.phase,
        firstPicker: state.firstPicker,
        tossResult: state.tossResult,
        pickIndex: state.pickIndex,
        myPicks: state.myPicks,
        opponentPicks: state.opponentPicks,
        mySubstitute: state.mySubstitute,
        opponentSubstitute: state.opponentSubstitute,
        substituteTurn: state.substituteTurn,
      }),
    }
  )
);

export function currentSide(
  pickIndex: number,
  firstPicker: Side | null
): Side {
  if (!firstPicker) return 'me';
  return pickIndex % 2 === 0
    ? firstPicker
    : firstPicker === 'me'
    ? 'opponent'
    : 'me';
}

export const TOTAL_PICKS = 14;