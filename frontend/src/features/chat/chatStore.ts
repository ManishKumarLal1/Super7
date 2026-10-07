import { create } from 'zustand';
import { useEffect } from 'react';
import { useSupabase } from '../../lib/useSupabase';
import { useShallow } from 'zustand/react/shallow';

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
  metadata?: {
    contestCode?: string;
    actionUrl?: string;
  };
};

let _supabase: any = null;

type ChatState = {
  messages: ChatMessage[];
  chatOpen: boolean;
  activeThreadId: string | null;
  loading: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  sendMessage: (
    threadId: string,
    text: string,
    metadata?: ChatMessage['metadata']
  ) => Promise<void>;
  markThreadRead: (threadId: string) => Promise<void>;
  openChat: (threadId?: string) => void;
  closeChat: () => void;
  setActiveThread: (threadId: string | null) => void;
  reset: () => void;
};

export function threadIdFor(userA: string, userB: string): string {
  const [a, b] = [userA, userB].sort();
  return `${a}:${b}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  chatOpen: false,
  activeThreadId: null,
  loading: false,
  loaded: false,

  load: async () => {
    if (!_supabase) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    set({ loading: true });

    const { data, error } = await _supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) {
      console.error('messages load error:', error);
      set({ loading: false, loaded: true });
      return;
    }

    const messages: ChatMessage[] = (data ?? []).map((row: any) => ({
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      senderName: row.sender_id === me ? 'You' : 'Them',
      text: row.text,
      timestamp: new Date(row.created_at).getTime(),
      read: row.read,
      metadata: row.metadata ?? undefined,
    }));

    set({ messages, loading: false, loaded: true });
  },

  sendMessage: async (threadId, text, metadata) => {
  const me = (window as any).Clerk?.user?.id;
  console.log('[chat] sendMessage called', {
    threadId,
    hasSupabase: !!_supabase,
    hasMe: !!me,
    text: text.slice(0, 30),
  });

  if (!_supabase) {
    console.error('[chat] FAILED: no supabase ref');
    return;
  }
  if (!me) {
    console.error('[chat] FAILED: no Clerk user');
    return;
  }

  const { data, error } = await _supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sender_id: me,
      text,
      metadata: metadata ?? null,
      read: false,
    })
    .select();

  if (error) {
    console.error('[chat] insert error:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('[chat] insert success:', data);
  await get().load();
},

  markThreadRead: async (threadId) => {
    if (!_supabase) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    await _supabase
      .from('messages')
      .update({ read: true })
      .eq('thread_id', threadId)
      .neq('sender_id', me)
      .eq('read', false);

    // Update local state immediately
    set((state) => ({
      messages: state.messages.map((m) =>
        m.threadId === threadId ? { ...m, read: true } : m
      ),
    }));
  },

  openChat: (threadId) =>
    set({ chatOpen: true, activeThreadId: threadId ?? null }),

  closeChat: () => set({ chatOpen: false, activeThreadId: null }),

  setActiveThread: (threadId) => set({ activeThreadId: threadId }),

  reset: () =>
    set({
      messages: [],
      chatOpen: false,
      activeThreadId: null,
      loaded: false,
    }),
}));

export function useChat() {
  const supabase = useSupabase();
  const loaded = useChatStore((s) => s.loaded);
  const load = useChatStore((s) => s.load);

  useEffect(() => {
    if (!supabase) return;
    _supabase = supabase;
    if (!loaded) load();
  }, [supabase, loaded, load]);

  return useChatStore(
    useShallow((s) => ({
      messages: s.messages,
      chatOpen: s.chatOpen,
      activeThreadId: s.activeThreadId,
      loaded: s.loaded,
    }))
  );
}