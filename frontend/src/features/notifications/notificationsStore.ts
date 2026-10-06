import { create } from 'zustand';
import { useEffect } from 'react';
import { useSupabase } from '../../lib/useSupabase';
import { useShallow } from 'zustand/react/shallow';

export type NotificationType =
  | 'invite'
  | 'match_ready'
  | 'win'
  | 'loss'
  | 'friend_request';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  actionUrl: string | null;
  timestamp: number;
  read: boolean;
};

let _supabase: any = null;

type NotificationsState = {
  items: AppNotification[];
  loading: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  pushToUser: (input: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    actionUrl?: string;
  }) => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  reset: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,

  load: async () => {
    if (!_supabase) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    set({ loading: true });

    const { data, error } = await _supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('notifications load error:', error);
      set({ loading: false, loaded: true });
      return;
    }

    set({
      items: (data ?? []).map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        actionUrl: row.action_url,
        timestamp: new Date(row.created_at).getTime(),
        read: row.read,
      })),
      loading: false,
      loaded: true,
    });
  },

  pushToUser: async ({ userId, type, title, body, actionUrl }) => {
    if (!_supabase) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    const { error } = await _supabase.from('notifications').insert({
      user_id: userId,
      sender_id: me,
      type,
      title,
      body: body ?? null,
      action_url: actionUrl ?? null,
    });

    if (error) {
      console.error('pushToUser error:', error);
      return;
    }
  },

  markAllRead: async () => {
    if (!_supabase) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    await _supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', me)
      .eq('read', false);

    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
  },

  markRead: async (id) => {
    if (!_supabase) return;
    await _supabase.from('notifications').update({ read: true }).eq('id', id);
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  reset: () => set({ items: [], loaded: false }),
}));

export function useNotifications() {
  const supabase = useSupabase();
  const loaded = useNotificationsStore((s) => s.loaded);
  const load = useNotificationsStore((s) => s.load);

  useEffect(() => {
    if (!supabase) return;
    _supabase = supabase;
    if (!loaded) load();

    // Refresh notifications every 30s so incoming ones appear
    const t = setInterval(() => load(), 30000);
    return () => clearInterval(t);
  }, [supabase, loaded, load]);

  return useNotificationsStore(
    useShallow((s) => ({
      items: s.items,
      loaded: s.loaded,
    }))
  );
}