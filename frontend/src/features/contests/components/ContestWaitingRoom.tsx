import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContestsStore } from '../contestsStore';
import { useChatStore } from '../../chat/chatStore';
import { useFriendsStore } from '../../friends/friendsStore';

export function ContestWaitingRoom() {
  const active = useContestsStore((s) => s.active);
  const leave = useContestsStore((s) => s.leave);
  const friends = useFriendsStore((s) => s.friends);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const navigate = useNavigate();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Simulate opponent joining after 8s if creator and waiting
  useEffect(() => {
    if (!active || active.role !== 'creator' || active.status !== 'waiting') return;

    const t = setTimeout(() => {
      // In real app: WebSocket event
      useContestsStore.setState({
        active: {
          ...active,
          status: 'ready',
          players: [
            ...active.players,
            {
              id: 'opponent',
              name: 'Arjun Mehta',
              avatarInitials: 'AM',
              isMe: false,
              joinedAt: Date.now(),
            },
          ],
        },
      });
    }, 8000);

    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;

  const link = `${window.location.origin}/contests?join=${active.code}`;
  const isReady = active.status === 'ready';

  const copy = (kind: 'code' | 'link') => {
    navigator.clipboard.writeText(kind === 'code' ? active.code : link);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  const shareWithFriend = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    if (!friend) return;

    sendMessage(
      friend.id,
      `I challenged you to a Super 7 contest! ${active.stake === 0 ? 'Free entry' : `${active.stake} coins`} · Code: ${active.code}`,
      {
        contestCode: active.code,
        actionUrl: `/contests?join=${active.code}`,
      }
    );
    setShareOpen(false);
  };

  const handleStart = () => {
    navigate(`/draft/${active.matchId}?stake=${active.stake}&code=${active.code}`);
  };

 const handleLeave = async () => {
  await leave();
  navigate('/contests');
};

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-2xl px-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            {active.role === 'creator' ? 'Contest created' : 'Joined contest'}
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white">
            {isReady ? 'Both players in.' : 'Waiting for an opponent…'}
          </h1>
          <p className="mt-3 text-white/50">
            {isReady
              ? 'Draft begins on your signal.'
              : 'Share the code or link below. The draft starts when they join.'}
          </p>
        </div>

        {/* Code card */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.08] to-transparent p-8">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">
              Contest code
            </div>
            <div className="mt-3 font-mono text-5xl font-bold tracking-[0.3em] text-white">
              {active.code}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => copy('code')}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
              >
                {copied === 'code' ? '✓ Copied' : 'Copy code'}
              </button>
              <button
                onClick={() => copy('link')}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
              >
                {copied === 'link' ? '✓ Copied' : 'Copy link'}
              </button>
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-300"
              >
                Share with friend
              </button>
            </div>

            {shareOpen && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left">
                {friends.length === 0 ? (
                  <div className="p-3 text-center text-xs text-white/40">
                    No friends yet — add some first.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {friends.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => shareWithFriend(f.id)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.04]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-[10px] font-bold text-emerald-300">
                          {f.avatarInitials}
                        </div>
                        <span className="text-sm text-white">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="mt-10">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-white/40">
            Players
          </div>
          <div className="grid grid-cols-2 gap-4">
            {active.players.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-purple-500/20 text-lg font-bold text-white ring-2 ring-emerald-400/30">
                  {p.avatarInitials}
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">
                    {p.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400">
                    {p.isMe ? 'You' : 'Opponent'}
                  </div>
                </div>
              </div>
            ))}
            {!isReady && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6">
                <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-white/5 text-lg font-bold text-white/30">
                  ?
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white/40">
                    Waiting…
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30">
                    Invite link sent?
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleLeave}
            className="flex-1 rounded-2xl border border-white/10 py-4 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            Leave contest
          </button>
          <button
            onClick={handleStart}
            disabled={!isReady}
            className="flex-1 rounded-2xl bg-emerald-400 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isReady ? 'Start draft →' : 'Waiting for opponent…'}
          </button>
        </div>
      </div>
    </div>
  );
}