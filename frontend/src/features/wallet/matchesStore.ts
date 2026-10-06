import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWalletStore, getWalletSupabase } from './hooks/useWallet';

export type MatchResult = 'won' | 'lost' | 'tied';

export type CompletedMatch = {
  id: string;
  matchId: string;
  stake: number;
  result: MatchResult;
  myPoints: number;
  opponentPoints: number;
  payout: number;
  timestamp: number;
  details?: {
    myPicks: string[];
    opponentPicks: string[];
    mySubstitute: string | null;
    opponentSubstitute: string | null;
    myCaptain: string | null;
    myViceCaptain: string | null;
    myPoison: string | null;
    opponentCaptain: string | null;
    opponentViceCaptain: string | null;
    opponentPoison: string | null;
    basePoints: Record<string, number>;
  };
};

type ActiveContest = {
  sessionId: string;
  matchId: string;
  stake: number;
  startedAt: number;
} | null;

type SettleInput = {
  result: MatchResult;
  myPoints: number;
  opponentPoints: number;
  details?: CompletedMatch['details'];
};

type MatchesState = {
  active: ActiveContest;
  history: CompletedMatch[];
  beginContest: (matchId: string, stake: number) => Promise<boolean>;
  settleContest: (input: SettleInput) => Promise<void>;
  abandonContest: () => Promise<void>;
  reset: () => void;
};

export const useMatchesStore = create<MatchesState>()(
  persist(
    (set, get) => ({
      active: null,
      history: [],

      beginContest: async (matchId, stake) => {
        const existing = get().active;
        if (existing && existing.matchId === matchId) return true;

        if (!getWalletSupabase()) {
          console.error('Supabase not ready');
          return false;
        }

        // Deduct stake via Supabase RPC
        const ok = await useWalletStore
          .getState()
          .deduct(stake, `Entry: ${matchId}`, 'escrow');
        if (!ok) return false;

        set({
          active: {
            sessionId: crypto.randomUUID(),
            matchId,
            stake,
            startedAt: Date.now(),
          },
        });
        return true;
      },

      settleContest: async ({ result, myPoints, opponentPoints, details }) => {
  const { active, history } = get();
  if (!active) return;

  const { stake, matchId, sessionId } = active;
  let payout = 0;

  if (result === 'won' && stake > 0) {          // ← guard stake > 0
    payout = stake * 2;
    await useWalletStore
      .getState()
      .credit(payout, `Won: ${matchId}`, 'payout');
  } else if (result === 'tied' && stake > 0) {  // ← guard stake > 0
    payout = stake;
    await useWalletStore
      .getState()
      .credit(payout, `Refund (tied): ${matchId}`, 'refund');
  }

  set({
    active: null,
    history: [
      {
        id: sessionId,
        matchId,
        stake,
        result,
        myPoints,
        opponentPoints,
        payout,
        timestamp: Date.now(),
        details,
      },
      ...history,
    ].slice(0, 100),
  });
},

      abandonContest: async () => {
  const { active } = get();
  if (!active) return;
  if (active.stake > 0) {                        // ← guard
    await useWalletStore
      .getState()
      .credit(active.stake, 'Refund: abandoned', 'refund');
  }
  set({ active: null });
},

      reset: () => set({ active: null, history: [] }),
    }),
    {
      name: 'super7-matches',
      partialize: (state) => ({
        active: state.active,
        history: state.history,
      }),
    }
  )
);

export function findMatchById(id: string): CompletedMatch | null {
  return useMatchesStore.getState().history.find((m) => m.id === id) ?? null;
}