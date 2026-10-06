import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useNotificationsStore } from '../notificationsStore';

const TYPE_ICONS: Record<string, string> = {
  invite: '🎟️',
  match_ready: '⚔️',
  win: '🏆',
  loss: '😔',
  friend_request: '👤',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { items } = useNotifications();
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const markRead = useNotificationsStore((s) => s.markRead);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;

  const handleClick = async (id: string, actionUrl?: string | null) => {
    await markRead(id);
    setOpen(false);
    if (actionUrl) navigate(actionUrl);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-black">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Notifications
              </div>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/40">
                  No notifications yet
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n.id, n.actionUrl)}
                    className={`flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.02] ${
                      !n.read ? 'bg-emerald-400/[0.03]' : ''
                    }`}
                  >
                    <span className="mt-0.5 text-lg">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="mt-0.5 truncate text-xs text-white/50">
                          {n.body}
                        </div>
                      )}
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/30">
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {!n.read && (
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}