import { useRef, useState } from 'react';
import {
  Link,
  NavLink as RouterNavLink,
  useLocation,
} from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Show, UserButton, useUser } from '@clerk/react';
import { gsap, ScrollTrigger } from '../../../animations/gsap.config';
import { NavLink } from './NavLink';
import { CoinBalance } from '../../shared/CoinIcon/CoinBalance';
import { NotificationBell } from '../../../features/notifications/components/NotificationBell';
import { ChatPanel } from '../../../features/chat/components/ChatPanel';
import { useChatStore } from '../../../features/chat/chatStore';

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [chatOpen, setChatOpen] = useState(false);
  const unreadMessages = useChatStore(
    (s) => s.messages.filter((m) => !m.read && m.senderId !== 'me').length
  );

  useGSAP(() => {
    if (!navRef.current) return;

    const showAnim = gsap
      .from(navRef.current, {
        yPercent: -100,
        paused: true,
        duration: 0.3,
        ease: 'power2.out',
      })
      .progress(1);

    ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        self.direction === -1 ? showAnim.play() : showAnim.reverse();
        setScrolled(self.scroll() > 100);
      },
    });
  }, { scope: navRef });

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          scrolled || !isLanding
            ? 'border-b border-white/10 bg-black/70 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-white"
          >
            SUPER<span className="text-emerald-400">7</span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/contests">Contests</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <NavLink to="/friends">Friends</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <button
                onClick={() => setChatOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                aria-label="Messages"
              >
                <span className="text-lg">💬</span>
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-black">
                    {unreadMessages}
                  </span>
                )}
              </button>

              <NotificationBell />

              <CoinBalance />

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10 ring-2 ring-white/20',
                  },
                }}
              />
            </Show>

            <Show when="signed-out">
              <Link
                to="/sign-in"
                className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Sign In
              </Link>
            </Show>
          </div>
        </div>
      </nav>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}