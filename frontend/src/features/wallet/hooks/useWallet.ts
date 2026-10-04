import { create } from 'zustand';
import { useEffect } from 'react';
import { useSupabase } from '../../../lib/useSupabase';

export type TxType = 'deposit' | 'escrow' | 'payout' | 'refund' | 'bonus';

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  label: string;
  created_at: string;
};

// Module-level Supabase ref — set once the hook mounts, used by store actions
let _supabase: any = null;
export function setWalletSupabase(client: any) {
  _supabase = client;
}
export function getWalletSupabase() {
  return _supabase;
}

type WalletState = {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  deduct: (amount: number, label: string, type?: TxType) => Promise<boolean>;
  credit: (amount: number, label: string, type?: TxType) => Promise<boolean>;
  reset: () => void;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  transactions: [],
  loading: false,
  loaded: false,

  load: async () => {
    if (!_supabase) return;
    set({ loading: true });

    const { data: wallet } = await _supabase
      .from('wallets')
      .select('balance')
      .maybeSingle();

    const { data: txs } = await _supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    set({
      balance: wallet?.balance ?? 0,
      transactions: txs ?? [],
      loading: false,
      loaded: true,
    });
  },

  deduct: async (amount, label, type = 'escrow') => {
    if (!_supabase) return false;
    const { data, error } = await _supabase.rpc('escrow_coins', {
      p_amount: amount,
      p_label: label,
      p_type: type,
    });
    if (error) {
      console.error('escrow_coins error:', error);
      return false;
    }
    await get().load();
    return true;
  },

  credit: async (amount, label, type = 'payout') => {
    if (!_supabase) return false;
    const { data, error } = await _supabase.rpc('credit_coins', {
      p_amount: amount,
      p_label: label,
      p_type: type,
    });
    if (error) {
      console.error('credit_coins error:', error);
      return false;
    }
    await get().load();
    return true;
  },

  reset: () =>
    set({ balance: 0, transactions: [], loaded: false, loading: false }),
}));

/**
 * Public hook. Reads wallet from Supabase and triggers initial load.
 */
export function useWallet() {
  const supabase = useSupabase();
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);
  const loaded = useWalletStore((s) => s.loaded);
  const load = useWalletStore((s) => s.load);

  useEffect(() => {
    if (!supabase) return;
    setWalletSupabase(supabase);
    // Load once per session
    if (!loaded) load();
  }, [supabase, loaded, load]);

  return { balance, transactions, loaded };
}