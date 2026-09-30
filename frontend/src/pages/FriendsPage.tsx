import { useEffect, useState } from 'react';
import { useFriendsStore } from '../features/friends/friendsStore';
import { AddFriendModal } from '../features/friends/components/AddFriendModal';
import { FriendCard } from '../features/friends/components/FriendCard';
import { InviteModal } from '../features/friends/components/InviteModal';
import type { Friend } from '../features/friends/friendsStore';

export function FriendsPage() {
  const myCode = useFriendsStore((s) => s.myCode);
  const friends = useFriendsStore((s) => s.friends);
  const requests = useFriendsStore((s) => s.requests);
  const ensureCode = useFriendsStore((s) => s.ensureCode);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const acceptRequest = useFriendsStore((s) => s.acceptRequest);
  const declineRequest = useFriendsStore((s) => s.declineRequest);
  const removeFriend = useFriendsStore((s) => s.removeFriend);

  const [addOpen, setAddOpen] = useState(false);
  const [inviteFriend, setInviteFriend] = useState<Friend | null>(null);

  useEffect(() => {
    ensureCode();
  }, [ensureCode]);

  const copyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(myCode);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Friends
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Compete with your crew.
          </h1>
          <p className="mt-3 max-w-xl text-white/50">
            Add friends, challenge them 1v1, and settle who really knows cricket.
          </p>
        </div>

        {/* Your code */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.08] to-transparent p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                Your friend code
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-white">
                {myCode || '—'}
              </div>
              <div className="mt-1 text-xs text-white/40">
                Share this so others can add you
              </div>
            </div>
            <button
              onClick={copyCode}
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Copy code
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-full bg-emerald-400 px-5 py-2.5 text-xs font-semibold text-black transition hover:scale-105"
          >
            + Add friend
          </button>
        </div>

        {/* Pending requests */}
        {requests.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
              Pending requests
            </div>
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                    {r.fromName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {r.fromName}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      {r.direction === 'outgoing' ? 'Sending…' : 'Wants to be friends'}
                    </div>
                  </div>
                  {r.direction === 'incoming' && (
                    <>
                      <button
                        onClick={() => acceptRequest(r.id)}
                        className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineRequest(r.id)}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {r.direction === 'outgoing' && (
                    <span className="text-xs text-amber-300">Pending…</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
        {friends.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
            <div className="text-lg font-semibold text-white">No friends yet</div>
            <p className="mt-2 text-sm text-white/50">
              Add a friend to start private contests.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onInvite={() => setInviteFriend(friend)}
                onRemove={() => removeFriend(friend.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddFriendModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={sendRequest}
      />
      <InviteModal friend={inviteFriend} onClose={() => setInviteFriend(null)} />
    </div>
  );
}