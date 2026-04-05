"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomePageData } from "@/lib/siteContent";

type Props = {
  tagline: string;
  hero: HomePageData["hero"];
};

export function Hero({ tagline, hero }: Props) {
  const slides = hero.slides;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const current = slides[idx] ?? slides[0];

  return (
    <section className="relative overflow-hidden">
      <div className="eva-gradient-hero absolute inset-0 opacity-100" aria-hidden />
      <div
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full eva-gradient-orb opacity-70 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-eva-teal/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-eva-lilac/95">
            {tagline}
          </p>
          <h1
            key={idx}
            className="mt-4 font-display text-4xl leading-[1.1] text-white transition-opacity duration-700 sm:text-5xl lg:text-6xl"
          >
            {current.headline}
          </h1>
          <p
            key={`sub-${idx}`}
            className="mt-5 max-w-xl text-lg leading-relaxed text-eva-lavender-white/95 transition-opacity duration-700"
          >
            {current.sub}
          </p>

          {slides.length > 1 && (
            <div className="mt-5 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === idx ? "w-6 bg-eva-gold" : "w-2 bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={hero.primaryCta.href}
              className="inline-flex items-center justify-center rounded-full bg-eva-gold px-6 py-3 text-base font-semibold text-eva-midnight shadow-lg shadow-eva-gold/30 transition hover:brightness-105"
            >
              {hero.primaryCta.label}
            </Link>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              target={hero.secondaryCta.external !== false ? "_blank" : undefined}
              rel={
                hero.secondaryCta.external !== false
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="relative max-w-sm">
          <div className="overflow-hidden rounded-3xl shadow-eva-glow ring-1 ring-white/15">
            <Image
              src="/images/avadhi-hero.png"
              alt="Avadhi Sharma"
              width={420}
              height={520}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
          <div className="eva-glass absolute -bottom-4 -left-4 rounded-2xl border border-white/15 px-5 py-4 text-eva-lilac shadow-lg sm:-bottom-6 sm:-left-6">
            <p className="text-sm font-medium text-white">{hero.cardTitle}</p>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-eva-lavender-white/90">
              {hero.cardBody}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
