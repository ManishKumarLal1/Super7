import { create } from 'zustand';
import { useEffect } from 'react';
import { useSupabase } from '../../lib/useSupabase';
import { useShallow } from 'zustand/react/shallow';

export type Friend = {
  id: string;              // Clerk user ID
  name: string;
  avatarInitials: string;
  friendCode: string;
  avatarUrl?: string | null;
  addedAt: string;
};

export type FriendRequest = {
  id: string;
  fromId: string;
  fromName: string;
  fromCode: string;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
};

let _supabase: any = null;

type FriendsState = {
  myCode: string | null;
  friends: Friend[];
  requests: FriendRequest[];
  loading: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  sendRequest: (nameOrCode: string) => Promise<boolean>;
  acceptRequest: (id: string) => Promise<void>;
  declineRequest: (id: string) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
  reset: () => void;
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  myCode: null,
  friends: [],
  requests: [],
  loading: false,
  loaded: false,

  load: async () => {
    if (!_supabase) return;
    set({ loading: true });

    const me = (window as any).Clerk?.user?.id;
if (!me) {
  set({ loading: false, loaded: true });
  return;
}
    if (!me) {
      set({ loading: false, loaded: true });
      return;
    }

    // 1. Get my own profile (for friend_code)
    const { data: meRow } = await _supabase
      .from('users')
      .select('friend_code')
      .eq('id', me)
      .maybeSingle();

    // 2. Get friendships (both directions)
    const { data: frRows, error: frErr } = await _supabase
      .from('friendships')
      .select('user_id, friend_id, created_at')
      .or(`user_id.eq.${me},friend_id.eq.${me}`);

    if (frErr) console.error('friendships load error:', frErr);

    // 3. Collect friend IDs
    const friendIds = (frRows ?? []).map((r: any) =>
      r.user_id === me ? r.friend_id : r.user_id
    );

    // 4. Fetch their user profiles
    let friends: Friend[] = [];
    if (friendIds.length > 0) {
      const { data: userRows } = await _supabase
        .from('users')
        .select('id, display_name, avatar_url, friend_code')
        .in('id', friendIds);

      const userMap = new Map((userRows ?? []).map((u: any) => [u.id, u]));

      friends = (frRows ?? []).map((r: any) => {
        const otherId = r.user_id === me ? r.friend_id : r.user_id;
        const u: any = userMap.get(otherId) ?? {};
        const name = u.display_name ?? 'Player';
        return {
          id: otherId,
          name,
          avatarInitials: initials(name),
          friendCode: u.friend_code ?? '',
          avatarUrl: u.avatar_url ?? null,
          addedAt: r.created_at,
        };
      });
    }

    // 5. Get friend requests
    const { data: reqRows } = await _supabase
      .from('friend_requests')
      .select('id, from_id, to_id, status, created_at')
      .eq('status', 'pending')
      .or(`from_id.eq.${me},to_id.eq.${me}`);

    // 6. Fetch request senders' profiles
    const requestUserIds = (reqRows ?? [])
      .filter((r: any) => r.to_id === me)
      .map((r: any) => r.from_id);

    let requestUsers: any[] = [];
    if (requestUserIds.length > 0) {
      const { data } = await _supabase
        .from('users')
        .select('id, display_name, friend_code')
        .in('id', requestUserIds);
      requestUsers = data ?? [];
    }

    const reqUserMap = new Map(requestUsers.map((u: any) => [u.id, u]));

    const requests: FriendRequest[] = (reqRows ?? [])
      .filter((r: any) => r.to_id === me) // incoming only
      .map((r: any) => {
        const u: any = reqUserMap.get(r.from_id) ?? {};
        const name = u.display_name ?? 'Player';
        return {
          id: r.id,
          fromId: r.from_id,
          fromName: name,
          fromCode: u.friend_code ?? '',
          direction: 'incoming' as const,
          createdAt: r.created_at,
        };
      });

    set({
      myCode: meRow?.friend_code ?? null,
      friends,
      requests,
      loading: false,
      loaded: true,
    });
  },

  sendRequest: async (nameOrCode) => {
    if (!_supabase) return false;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return false;

    const trimmed = nameOrCode.trim();
    if (!trimmed) return false;

    // Find target user by friend_code OR display_name
    let targetId: string | null = null;

    if (trimmed.startsWith('SUPER7-')) {
      const { data } = await _supabase
        .from('users')
        .select('id')
        .eq('friend_code', trimmed)
        .maybeSingle();
      targetId = data?.id ?? null;
    } else {
      const { data } = await _supabase
        .from('users')
        .select('id')
        .ilike('display_name', `%${trimmed}%`)
        .limit(1);
      targetId = data?.[0]?.id ?? null;
    }

    if (!targetId || targetId === me) {
      console.warn('sendRequest: no valid target found');
      return false;
    }

    const { error } = await _supabase.from('friend_requests').insert({
      from_id: me,
      to_id: targetId,
      status: 'pending',
    });

    if (error) {
      console.error('sendRequest error:', error);
      return false;
    }

    await get().load();
    return true;
  },

  acceptRequest: async (id) => {
    if (!_supabase) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    const request = get().requests.find((r) => r.id === id);
    if (!request) return;

    // 1. Update request status
    await _supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', id);

    // 2. Create friendship — respecting the check(user_id < friend_id)
    const [a, b] = [me, request.fromId].sort();

    const { error } = await _supabase.from('friendships').insert({
      user_id: a,
      friend_id: b,
    });

    if (error) {
      console.error('acceptRequest error:', error);
      return;
    }

    await get().load();
  },

  declineRequest: async (id) => {
    if (!_supabase) return;

    await _supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', id);

    await get().load();
  },

  removeFriend: async (id) => {
    if (!_supabase) return;
    const me = (window as any).Clerk?.user?.id;
    if (!me) return;

    const [a, b] = [me, id].sort();

    await _supabase
      .from('friendships')
      .delete()
      .eq('user_id', a)
      .eq('friend_id', b);

    await get().load();
  },

  reset: () =>
    set({ myCode: null, friends: [], requests: [], loaded: false }),
}));

export function useFriends() {
  const supabase = useSupabase();
  const loaded = useFriendsStore((s) => s.loaded);
  const load = useFriendsStore((s) => s.load);

  useEffect(() => {
    if (!supabase) return;
    _supabase = supabase;
    if (!loaded) load();
  }, [supabase, loaded, load]);

  return useFriendsStore(
    useShallow((s) => ({
      myCode: s.myCode,
      friends: s.friends,
      requests: s.requests,
      loaded: s.loaded,
    }))
  );
}