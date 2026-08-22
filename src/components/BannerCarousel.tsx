'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Banner } from '@/types/banner';
import styles from './BannerCarousel.module.css';

type Props = {
  banners: Banner[];
  interval?: number;
  className?: string;
};

export default function BannerCarousel({ banners, interval = 6000, className }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!interval || count < 2 || paused) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setTimeout(next, interval);
    return () => clearTimeout(t);
  }, [index, interval, count, paused, next]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  if (count === 0) return null;

  return (
    <section
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-roledescription="carrusel"
      aria-label="Banners destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
    >
      <div className={styles.viewport}>
        <div className={styles.track} style={{ transform: `translate3d(-${index * 100}%,0,0)` }}>
          {banners.map((b, i) => (
            <Slide key={b.id} banner={b} active={i === index} position={i + 1} total={count} />
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={prev} aria-label="Banner anterior">
            <Chevron dir="left" />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={next} aria-label="Banner siguiente">
            <Chevron dir="right" />
          </button>

          <div className={styles.dots} role="tablist" aria-label="Seleccionar banner">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Banner ${i + 1}: ${b.title || b.alt}`}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Slide({ banner: b, active, position, total }: {
  banner: Banner; active: boolean; position: number; total: number;
}) {
  const hasCta = Boolean(b.ctaLabel && b.ctaHref);
  const hasText = Boolean(b.eyebrow || b.title || b.subtitle || hasCta);

  const content = (
    <>
      <Image
        src={b.imageUrl}
        alt={b.alt}
        fill
        priority={position === 1}
        loading={position === 1 ? undefined : 'lazy'}
        sizes="100vw"
        className={`${styles.image} ${b.imageUrlMobile ? styles.imageDesktopOnly : ''}`}
      />
      {b.imageUrlMobile && (
        <Image
          src={b.imageUrlMobile}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className={styles.imageMobile}
        />
      )}
      {b.overlay > 0 && (
        <div className={styles.overlay} style={{ opacity: b.overlay }} aria-hidden />
      )}

      {hasText && (
        <div className={`${styles.content} ${styles[b.align]} ${styles[b.theme]}`}>
          <div className={styles.inner}>
            {b.eyebrow && <p className={styles.eyebrow}>{b.eyebrow}</p>}
            {b.title && <h2 className={styles.title}>{b.title}</h2>}
            {b.subtitle && <p className={styles.subtitle}>{b.subtitle}</p>}
            {hasCta && (
              <Link
                href={b.ctaHref!}
                className={styles.cta}
                target={b.ctaNewTab ? '_blank' : undefined}
                rel={b.ctaNewTab ? 'noopener noreferrer' : undefined}
                tabIndex={active ? 0 : -1}
              >
                {b.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      className={styles.slide}
      role="group"
      aria-roledescription="banner"
      aria-label={`${position} de ${total}`}
      aria-hidden={!active}
      {...(!active ? { inert: '' as unknown as boolean } : {})}
    >
      {b.href && !hasCta ? (
        <Link href={b.href} className={styles.fullLink} tabIndex={active ? 0 : -1} aria-label={b.title || b.alt}>
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
