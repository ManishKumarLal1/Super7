import { create } from 'zustand';

type PowerStep = 'captain' | 'vice-captain' | 'poison' | 'confirm' | 'complete';

type PowersState = {
  contestId: string | null;
  step: PowerStep;
  myCaptain: string | null;
  myViceCaptain: string | null;
  myPoison: string | null;

  opponentCaptain: string | null;
  opponentViceCaptain: string | null;
  opponentPoison: string | null;

  setContestId: (id: string) => void;
  setCaptain: (id: string) => void;
  setViceCaptain: (id: string) => void;
  setPoison: (id: string) => void;
  confirm: () => Promise<void>;
  reset: () => void;
};

let _supabase: any = null;
export function setPowersSupabase(client: any) {
  _supabase = client;
}

export const usePowersStore = create<PowersState>()((set, get) => ({
  contestId: null,
  step: 'captain',
  myCaptain: null,
  myViceCaptain: null,
  myPoison: null,
  opponentCaptain: null,
  opponentViceCaptain: null,
  opponentPoison: null,

  setContestId: (id) => set({ contestId: id }),

  setCaptain: (id) => set({ myCaptain: id, step: 'vice-captain' }),
  setViceCaptain: (id) => set({ myViceCaptain: id, step: 'poison' }),
  setPoison: (id) => set({ myPoison: id, step: 'confirm' }),

  confirm: async () => {
    const { contestId, myCaptain, myViceCaptain, myPoison } = get();
    const me = (window as any).Clerk?.user?.id;

    if (!_supabase || !me || !contestId) {
      console.warn('confirm: missing supabase/me/contestId');
      return;
    }

    // 1. Save my powers to DB
    const { error: saveErr } = await _supabase
      .from('contest_powers')
      .upsert(
        {
          contest_id: contestId,
          user_id: me,
          captain_id: myCaptain,
          vice_captain_id: myViceCaptain,
          poison_target_id: myPoison,
        },
        { onConflict: 'contest_id,user_id' }
      );

    if (saveErr) {
      console.error('save powers failed:', saveErr);
      return;
    }

    // 2. Fetch opponent's powers
    const { data: oppRow } = await _supabase
      .from('contest_powers')
      .select('captain_id, vice_captain_id, poison_target_id')
      .eq('contest_id', contestId)
      .neq('user_id', me)
      .maybeSingle();

    if (oppRow) {
      set({
        opponentCaptain: oppRow.captain_id,
        opponentViceCaptain: oppRow.vice_captain_id,
        opponentPoison: oppRow.poison_target_id,
      });
    }

    set({ step: 'complete' });
  },

  reset: () =>
    set({
      contestId: null,
      step: 'captain',
      myCaptain: null,
      myViceCaptain: null,
      myPoison: null,
      opponentCaptain: null,
      opponentViceCaptain: null,
      opponentPoison: null,
    }),
}));

export const POWER_STEPS: PowerStep[] = [
  'captain',
  'vice-captain',
  'poison',
  'confirm',
];