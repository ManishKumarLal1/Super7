import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PowerStep = 'captain' | 'vice-captain' | 'poison' | 'confirm' | 'complete';

type PowersState = {
  step: PowerStep;
  myCaptain: string | null;
  myViceCaptain: string | null;
  myPoison: string | null;

  // Opponent (simulated)
  opponentCaptain: string | null;
  opponentViceCaptain: string | null;
  opponentPoison: string | null;

  setCaptain: (id: string) => void;
  setViceCaptain: (id: string) => void;
  setPoison: (id: string) => void;
  confirm: () => void;
  simulateOpponentPowers: (opponentPickIds: string[], myPickIds: string[]) => void;
  reset: () => void;
};

export const usePowersStore = create<PowersState>()(
  persist(
    (set) => ({
      step: 'captain',
      myCaptain: null,
      myViceCaptain: null,
      myPoison: null,
      opponentCaptain: null,
      opponentViceCaptain: null,
      opponentPoison: null,

      setCaptain: (id) => set({ myCaptain: id, step: 'vice-captain' }),

      setViceCaptain: (id) =>
        set({ myViceCaptain: id, step: 'poison' }),

      setPoison: (id) => set({ myPoison: id, step: 'confirm' }),

      confirm: () => set({ step: 'complete' }),

      simulateOpponentPowers: (opponentPicks, myPicks) => {
        if (opponentPicks.length < 7 || myPicks.length < 7) return;

        const oppCaptain = opponentPicks[0];
        const oppVC = opponentPicks[1];
        const oppPoison = myPicks[Math.floor(Math.random() * myPicks.length)];

        set({
          opponentCaptain: oppCaptain,
          opponentViceCaptain: oppVC,
          opponentPoison: oppPoison,
        });
      },

      reset: () =>
        set({
          step: 'captain',
          myCaptain: null,
          myViceCaptain: null,
          myPoison: null,
          opponentCaptain: null,
          opponentViceCaptain: null,
          opponentPoison: null,
        }),
    }),
    {
      name: 'super7-powers',
      partialize: (state) => ({
        step: state.step,
        myCaptain: state.myCaptain,
        myViceCaptain: state.myViceCaptain,
        myPoison: state.myPoison,
        opponentCaptain: state.opponentCaptain,
        opponentViceCaptain: state.opponentViceCaptain,
        opponentPoison: state.opponentPoison,
      }),
    }
  )
);

export const POWER_STEPS: PowerStep[] = [
  'captain',
  'vice-captain',
  'poison',
  'confirm',
];