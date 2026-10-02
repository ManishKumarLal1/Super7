import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWalletStore } from './hooks/useWallet';

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
  beginContest: (matchId: string, stake: number) => boolean;
  settleContest: (input: SettleInput) => void;
  abandonContest: () => void;
  reset: () => void;
};

export const useMatchesStore = create<MatchesState>()(
  persist(
    (set, get) => ({
      active: null,
      history: [],

      beginContest: (matchId, stake) => {
        // Guard against double-entry
        const existing = get().active;
        if (existing && existing.matchId === matchId) return true;

        // Deduct stake via wallet
        const ok = useWalletStore
          .getState()
          .deductCoins(stake, `Entry: ${matchId}`, 'escrow');
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

      settleContest: ({ result, myPoints, opponentPoints, details }) => {
  const { active, history } = get();
  if (!active) return;

  const { stake, matchId, sessionId } = active;
  let payout = 0;

  if (result === 'won') {
    payout = stake * 2;
    useWalletStore
      .getState()
      .addCoins(payout, `Won: ${matchId}`, 'payout');
  } else if (result === 'tied') {
    payout = stake;
    useWalletStore
      .getState()
      .addCoins(payout, `Refund (tied): ${matchId}`, 'refund');
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

      abandonContest: () => {
        const { active } = get();
        if (!active) return;
        // Refund the stake
        useWalletStore
          .getState()
          .addCoins(active.stake, 'Refund: abandoned', 'refund');
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