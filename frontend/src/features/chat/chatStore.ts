import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMessage = {
  id: string;
  threadId: string;         // friend's id
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
  chatOpen: boolean;
  activeThreadId: string | null;

  sendMessage: (
    threadId: string,
    text: string,
    metadata?: ChatMessage['metadata']
  ) => void;
  markThreadRead: (threadId: string) => void;
  openChat: (threadId?: string) => void;
  closeChat: () => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      chatOpen: false,
      activeThreadId: null,

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

      openChat: (threadId) =>
        set({
          chatOpen: true,
          activeThreadId: threadId ?? null,
        }),

      closeChat: () => set({ chatOpen: false, activeThreadId: null }),

      reset: () =>
        set({ messages: [], chatOpen: false, activeThreadId: null }),
    }),
    {
      name: 'super7-chat',
      partialize: (s) => ({ messages: s.messages }),
      // Note: chatOpen and activeThreadId are NOT persisted
      // — they're UI state that should reset on refresh
    }
  )
);