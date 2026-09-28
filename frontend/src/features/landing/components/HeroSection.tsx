import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SplitText } from '../../../animations/gsap.config';

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!headlineRef.current) return;

    const split = new SplitText(headlineRef.current, { type: 'chars,words' });

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.from('.hero-bg', { scale: 1.2, duration: 2 })
      .from(split.chars, {
        opacity: 0,
        y: 60,
        rotateX: -90,
        stagger: 0.02,
        duration: 0.8,
      }, '-=1.5')
      .from('.hero-cta', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4');
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative h-screen overflow-hidden">
      <div className="hero-bg absolute inset-0 bg-[url('/images/hero-stadium.webp')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <h1
          ref={headlineRef}
          className="max-w-5xl text-[clamp(3rem,10vw,9rem)] font-bold leading-[0.9] text-white"
        >
          Draft. Poison. Win.
        </h1>
        <p className="hero-cta mt-8 max-w-xl text-lg text-white/70">
          Pick 7 players. Outsmart your opponent. Win the pot.
        </p>
        <button className="hero-cta mt-10 rounded-full bg-white px-8 py-4 text-black font-semibold">
          Play Super 7
        </button>
      </div>
    </section>
  );
}