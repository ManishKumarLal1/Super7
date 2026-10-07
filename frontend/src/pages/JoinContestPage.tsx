import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useContestsStore, useContestsInit } from '../features/contests/contestsStore';
import { useSupabase } from '../lib/useSupabase';

export function JoinContestPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const joinContest = useContestsStore((s) => s.join);
  const supabase = useSupabase();

  // Ensure the module-level ref in contestsStore is set
  useContestsInit();

  const [status, setStatus] = useState<'joining' | 'failed' | 'done'>('joining');
  const [error, setError] = useState<string>('');

  const attempted = useRef(false);

  useEffect(() => {
    // 🔑 Wait for Supabase to be ready
    if (!supabase) return;

    if (!code) {
      setStatus('failed');
      setError('No contest code provided.');
      return;
    }

    // Only attempt once — after supabase is ready
    if (attempted.current) return;
    attempted.current = true;

    (async () => {
      const contest = await joinContest(code.toUpperCase());
      if (contest) {
        setStatus('done');
        navigate(`/contest/${contest.code}`, { replace: true });
      } else {
        setStatus('failed');
        setError(
          'Could not join — code may be invalid, expired, or you may lack coins.'
        );
      }
    })();
  }, [code, supabase, joinContest, navigate]);

  if (status === 'joining') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/50">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Joining contest
          </div>
          <div className="mt-4 font-mono text-3xl font-bold text-white">
            {code}
          </div>
          <div className="mt-4 text-sm">Connecting…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center">
      <div className="text-lg font-semibold text-rose-400">
        Couldn't join this contest
      </div>
      <p className="max-w-md text-sm text-white/50">{error}</p>
      <div className="mt-4 flex gap-3">
        <Link
          to="/contests"
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Browse contests
        </Link>
        <Link
          to={`/contests?join=${code}`}
          className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/70"
        >
          Try manually
        </Link>
      </div>
    </div>
  );
}