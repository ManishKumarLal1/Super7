import { useRef, useState } from 'react';
import { Link, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Show, UserButton, useUser } from '@clerk/react';
import { gsap, ScrollTrigger } from '../../../animations/gsap.config';
import { NavLink } from './NavLink';
import { CoinBalance } from '../../shared/CoinIcon/CoinBalance';

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useGSAP(() => {
    if (!navRef.current) return;

    // Hide on scroll down, show on scroll up
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
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled || !isLanding
          ? 'bg-black/70 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-2xl font-bold tracking-tight text-white">
          SUPER<span className="text-emerald-400">7</span>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/contests">Contests</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/friends">Friends</NavLink>
        </div>

        <div className="flex items-center gap-4">
          <Show when="signed-in">
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
  );
}