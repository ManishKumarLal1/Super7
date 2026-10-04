import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWalletStore } from '../wallet/hooks/useWallet';
import { useSupabase } from '../../lib/useSupabase';
import { useEffect } from 'react';

export type ContestStatus = 'waiting' | 'ready' | 'drafting' | 'live' | 'completed' | 'cancelled';
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
  stake: number;
  status: ContestStatus;
  players: ContestPlayer[];
  createdAt: number;
  expiresAt: number;
};

export function useContestsInit() {
  const supabase = useSupabase();

  useEffect(() => {
    if (supabase) _supabase = supabase;
  }, [supabase]);
}

let _supabase: any = null;

type ContestsState = {
  active: Contest | null;
  loading: boolean;

  create: (matchId: string, stake: number) => Promise<Contest | null>;
  join: (code: string) => Promise<Contest | null>;
  refresh: () => Promise<void>;
  leave: () => Promise<void>;
  reset: () => void;
};

const EXPIRY_MINUTES = 30;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
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

export const useContestsStore = create<ContestsState>()(
  persist(
    (set, get) => ({
      active: null,
      loading: false,

      create: async (matchId, stake) => {
        if (!_supabase) return null;
        const me = (window as any).Clerk?.user?.id;
        if (!me) return null;

        // Deduct stake if not free
        if (stake > 0) {
          const ok = await useWalletStore
            .getState()
            .deduct(stake, `Create contest: ${matchId}`, 'escrow');
          if (!ok) return null;
        }

        // Generate a unique code (retry if collision — rare)
        let code = generateCode();
        for (let i = 0; i < 3; i++) {
          const { data } = await _supabase
            .from('contests')
            .select('id')
            .eq('code', code)
            .maybeSingle();
          if (!data) break;
          code = generateCode();
        }

        // Insert contest
        const { data: contestRow, error: contestErr } = await _supabase
          .from('contests')
          .insert({
            code,
            creator_id: me,
            match_id: matchId,
            stake,
            status: 'waiting',
            expires_at: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (contestErr || !contestRow) {
          console.error('create contest error:', contestErr);
          return null;
        }

        // Insert creator into contest_players
        const { error: playerErr } = await _supabase
          .from('contest_players')
          .insert({
            contest_id: contestRow.id,
            user_id: me,
            role: 'creator',
          });

        if (playerErr) {
          console.error('create player error:', playerErr);
          return null;
        }

        // Fetch my display name
        const { data: meRow } = await _supabase
          .from('users')
          .select('display_name')
          .eq('id', me)
          .maybeSingle();

        const contest: Contest = {
          id: contestRow.id,
          code: contestRow.code,
          role: 'creator',
          matchId: contestRow.match_id,
          stake: contestRow.stake,
          status: 'waiting',
          players: [
            {
              id: me,
              name: meRow?.display_name ?? 'You',
              avatarInitials: initials(meRow?.display_name ?? 'ME'),
              isMe: true,
              joinedAt: Date.now(),
            },
          ],
          createdAt: new Date(contestRow.created_at).getTime(),
          expiresAt: new Date(contestRow.expires_at).getTime(),
        };

        set({ active: contest });
        return contest;
      },

      join: async (code) => {
        console.log('[join] entered, code =', code);
  if (!_supabase){
        console.error('[join] FAILED: no supabase');
   return null;
  }
  const me = (window as any).Clerk?.user?.id;
  if (!me) {
    console.error('[join] FAILED: no Clerk user');
    return null;
  }

  const upper = code.trim().toUpperCase();
  console.log('[join] lookup code:', JSON.stringify(upper), 'as user:', me);

  // 1. Look up contest by code
  const { data: contestRow, error: lookupErr } = await _supabase
    .from('contests')
    .select('*')
    .eq('code', upper)
    .maybeSingle();
    console.log('[join] lookup result:', { contestRow, lookupErr });

  if (lookupErr || !contestRow) {
    console.error('join: contest not found', lookupErr);
    return null;
  }
  console.log('[join] found contest, id =', contestRow.id, 'status =', contestRow.status, 'stake =', contestRow.stake);

  if (contestRow.status === 'cancelled' || contestRow.status === 'completed') {
    console.error('join: contest not joinable', contestRow.status);
    return null;
  }

  // 2. Check if I'm already a player
  const { data: existingPlayer } = await _supabase
    .from('contest_players')
    .select('*')
    .eq('contest_id', contestRow.id)
    .eq('user_id', me)
    .maybeSingle();
    console.log('[join] existing player?', existingPlayer, 'err:');

  if (!existingPlayer) {
    // 3. Deduct stake
    if (contestRow.stake > 0) {
      console.log('[join] deducting stake:', contestRow.stake);
      const ok = await useWalletStore
        .getState()
        .deduct(contestRow.stake, `Join contest: ${upper}`, 'escrow');
        console.log('[join] deduct result:', ok);
      if (!ok) {
        console.error('join: wallet deduct failed');
        return null;
      }
    }
    console.log('[join] inserting player row...');

    // 4. Insert me as joiner
    const { error: joinErr } = await _supabase
      .from('contest_players')
      .insert({
        contest_id: contestRow.id,
        user_id: me,
        role: 'joiner',
      });

    if (joinErr) {
      console.error('[join] FAILED: insert error', JSON.stringify(joinErr, null, 2));
      return null;
    }
    console.log('[join] player inserted');

    // 5. Flip contest status to ready
    await _supabase
      .from('contests')
      .update({ status: 'ready' })
      .eq('id', contestRow.id);
  }

  // 6. Build the full contest object directly — no refresh() call
  const { data: playerRows } = await _supabase
    .from('contest_players')
    .select('user_id, role, joined_at')
    .eq('contest_id', contestRow.id);

  const playerIds = (playerRows ?? []).map((p: any) => p.user_id);
  let profiles: any[] = [];
  if (playerIds.length > 0) {
    const { data } = await _supabase
      .from('users')
      .select('id, display_name')
      .in('id', playerIds);
    profiles = data ?? [];
  }
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  const players: ContestPlayer[] = (playerRows ?? []).map((p: any) => {
    const profile = profileMap.get(p.user_id);
    const name = profile?.display_name ?? 'Player';
    return {
      id: p.user_id,
      name,
      avatarInitials: initials(name),
      isMe: p.user_id === me,
      joinedAt: new Date(p.joined_at).getTime(),
    };
  });

  const myRole: ContestRole = contestRow.creator_id === me ? 'creator' : 'joiner';

  const contest: Contest = {
    id: contestRow.id,
    code: contestRow.code,
    role: myRole,
    matchId: contestRow.match_id,
    stake: contestRow.stake,
    status: contestRow.status,
    players,
    createdAt: new Date(contestRow.created_at).getTime(),
    expiresAt: new Date(contestRow.expires_at).getTime(),
  };

  set({ active: contest });
  return contest;
},

      refresh: async () => {
        if (!_supabase) return;
        const me = (window as any).Clerk?.user?.id;
        const currentActive = get().active;
        if (!me || !currentActive) return;

        // Fetch latest contest state
        const { data: contestRow } = await _supabase
          .from('contests')
          .select('*')
          .eq('id', currentActive.id)
          .maybeSingle();

        if (!contestRow) return;

        // Fetch players
        const { data: playerRows } = await _supabase
          .from('contest_players')
          .select('user_id, role, joined_at')
          .eq('contest_id', currentActive.id);

        // Fetch profiles for all players
        const playerIds = (playerRows ?? []).map((p: any) => p.user_id);
        let profiles: any[] = [];
        if (playerIds.length > 0) {
          const { data } = await _supabase
            .from('users')
            .select('id, display_name')
            .in('id', playerIds);
          profiles = data ?? [];
        }
        const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

        const players: ContestPlayer[] = (playerRows ?? []).map((p: any) => {
          const profile = profileMap.get(p.user_id);
          const name = profile?.display_name ?? 'Player';
          return {
            id: p.user_id,
            name,
            avatarInitials: initials(name),
            isMe: p.user_id === me,
            joinedAt: new Date(p.joined_at).getTime(),
          };
        });

        // Determine my role
        const myRole: ContestRole =
          contestRow.creator_id === me ? 'creator' : 'joiner';

        set({
          active: {
            id: contestRow.id,
            code: contestRow.code,
            role: myRole,
            matchId: contestRow.match_id,
            stake: contestRow.stake,
            status: contestRow.status,
            players,
            createdAt: new Date(contestRow.created_at).getTime(),
            expiresAt: new Date(contestRow.expires_at).getTime(),
          },
        });
      },

      leave: async () => {
        const { active } = get();
        if (!active) return;

        if (!_supabase) return;
        const me = (window as any).Clerk?.user?.id;

        // If I'm the creator and it's still waiting, refund + cancel
        // If I'm the joiner, just remove my player row
        if (active.role === 'creator' && active.status === 'waiting') {
          if (active.stake > 0 && me) {
            await useWalletStore
              .getState()
              .credit(active.stake, 'Refund: cancelled contest', 'refund');
          }
          await _supabase
            .from('contests')
            .update({ status: 'cancelled' })
            .eq('id', active.id);
        } else if (me) {
          // Refund stake
          if (active.stake > 0) {
            await useWalletStore
              .getState()
              .credit(active.stake, 'Refund: left contest', 'refund');
          }
          await _supabase
            .from('contest_players')
            .delete()
            .eq('contest_id', active.id)
            .eq('user_id', me);
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

export function useActiveContest() {
  const supabase = useSupabase();
  const active = useContestsStore((s) => s.active);
  const refresh = useContestsStore((s) => s.refresh);

  useEffect(() => {
    if (!supabase) return;
    _supabase = supabase;
  }, [supabase]);

  // Poll every 2 seconds while in a waiting or ready contest
  useEffect(() => {
    if (!active) return;
    if (active.status !== 'waiting' && active.status !== 'ready') return;

    const t = setInterval(() => {
      refresh();
    }, 2000);

    return () => clearInterval(t);
  }, [active?.id, active?.status, refresh]);

  return active;
}