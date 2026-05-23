"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, Play } from "lucide-react";

type Props = {
  images: string[];
  name: string;
  badge?: React.ReactNode;
  fallbackEmoji?: string;
  videoUrl?: string | null;
};

function getVideoEmbed(url: string): { embed: string; isDirect: boolean } {
  if (url.includes("youtube.com/watch") || url.includes("youtu.be")) {
    const id = url.includes("youtu.be")
      ? url.split("youtu.be/")[1]?.split("?")[0]
      : new URLSearchParams(url.split("?")[1] ?? "").get("v");
    return { embed: `https://www.youtube.com/embed/${id}?autoplay=1`, isDirect: false };
  }
  if (url.includes("vimeo.com")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0];
    return { embed: `https://player.vimeo.com/video/${id}?autoplay=1`, isDirect: false };
  }
  return { embed: url, isDirect: true };
}

export default function ProductGallery({ images, name, badge, fallbackEmoji, videoUrl }: Props) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const hasPrev = current > 0;
  const hasNext = current < images.length - 1;

  function prev() { if (hasPrev) setCurrent((i) => i - 1); }
  function next() { if (hasNext) setCurrent((i) => i + 1); }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape") setLightbox(false);
  }

  const video = videoUrl ? getVideoEmbed(videoUrl) : null;
  const hasThumbs = images.length > 1 || (images.length > 0 && video);

  return (
    <>
      <div className="space-y-3">
        {/* Principal: imagen o video */}
        {showVideo && video ? (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            {video.isDirect ? (
              <video src={video.embed} controls autoPlay className="h-full w-full object-contain" />
            ) : (
              <iframe
                src={video.embed}
                className="h-full w-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <div
            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-bio-beige"
            onClick={() => images.length > 0 && setLightbox(true)}
          >
            {images.length > 0 ? (
              <Image
                src={images[current]}
                alt={`${name} ${current + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[8rem]">
                {fallbackEmoji ?? "🌿"}
              </div>
            )}

            {badge}

            {images.length > 0 && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn size={13} /> Zoom
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  disabled={!hasPrev}
                  aria-label="Imagen anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  disabled={!hasNext}
                  aria-label="Imagen siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Miniaturas + botón de video */}
        {hasThumbs && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setCurrent(i); setShowVideo(false); }}
                aria-label={`Ver imagen ${i + 1}`}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  !showVideo && i === current
                    ? "border-bio-green shadow-md scale-105"
                    : "border-transparent opacity-60 hover:opacity-100 hover:border-slate-300"
                }`}
              >
                <Image src={src} alt={`${name} ${i + 1}`} fill className="object-cover" />
              </button>
            ))}

            {video && (
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                aria-label="Ver video"
                className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 bg-black/90 text-white transition-all ${
                  showVideo
                    ? "border-bio-green scale-105 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-slate-300"
                }`}
              >
                <Play size={22} fill="white" />
                <span className="text-[10px] font-medium">Video</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          onClick={() => setLightbox(false)}
          onKeyDown={handleKey}
          tabIndex={0}
          role="dialog"
          aria-modal
          aria-label="Vista ampliada"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
          >
            <X size={22} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                disabled={!hasPrev}
                aria-label="Imagen anterior"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-3 text-slate-600 hover:bg-slate-200 disabled:opacity-20"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                disabled={!hasNext}
                aria-label="Imagen siguiente"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-3 text-slate-600 hover:bg-slate-200 disabled:opacity-20"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[current]}
            alt={`${name} ${current + 1}`}
            className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  aria-label={`Imagen ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "w-6 bg-bio-green" : "w-2 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
