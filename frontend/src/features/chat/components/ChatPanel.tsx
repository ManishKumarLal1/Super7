import { useState } from 'react';
import { useChatStore } from '../chatStore';
import { useFriendsStore } from '../../friends/friendsStore';
import { Link } from 'react-router-dom';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ChatPanel({ open, onClose }: Props) {
  const friends = useFriendsStore((s) => s.friends);
  const messages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markThreadRead = useChatStore((s) => s.markThreadRead);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  if (!open) return null;

  const threads = friends.map((f) => ({
    friend: f,
    lastMessage: [...messages]
      .reverse()
      .find((m) => m.threadId === f.id),
    unread: messages.filter(
      (m) => m.threadId === f.id && !m.read && m.senderId !== 'me'
    ).length,
  }));

  const activeFriend = friends.find((f) => f.id === activeThreadId) ?? null;
  const threadMessages = activeThreadId
    ? messages
        .filter((m) => m.threadId === activeThreadId)
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const handleOpenThread = (id: string) => {
    setActiveThreadId(id);
    markThreadRead(id);
  };

  const handleSend = () => {
    if (!draft.trim() || !activeThreadId) return;
    sendMessage(activeThreadId, draft.trim());
    setDraft('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            {activeFriend && (
  <button
    onClick={() => setActiveThreadId(null)}
    className="text-white/50 hover:text-white"
  >
    ←
  </button>
)}
{activeFriend ? (
  <Link
    to={`/user/${activeFriend.id}`}
    onClick={onClose}
    className="text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:text-emerald-400"
  >
    {activeFriend.name}
  </Link>
) : (
  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
    Messages
  </div>
)}
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-white/40 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Thread list */}
        {!activeFriend && (
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && (
              <div className="p-10 text-center text-sm text-white/40">
                Add friends to start chatting.
              </div>
            )}
            {threads.map(({ friend, lastMessage, unread }) => (
              <button
                key={friend.id}
                onClick={() => handleOpenThread(friend.id)}
                className="flex w-full items-center gap-4 border-b border-white/5 px-6 py-4 text-left transition hover:bg-white/[0.02]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-purple-500/20 text-sm font-bold text-white ring-1 ring-white/10">
                  {friend.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">
                    {friend.name}
                  </div>
                  <div className="truncate text-xs text-white/40">
                    {lastMessage ? lastMessage.text : 'No messages yet'}
                  </div>
                </div>
                {unread > 0 && (
                  <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-bold text-black">
                    {unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Active thread */}
        {activeFriend && (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {threadMessages.length === 0 && (
                <div className="py-10 text-center text-xs text-white/40">
                  Start the conversation.
                </div>
              )}
              {threadMessages.map((m) => {
                const mine = m.senderId === 'me';
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        mine
                          ? 'bg-emerald-400 text-black'
                          : 'bg-white/[0.06] text-white'
                      }`}
                    >
                      <div className="text-sm leading-relaxed">{m.text}</div>
                      {m.metadata?.contestCode && (
                        <a
                          href={m.metadata.actionUrl ?? '#'}
                          className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            mine
                              ? 'bg-black/20 text-black'
                              : 'bg-emerald-400 text-black'
                          }`}
                        >
                          🎟️ Join contest
                        </a>
                      )}
                      <div
                        className={`mt-1 text-[10px] ${
                          mine ? 'text-black/50' : 'text-white/40'
                        }`}
                      >
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 border-t border-white/10 p-4">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}