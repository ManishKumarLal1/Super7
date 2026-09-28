import { Link } from 'react-router-dom';

const LINKS = [
  { label: 'Contests', to: '/contests' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Friends', to: '/friends' },
  { label: 'Profile', to: '/profile' },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-16 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div>
            <div className="text-2xl font-bold text-white">
              SUPER<span className="text-emerald-400">7</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/50">
              Draft. Poison. Win. A free-to-play cricket fantasy game for fans who
              love strategy.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div>
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-white/40">
                Game
              </div>
              <ul className="space-y-3">
                {LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/70 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-white/40">
                Legal
              </div>
              <ul className="space-y-3 text-sm text-white/70">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Fair Play</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Super 7. Coins are virtual and have no
            cash value.
          </p>
          <p className="text-xs text-white/40">
            Not affiliated with any cricket board or league.
          </p>
        </div>
      </div>
    </footer>
  );
}