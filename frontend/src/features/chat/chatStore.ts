import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: 'me' | 'system' | string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
  metadata?: {
    contestCode?: string;
    actionUrl?: string;
  };
};

type ChatState = {
  messages: ChatMessage[];
  sendMessage: (
    threadId: string,
    text: string,
    metadata?: ChatMessage['metadata']
  ) => void;
  markThreadRead: (threadId: string) => void;
  unreadCount: (threadId?: string) => number;
  reset: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],

      sendMessage: (threadId, text, metadata) => {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          threadId,
          senderId: 'me',
          senderName: 'You',
          text,
          timestamp: Date.now(),
          read: true,
          metadata,
        };
        set((s) => ({ messages: [...s.messages, msg] }));
      },

      markThreadRead: (threadId) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.threadId === threadId ? { ...m, read: true } : m
          ),
        }));
      },

      unreadCount: (threadId) => {
        const { messages } = get();
        if (threadId) {
          return messages.filter(
            (m) => m.threadId === threadId && !m.read && m.senderId !== 'me'
          ).length;
        }
        return messages.filter((m) => !m.read && m.senderId !== 'me').length;
      },

      reset: () => set({ messages: [] }),
    }),
    {
      name: 'super7-chat',
      partialize: (s) => ({ messages: s.messages }),
    }
  )
);