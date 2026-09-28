import { create } from 'zustand';

type Transaction = {
  id: string;
  type: 'escrow' | 'refund' | 'payout' | 'deposit';
  amount: number;
  label: string;
  timestamp: number;
};

type WalletState = {
  balance: number;
  transactions: Transaction[];
  addCoins: (amount: number, label?: string) => void;
  deductCoins: (amount: number, label?: string) => boolean;
  resetWallet: () => void;
};

const INITIAL_BALANCE = 1000;

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: INITIAL_BALANCE,
  transactions: [
    {
      id: 'welcome-bonus',
      type: 'deposit',
      amount: 1000,
      label: 'Welcome bonus',
      timestamp: Date.now(),
    },
  ],

  addCoins: (amount, label = 'Coins added') => {
    set((state) => ({
      balance: state.balance + amount,
      transactions: [
        {
          id: crypto.randomUUID(),
          type: 'deposit',
          amount,
          label,
          timestamp: Date.now(),
        },
        ...state.transactions,
      ],
    }));
  },

  deductCoins: (amount, label = 'Coins spent') => {
    const { balance } = get();
    if (balance < amount) return false;

    set((state) => ({
      balance: state.balance - amount,
      transactions: [
        {
          id: crypto.randomUUID(),
          type: 'escrow',
          amount: -amount,
          label,
          timestamp: Date.now(),
        },
        ...state.transactions,
      ],
    }));
    return true;
  },

  resetWallet: () =>
    set({
      balance: INITIAL_BALANCE,
      transactions: [],
    }),
}));

// Public hook — components use this, not the store directly
export function useWallet() {
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);
  const addCoins = useWalletStore((s) => s.addCoins);
  const deductCoins = useWalletStore((s) => s.deductCoins);

  return { balance, transactions, addCoins, deductCoins };
}