import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from '../../../animations/gsap.config';
import { MOCK_MATCHES } from '../../contests/mockMatches';
import { useWallet } from '../../wallet/hooks/useWallet';
import { useContestsStore } from '../../contests/contestsStore';
import type { Friend } from '../friendsStore';
import { useChatStore, threadIdFor } from '../../chat/chatStore';
import { useNotificationsStore } from '../../notifications/notificationsStore';

type Props = {
  friend: Friend | null;
  onClose: () => void;
};

const STAKES = [200, 400, 1000];

export function InviteModal({ friend, onClose }: Props) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [stake, setStake] = useState<number | null>(null);
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { balance } = useWallet();
  const createContest = useContestsStore((s) => s.create);

  useEffect(() => {
    if (!friend || !panelRef.current || !overlayRef.current) return;
    gsap.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.2 }
    );
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 20, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'power3.out',
        clearProps: 'all',
      }
    );
  }, [friend]);

  if (!friend) return null;

  const canInvite = matchId !== null && stake !== null && balance >= stake;

  const handleInvite = async () => {
  if (!canInvite || !matchId || !stake) return;

  const me = (window as any).Clerk?.user?.id;
  if (!me) return;

  // 1. Create the contest (deducts stake, generates code)
  const contest = await createContest(matchId, stake);
  if (!contest) {
    alert('Could not create contest — check console for details.');
    return;
  }

  // 2. Send chat message to the correct thread
  const sendMessage = useChatStore.getState().sendMessage;
  const tId = threadIdFor(me, friend.id);

  sendMessage(
    tId,
    `I challenged you to Super 7! ${
      stake === 0 ? 'Free entry' : `${stake} coins`
    } · Code: ${contest.code}`,
    {
      contestCode: contest.code,
      actionUrl: `/join/${contest.code}`,
    }
  );

  // 3. Push a notification to the friend
  const pushToUser = useNotificationsStore.getState().pushToUser;
  await pushToUser({
    userId: friend.id,
    type: 'invite',
    title: 'Contest invite',
    body: `Join with code ${contest.code} — ${
      stake === 0 ? 'Free' : `${stake} coins`
    }`,
    actionUrl: `/join/${contest.code}`,
  });

  // 4. Route to the waiting room
  onClose();
  navigate(`/contest/${contest.code}`);
};

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-black p-8"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-purple-500/20 text-base font-bold text-white ring-1 ring-white/10">
            {friend.avatarInitials}
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40">
              Challenge
            </div>
            <div className="text-xl font-bold text-white">{friend.name}</div>
          </div>
        </div>

        {/* Match picker */}
        <div className="mt-8">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
            Match
          </div>
          <div className="space-y-2">
            {MOCK_MATCHES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMatchId(m.id)}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                  matchId === m.id
                    ? 'border-emerald-400/60 bg-emerald-400/[0.06]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    {m.teamA} vs {m.teamB}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                    {m.format} · {m.venue}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    m.status === 'live' ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {m.status === 'live' ? '● LIVE' : 'Upcoming'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stake picker */}
        <div className="mt-8">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
            Stake
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STAKES.map((s) => (
              <button
                key={s}
                onClick={() => setStake(s)}
                disabled={balance < s}
                className={`rounded-2xl border py-4 text-center transition ${
                  stake === s
                    ? 'border-emerald-400/60 bg-emerald-400/[0.06]'
                    : balance < s
                    ? 'cursor-not-allowed border-white/5 bg-white/[0.01] opacity-40'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="text-lg font-bold text-white">{s}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">
                  coins
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-4 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!canInvite}
            className="flex-1 rounded-2xl bg-emerald-400 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {balance < (stake ?? 0) ? 'Not enough coins' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
}