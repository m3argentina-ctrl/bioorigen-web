"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  buttonText: string | null;
  buttonLink: string | null;
  bgColor: string;
};

const FALLBACK: Banner = {
  id: "fallback",
  title: "Alimentos deshidratados naturales",
  subtitle: "Sin conservantes, colorantes ni azúcar agregada.",
  description: null,
  image: "",
  buttonText: null,
  buttonLink: null,
  bgColor: "#4A7C59",
};

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const slides = banners.length > 0 ? banners : [FALLBACK];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % slides.length),
    [slides.length],
  );
  const prev = () =>
    setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [slides.length, next, paused]);

  const hero = slides[current];

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ backgroundColor: hero.bgColor, transition: "background-color 0.6s ease" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div key={current} className="mx-auto grid max-w-6xl gap-8 px-4 py-20 animate-fade-in md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
            Del campo a tu mesa
          </p>
          <h1 className="mt-3 text-balance text-4xl font-extrabold leading-tight md:text-5xl">
            {hero.title}
          </h1>
          {(hero.subtitle ?? hero.description) && (
            <p className="mt-4 max-w-md text-white/85">
              {hero.subtitle ?? hero.description}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            {hero.buttonText && hero.buttonLink ? (
              <Link
                href={hero.buttonLink}
                className="rounded-full bg-white/20 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/30"
              >
                {hero.buttonText}
              </Link>
            ) : (
              <Link
                href="/productos"
                className="rounded-full bg-bio-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
              >
                Ver productos
              </Link>
            )}
            <Link
              href="/recetas"
              className="rounded-full border border-white/50 px-6 py-3 text-sm font-bold transition-colors hover:bg-white/10"
            >
              Recetas
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center">
          {hero.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.image}
              alt={hero.title}
              className="max-h-72 w-full rounded-2xl object-cover"
            />
          ) : (
            <span className="text-[10rem] leading-none">🌿</span>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-colors hover:bg-black/40"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Banner siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-colors hover:bg-black/40"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
