import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resolveUser } from '../features/profile/userProfileStore';
import { useFriendsStore } from '../features/friends/friendsStore';
import { useMatchesStore } from '../features/wallet/matchesStore';
import { useChatStore } from '../features/chat/chatStore';

const TIER_STYLES = {
  Rookie: { color: 'text-white/60', bg: 'bg-white/5', icon: '🏏' },
  Contender: { color: 'text-sky-400', bg: 'bg-sky-400/10', icon: '⚡' },
  Pro: { color: 'text-purple-400', bg: 'bg-purple-400/10', icon: '🔥' },
  Legend: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: '👑' },
};

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const user = useMemo(() => (id ? resolveUser(id) : null), [id]);

  const friends = useFriendsStore((s) => s.friends);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const [requestSent, setRequestSent] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black">
        <div className="text-white/50">User not found.</div>
        <Link
          to="/leaderboard"
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Back to leaderboard
        </Link>
      </div>
    );
  }

  const tier = TIER_STYLES[user.tier];

  const handleAddFriend = () => {
    sendRequest(user.name);
    setRequestSent(true);
  };

  const handleRemoveFriend = () => {
    removeFriend(user.id);
    navigate(-1);
  };

  const openChat = useChatStore((s) => s.openChat);

const handleMessage = () => {
  if (!user.isFriend) return;
  openChat(user.id);
};

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-sm text-white/50 transition hover:text-white"
        >
          ← Back
        </button>

        {/* Header card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.06] via-transparent to-transparent p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-purple-500/20 text-3xl font-bold text-white ring-4 ring-white/10">
              {user.avatarInitials}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-white md:text-4xl">
                  {user.name}
                </h1>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${tier.bg} ${tier.color}`}
                >
                  <span>{tier.icon}</span>
                  {user.tier}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/50">
                {user.matchesPlayed} matches · {user.wins}W {user.losses}L {user.ties}T
              </p>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/40">
                Coins won
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">
                {user.coinsWon.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Win rate" value={`${user.winRate}%`} accent={user.winRate >= 50 ? 'text-emerald-400' : 'text-white'} />
          <Stat label="Net coins" value={`${user.netCoins >= 0 ? '+' : ''}${user.netCoins}`} accent={user.netCoins >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          <Stat label="Best score" value={user.bestScore.toFixed(1)} />
          <Stat label="Matches" value={user.matchesPlayed} />
        </div>

        {/* Actions */}
        {!user.isMe && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {user.isFriend ? (
              <>
                <button
                  onClick={handleMessage}
                  className="flex-1 rounded-2xl bg-emerald-400 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Send message
                </button>
                <button
                  onClick={handleRemoveFriend}
                  className="rounded-2xl border border-white/10 px-6 py-4 text-sm font-semibold text-rose-400 transition hover:bg-rose-400/10"
                >
                  Remove friend
                </button>
              </>
            ) : requestSent ? (
              <div className="flex-1 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] py-4 text-center text-sm font-semibold text-amber-300">
                Request sent — waiting for them to accept
              </div>
            ) : (
              <button
                onClick={handleAddFriend}
                className="flex-1 rounded-2xl bg-emerald-400 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                + Add friend
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = 'text-white',
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}