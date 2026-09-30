import type { Friend } from '../friendsStore';

type Props = {
  friend: Friend;
  onInvite: () => void;
  onRemove: () => void;
};

export function FriendCard({ friend, onInvite, onRemove }: Props) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-purple-500/20 text-sm font-bold text-white ring-1 ring-white/10">
        {friend.avatarInitials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-white">
          {friend.name}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          {friend.friendCode}
        </div>
      </div>

      <button
        onClick={onInvite}
        className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black transition hover:scale-105"
      >
        Invite
      </button>

      <button
        onClick={onRemove}
        className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-rose-400"
        title="Remove friend"
      >
        ×
      </button>
    </div>
  );
}