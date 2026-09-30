import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Notification = {
  id: string;
  type: 'invite' | 'match_ready' | 'win' | 'loss' | 'friend_request';
  title: string;
  body: string;
  actionUrl?: string;
  timestamp: number;
  read: boolean;
};

type NotificationsState = {
  items: Notification[];
  push: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  unreadCount: () => number;
  clear: () => void;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: [],

      push: (n) => {
        const notif: Notification = {
          ...n,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false,
        };
        set((s) => ({ items: [notif, ...s.items].slice(0, 50) }));
      },

      markAllRead: () => {
        set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
      },

      markRead: (id) => {
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      unreadCount: () => get().items.filter((n) => !n.read).length,

      clear: () => set({ items: [] }),
    }),
    {
      name: 'super7-notifications',
      partialize: (s) => ({ items: s.items }),
    }
  )
);