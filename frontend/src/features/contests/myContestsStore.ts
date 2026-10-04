import { create } from 'zustand';
import { useEffect } from 'react';
import { useSupabase } from '../../lib/useSupabase';

export type ContestEntryStatus = 'upcoming' | 'drafting' | 'live' | 'completed';
export type ContestEntryResult = 'won' | 'lost' | 'tied' | null;

export type ContestEntry = {
  id: string;
  contestId: string | null;
  code: string | null;
  matchId: string;
  stake: number;
  status: ContestEntryStatus;
  result: ContestEntryResult;
  myPoints: number | null;
  opponentPoints: number | null;
  createdAt: string;
  updatedAt: string;
};

let _supabase: any = null;

type MyContestsState = {
  entries: ContestEntry[];
  loading: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  createEntry: (input: {
    matchId: string;
    stake: number;
    code?: string;
    contestId?: string;
  }) => Promise<string | null>;
  updateStatus: (entryId: string, status: ContestEntryStatus) => Promise<void>;
  completeEntry: (
    entryId: string,
    result: Exclude<ContestEntryResult, null>,
    myPoints: number,
    opponentPoints: number
  ) => Promise<void>;
  reset: () => void;
};

function rowToEntry(row: any): ContestEntry {
  return {
    id: row.id,
    contestId: row.contest_id,
    code: row.code,
    matchId: row.match_id,
    stake: row.stake,
    status: row.status,
    result: row.result,
    myPoints: row.my_points,
    opponentPoints: row.opponent_points,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const useMyContestsStore = create<MyContestsState>((set, get) => ({
  entries: [],
  loading: false,
  loaded: false,

  load: async () => {
    if (!_supabase) return;
    set({ loading: true });

    const { data, error } = await _supabase
      .from('user_contest_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('myContests load error:', error);
      set({ loading: false, loaded: true });
      return;
    }

    set({
      entries: (data ?? []).map(rowToEntry),
      loading: false,
      loaded: true,
    });
  },

  createEntry: async ({ matchId, stake, code, contestId }) => {
  if (!_supabase) {
    console.error('createEntry: supabase not ready');
    return null;
  }

  const clerkUserId = (window as any).Clerk?.user?.id;
  if (!clerkUserId) {
    console.error('createEntry: no Clerk user');
    return null;
  }

  const { data, error } = await _supabase
    .from('user_contest_entries')
    .insert({
      user_id: clerkUserId,
      match_id: matchId,
      stake,
      code: code ?? null,
      contest_id: contestId ?? null,
      status: 'upcoming',
    })
    .select()
    .single();

  if (error) {
    console.error('createEntry error:', JSON.stringify(error, null, 2));
    return null;
  }

  console.log('createEntry success:', data.id);
  await get().load();
  return data.id;
},

  updateStatus: async (entryId, status) => {
    if (!_supabase) return;
    const { error } = await _supabase
      .from('user_contest_entries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', entryId);

    if (error) {
      console.error('updateStatus error:', error);
      return;
    }
    await get().load();
  },

  completeEntry: async (entryId, result, myPoints, opponentPoints) => {
    if (!_supabase) return;
    const { error } = await _supabase
      .from('user_contest_entries')
      .update({
        status: 'completed',
        result,
        my_points: myPoints,
        opponent_points: opponentPoints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    if (error) {
      console.error('completeEntry error:', error);
      return;
    }
    await get().load();
  },

  reset: () => set({ entries: [], loaded: false }),
}));

export function useMyContests() {
  const supabase = useSupabase();
  const entries = useMyContestsStore((s) => s.entries);
  const loaded = useMyContestsStore((s) => s.loaded);
  const load = useMyContestsStore((s) => s.load);

  useEffect(() => {
    if (!supabase) return;
    _supabase = supabase;
    if (!loaded) load();
  }, [supabase, loaded, load]);

  return { entries, loaded };
}