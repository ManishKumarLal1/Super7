import { create } from 'zustand';
import { MOCK_SQUAD, type DraftPlayer } from './mockSquad';
import { usePowersStore } from './powersStore';

export type Side = 'me' | 'opponent';
export type DraftPhase =
  | 'lobby'
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
  recordToss: (firstPickerId: string) => void;
  applyPickFromServer: (pick: {
    userId: string;
    playerId: string;
    pickIndex: number;
  }) => void;
  reset: () => void;
};

// Module-level supabase ref — set by useDraftSync
let _supabase: any = null;
export function setDraftSupabase(client: any) {
  _supabase = client;
}
export function getDraftSupabase() {
  return _supabase;
}

export const useDraftStore = create<DraftState>()((set, get) => ({
  matchId: null,
  stake: 0,
  players: MOCK_SQUAD,
  phase: 'lobby',

  firstPicker: null,
  tossResult: null,

  pickIndex: 0,
  myPicks: [],
  opponentPicks: [],

  mySubstitute: null,
  opponentSubstitute: null,
  substituteTurn: null,

  initDraft: (matchId, stake) => {
    usePowersStore.getState().reset();

    set({
      matchId,
      stake,
      players: MOCK_SQUAD,
      phase: 'lobby',
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

  tossCoin: () => {},

  pickPlayer: (playerId) => {
    const { phase, myPicks, opponentPicks, firstPicker } = get();

    if (!firstPicker) return;
    if (phase !== 'drafting') return;

    const totalBefore = myPicks.length + opponentPicks.length;
    if (totalBefore >= 14) return;
    if (currentSide(totalBefore, firstPicker) !== 'me') return;
    if (myPicks.includes(playerId) || opponentPicks.includes(playerId)) return;

    const nextMyPicks = [...myPicks, playerId];
    const totalAfter = nextMyPicks.length + opponentPicks.length;

    set({
      myPicks: nextMyPicks,
      pickIndex: totalAfter,
      phase: totalAfter >= 14 ? 'substitute' : 'drafting',
      substituteTurn: totalAfter >= 14 ? 'me' : null,
    });
  },

  simulateOpponentPick: () => {},

  pickSubstitute: (playerId) => {
    const { phase, myPicks, opponentPicks, substituteTurn } = get();
    if (phase !== 'substitute') return;
    if (substituteTurn !== 'me') return;
    if (myPicks.includes(playerId) || opponentPicks.includes(playerId)) return;

    set({ mySubstitute: playerId, substituteTurn: 'opponent' });
  },

  simulateOpponentSubstitute: () => {},

  recordToss: (firstPickerId) => {
  const me = (window as any).Clerk?.user?.id;
  const iAmFirst = firstPickerId === me;
  const state = get();

  const totalPicks = state.myPicks.length + state.opponentPicks.length;

  set({
    firstPicker: iAmFirst ? 'me' : 'opponent',
    tossResult: iAmFirst ? 'won' : 'lost',
    // If picks already exist, skip the toss animation — go straight to drafting
    phase: totalPicks > 0 ? 'drafting' : 'toss',
  });

  // Only show the toss animation on a fresh draft
  if (totalPicks === 0) {
    setTimeout(() => {
      const current = get();
      if (current.phase === 'toss') {
        // 🚫 Don't touch pickIndex — it's already correct
        set({ phase: 'drafting' });
      }
    }, 2500);
  }
},

  applyPickFromServer: ({ userId, playerId, pickIndex: serverIndex }) => {
    const me = (window as any).Clerk?.user?.id;
    const state = get();
    const isMine = userId === me;

    // --- Substitute picks (pick_index 14 or 15) ---
    if (serverIndex === 14 || serverIndex === 15) {
      if (isMine) {
        if (state.mySubstitute === playerId) return;
        set({ mySubstitute: playerId });
      } else {
        if (state.opponentSubstitute === playerId) return;
        set({ opponentSubstitute: playerId });
      }

      const mySub = isMine ? playerId : state.mySubstitute;
      const oppSub = isMine ? state.opponentSubstitute : playerId;
      if (mySub && oppSub) {
        set({ phase: 'powers', substituteTurn: null });
      } else {
        set({ substituteTurn: isMine ? 'opponent' : 'me' });
      }
      return;
    }

    // --- Main picks (pick_index 0-13) ---
    if (isMine && state.myPicks.includes(playerId)) return;
    if (!isMine && state.opponentPicks.includes(playerId)) return;

    const nextMyPicks = isMine ? [...state.myPicks, playerId] : state.myPicks;
    const nextOpponentPicks = isMine
      ? state.opponentPicks
      : [...state.opponentPicks, playerId];

    const totalPicks = nextMyPicks.length + nextOpponentPicks.length;

    if (totalPicks >= 14) {
      const firstPickerSide = state.firstPicker;
      set({
        myPicks: nextMyPicks,
        opponentPicks: nextOpponentPicks,
        pickIndex: totalPicks,
        phase: 'substitute',
        substituteTurn: firstPickerSide,
      });
    } else {
      set({
        myPicks: nextMyPicks,
        opponentPicks: nextOpponentPicks,
        pickIndex: totalPicks,
      });
    }
  },

  reset: () =>
    set({
      matchId: null,
      stake: 0,
      phase: 'lobby',
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