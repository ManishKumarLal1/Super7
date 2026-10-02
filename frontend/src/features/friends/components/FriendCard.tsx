import { Link } from 'react-router-dom';
import type { Friend } from '../friendsStore';

type Props = {
  friend: Friend;
  onInvite: () => void;
  onRemove: () => void;
};

export function FriendCard({ friend, onInvite, onRemove }: Props) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
      <Link
        to={`/user/${friend.id}`}
        className="flex flex-1 items-center gap-4 min-w-0"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-purple-500/20 text-sm font-bold text-white ring-1 ring-white/10 transition group-hover:ring-emerald-400/40">
          {friend.avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white transition group-hover:text-emerald-400">
            {friend.name}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            {friend.friendCode}
          </div>
        </div>
      </Link>

      <button
        onClick={onInvite}
        className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black transition hover:scale-105"
      >
        Invite
      </button>

      <button
        onClick={onRemove}
        className="text-white/30 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
        title="Remove friend"
      >
        ×
      </button>
    </div>
  );
}