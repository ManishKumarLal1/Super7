import { useState, useRef } from 'react';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  onResult: () => void;
};

export function CoinToss({ onResult }: Props) {
  const [flipping, setFlipping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const coinRef = useRef<HTMLDivElement>(null);

  const handleToss = () => {
    if (flipping || revealed) return;
    setFlipping(true);

    // Get the result first so we can animate to the correct face
    const iWon = Math.random() < 0.5;
    const totalRotation = 5 * 360 + (iWon ? 0 : 180);

    gsap.to(coinRef.current, {
      rotateY: totalRotation,
      duration: 2.5,
      ease: 'power3.out',
      onComplete: () => {
        setFlipping(false);
        setRevealed(true);
        // Call the store update after animation
        setTimeout(onResult, 800);
      },
    });
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <div className="mb-12 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          Coin toss
        </div>
        <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
          Who picks first?
        </h2>
        <p className="mt-3 max-w-md text-white/50">
          Tap the coin to flip. The winner gets the first pick in the draft.
        </p>
      </div>

      <button
        onClick={handleToss}
        disabled={flipping || revealed}
        className="group relative"
        style={{ perspective: 1200 }}
      >
        <div
          ref={coinRef}
          className="relative h-40 w-40 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-[0_0_80px_rgba(251,191,36,0.4)] transition-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-amber-900">
            S
          </div>
        </div>
      </button>

      <div className="mt-12 h-16 text-center">
        {!flipping && !revealed && (
          <button
            onClick={handleToss}
            className="rounded-full bg-emerald-400 px-8 py-3 text-sm font-semibold text-black transition hover:scale-105"
          >
            Flip the coin
          </button>
        )}
        {flipping && (
          <div className="text-sm uppercase tracking-[0.3em] text-white/40">
            Flipping…
          </div>
        )}
        {revealed && (
          <div className="text-sm uppercase tracking-[0.3em] text-emerald-400">
            Heads!
          </div>
        )}
      </div>
    </div>
  );
}