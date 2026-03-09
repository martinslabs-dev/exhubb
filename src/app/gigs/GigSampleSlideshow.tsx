"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url);
}

interface Props {
  samples: string[];
  title: string;
  /** Tailwind classes applied to the container, e.g. "h-28" or "h-72 sm:h-96 rounded-2xl" */
  className?: string;
}

export default function GigSampleSlideshow({
  samples,
  title,
  className = "h-28",
}: Props) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer() {
    if (samples.length <= 1) return;
    timerRef.current = setInterval(
      () => setIdx((i) => (i + 1) % samples.length),
      3500,
    );
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    startTimer();
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples.length]);

  /* ── Empty state ────────────────────────────────────────── */
  if (samples.length === 0) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0`}
      >
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-indigo-200" />
        </div>
      </div>
    );
  }

  const url = samples[idx];

  return (
    <div
      className={`relative ${className} overflow-hidden bg-gray-900 group/slide flex-shrink-0`}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      {isVideo(url) ? (
        <video
          key={url}
          src={url}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="w-full h-full object-cover" />
      )}

      {/* Navigation */}
      {samples.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              stopTimer();
              setIdx((i) => (i - 1 + samples.length) % samples.length);
            }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              stopTimer();
              setIdx((i) => (i + 1) % samples.length);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {samples.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  stopTimer();
                  setIdx(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === idx ? "bg-white scale-125" : "bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Counter badge */}
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-bold">
            {idx + 1}/{samples.length}
          </span>
        </>
      )}
    </div>
  );
}
