import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router-dom';
import { gsap, SplitText } from '../../../animations/gsap.config';

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!headingRef.current) return;

    const split = new SplitText(headingRef.current, { type: 'chars,words' });

    gsap.from(split.chars, {
      opacity: 0,
      y: 60,
      rotateX: -90,
      stagger: 0.02,
      duration: 0.8,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
      },
    });

    gsap.from('.cta-button', {
      opacity: 0,
      y: 20,
      duration: 0.6,
      delay: 0.4,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-black px-6 py-40 md:px-12"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.15),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2
          ref={headingRef}
          className="text-6xl font-bold leading-[0.95] text-white md:text-8xl"
        >
          Ready to dominate?
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-lg text-white/60">
          Free to play. No cash prizes. Just glory, coins, and bragging rights.
        </p>
        <Link
          to="/contests"
          className="cta-button mt-12 inline-block rounded-full bg-emerald-400 px-10 py-5 text-lg font-semibold text-black transition-transform hover:scale-105"
        >
          Start Playing
        </Link>
      </div>
    </section>
  );
}