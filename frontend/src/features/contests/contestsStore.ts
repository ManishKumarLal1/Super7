import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWalletStore } from '../wallet/hooks/useWallet';

export type ContestStatus = 'waiting' | 'ready' | 'live' | 'completed';
export type ContestRole = 'creator' | 'joiner';

export type ContestPlayer = {
  id: string;
  name: string;
  avatarInitials: string;
  isMe: boolean;
  joinedAt: number;
};

export type Contest = {
  id: string;
  code: string;
  role: ContestRole;
  matchId: string;
  stake: number;         // 0 = free
  status: ContestStatus;
  players: ContestPlayer[];
  createdAt: number;
  expiresAt: number;
};

type ContestsState = {
  active: Contest | null;
  create: (matchId: string, stake: number) => Promise<Contest | null>;
  join: (code: string) => Promise<Contest | null>;
  leave: () => Promise<void>;
  reset: () => void;
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const EXPIRY_MS = 1000 * 60 * 30; // 30 min

export const useContestsStore = create<ContestsState>()(
  persist(
    (set, get) => ({
      active: null,

      create: async (matchId, stake) => {
        // Deduct stake if not free
        if (stake > 0) {
          const ok = await useWalletStore
            .getState()
            .deduct(stake, `Create contest: ${matchId}`, 'escrow');
          if (!ok) return null;
        }

        const contest: Contest = {
          id: crypto.randomUUID(),
          code: generateCode(),
          role: 'creator',
          matchId,
          stake,
          status: 'waiting',
          players: [
            {
              id: 'me',
              name: 'You',
              avatarInitials: 'ME',
              isMe: true,
              joinedAt: Date.now(),
            },
          ],
          createdAt: Date.now(),
          expiresAt: Date.now() + EXPIRY_MS,
        };

        set({ active: contest });
        return contest;
      },

      join: async (code) => {
        const upper = code.trim().toUpperCase();

        // If joining your own active contest, no-op
        const existing = get().active;
        if (existing && existing.code === upper) return existing;

        // Simulate finding a contest
        // (In real backend: fetch from server by code)
        const fakeOpponentNames = [
          'Arjun Mehta',
          'Neha Kapoor',
          'Vikram Shah',
          'Ananya Rao',
        ];
        const opponent =
          fakeOpponentNames[Math.floor(Math.random() * fakeOpponentNames.length)];

        const stake = 200;

        // Deduct entry stake
        const ok = await useWalletStore
          .getState()
          .deduct(stake, `Join contest: ${upper}`, 'escrow');
        if (!ok) return null;

        const contest: Contest = {
          id: crypto.randomUUID(),
          code: upper,
          role: 'joiner',
          matchId: 'ind-vs-aus-1',
          stake,
          status: 'ready',
          players: [
            {
              id: 'opponent',
              name: opponent,
              avatarInitials: opponent
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2),
              isMe: false,
              joinedAt: Date.now() - 60000,
            },
            {
              id: 'me',
              name: 'You',
              avatarInitials: 'ME',
              isMe: true,
              joinedAt: Date.now(),
            },
          ],
          createdAt: Date.now() - 60000,
          expiresAt: Date.now() + EXPIRY_MS,
        };

        set({ active: contest });
        return contest;
      },

      leave: async () => {
        const { active } = get();
        if (active && active.stake > 0) {
          await useWalletStore
            .getState()
            .credit(active.stake, 'Refund: left contest', 'refund');
        }
        set({ active: null });
      },

      reset: () => set({ active: null }),
    }),
    {
      name: 'super7-contests',
      partialize: (state) => ({ active: state.active }),
    }
  )
);