import { useSession } from '@clerk/react';
import { useMemo } from 'react';
import { createSupabaseClient } from './supabase';

export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    if (!session) return null;
    return createSupabaseClient(() => session.getToken());
  }, [session]);
}