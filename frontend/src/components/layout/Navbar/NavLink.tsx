import { useRef } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  to: string;
  children: React.ReactNode;
};

export function NavLink({ to, children }: Props) {
  const lineRef = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    gsap.to(lineRef.current, { scaleX: 1, duration: 0.4, ease: 'power3.out' });
  };

  const handleLeave = () => {
    gsap.to(lineRef.current, {
      scaleX: 0,
      duration: 0.3,
      ease: 'power3.in',
      transformOrigin: 'right center',
    });
  };

  return (
    <RouterNavLink
      to={to}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={({ isActive }) =>
        `relative text-sm font-medium transition-colors ${
          isActive ? 'text-white' : 'text-white/60 hover:text-white'
        }`
      }
    >
      {children}
      <span
        ref={lineRef}
        className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-emerald-400"
      />
    </RouterNavLink>
  );
}