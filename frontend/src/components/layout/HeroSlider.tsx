'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl } from '@/services/api';
import { getHeroSlides } from '@/services/hero-slides';
import type { HeroSlide } from '@/types';

const AUTOPLAY_MS = 6000; // time each slide is fully visible
const FADE_MS = 1200; // crossfade duration (keep in sync with the Tailwind duration class)

type SlideStatus = 'loading' | 'ready' | 'empty';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function HeroSlider({ children }: { children: React.ReactNode }) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [status, setStatus] = useState<SlideStatus>('loading');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load slides once
  useEffect(() => {
    let cancelled = false;
    getHeroSlides()
      .then((data) => {
        if (cancelled) return;
        const active = data.filter((s) => s.isActive);
        setSlides(active);
        setStatus(active.length > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) setStatus('empty');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Warm the browser image cache so crossfades never pop in
  useEffect(() => {
    slides.forEach((slide) => {
      const url = assetUrl(slide.imageUrl);
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [slides]);

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(((nextIndex % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay — a fresh timeout per slide keeps the pacing drift-free
  useEffect(() => {
    if (status !== 'ready' || paused || reduceMotion || slides.length <= 1) return;
    timerRef.current = setTimeout(next, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, paused, reduceMotion, slides.length, index, next]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showControls = status === 'ready' && slides.length > 1;
  const slideUrls = useMemo(() => slides.map((s) => assetUrl(s.imageUrl)), [slides]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collection"
      className="relative flex min-h-[420px] items-center overflow-hidden rounded-3xl bg-gray-900 px-6 py-16 text-white sm:min-h-[500px] sm:px-12 sm:py-24"
    >
      {/* Slides layer */}
      <div
        aria-hidden
        className="hero-slides-layer absolute inset-0"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slideUrls.map((url, i) => (
          <div
            key={url}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDuration: `${FADE_MS}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url ?? ''}
              alt=""
              draggable={false}
              decoding="async"
              className={`h-full w-full select-none object-cover ${
                i === index && !reduceMotion ? 'hero-slide-active' : ''
              }`}
            />
          </div>
        ))}
      </div>

      {/* Readability overlays */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/55 to-gray-950/20"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-gray-950/85 to-transparent"
      />
      {/* Ambient gold glow behind the logo */}
      <div
        aria-hidden
        className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#a87f3f]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#c9a45c]/10 blur-3xl"
      />

      {/* Content (logo, headline, CTAs) */}
      <div className="relative z-10 w-full">{children}</div>

      {/* Prev / Next */}
      {showControls && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-gray-950/40 text-white/80 backdrop-blur transition-colors hover:bg-gray-950/70 hover:text-white sm:flex"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path
                d="M12.5 4.5 7 10l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-gray-950/40 text-white/80 backdrop-blur transition-colors hover:bg-gray-950/70 hover:text-white sm:flex"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path
                d="m7.5 4.5 5.5 5.5-5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === index
                  ? 'w-6 bg-[#c9a45c]'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
