import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Friend = {
  id: string;
  name: string;
  avatarInitials: string;
  friendCode: string;
  addedAt: number;
};

export type FriendRequest = {
  id: string;
  fromName: string;
  fromCode: string;
  direction: 'incoming' | 'outgoing';
  createdAt: number;
};

type FriendsState = {
  myCode: string;
  friends: Friend[];
  requests: FriendRequest[];
  ensureCode: () => void;
  sendRequest: (nameOrCode: string) => void;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  removeFriend: (id: string) => void;
  reset: () => void;
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SUPER7-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const SAMPLE_FRIENDS: Friend[] = [
  {
    id: 'sample-1',
    name: 'Rahul Verma',
    avatarInitials: 'RV',
    friendCode: 'SUPER7-RV42',
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'sample-2',
    name: 'Priya Sharma',
    avatarInitials: 'PS',
    friendCode: 'SUPER7-PS19',
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
];

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      myCode: '',
      friends: SAMPLE_FRIENDS,
      requests: [],

      ensureCode: () => {
        if (get().myCode) return;
        set({ myCode: generateCode() });
      },

      sendRequest: (nameOrCode) => {
        const trimmed = nameOrCode.trim();
        if (!trimmed) return;

        const { friends, requests } = get();

        // If it looks like a code and matches a friend, do nothing
        if (friends.some((f) => f.friendCode === trimmed)) return;
        if (requests.some((r) => r.fromCode === trimmed)) return;

        // Simulate: create an outgoing request
        const request: FriendRequest = {
          id: crypto.randomUUID(),
          fromName: trimmed.startsWith('SUPER7-') ? 'Player ' + trimmed.slice(-4) : trimmed,
          fromCode: trimmed.startsWith('SUPER7-') ? trimmed : `SUPER7-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          direction: 'outgoing',
          createdAt: Date.now(),
        };

        set({ requests: [request, ...requests] });

        // Simulate auto-accept after 3 seconds
        setTimeout(() => {
          const req = get().requests.find((r) => r.id === request.id);
          if (!req) return;
          get().acceptRequest(request.id);
        }, 3000);
      },

      acceptRequest: (id) => {
        const { requests, friends } = get();
        const req = requests.find((r) => r.id === id);
        if (!req) return;

        const newFriend: Friend = {
          id: crypto.randomUUID(),
          name: req.fromName,
          avatarInitials: initials(req.fromName),
          friendCode: req.fromCode,
          addedAt: Date.now(),
        };

        set({
          friends: [newFriend, ...friends],
          requests: requests.filter((r) => r.id !== id),
        });
      },

      declineRequest: (id) => {
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        }));
      },

      removeFriend: (id) => {
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== id),
        }));
      },

      reset: () => set({ friends: [], requests: [], myCode: '' }),
    }),
    {
      name: 'super7-friends',
      partialize: (state) => ({
        myCode: state.myCode,
        friends: state.friends,
        requests: state.requests,
      }),
    }
  )
);