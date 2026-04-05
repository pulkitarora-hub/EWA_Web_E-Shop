import Image from "next/image";
import type { HomePageData } from "@/lib/siteContent";

type Props = { nada: HomePageData["nada"] };

export function NadaSection({ nada }: Props) {
  return (
    <section className="border-y border-eva-periwinkle/30 bg-gradient-to-br from-eva-lilac/40 via-white to-eva-mint/30 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl shadow-eva-soft">
          <Image
            src="/images/avadhi-spiritual.png"
            alt="Sound healing session"
            width={600}
            height={450}
            className="h-auto w-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
            Nada Wellness Academy
          </p>
          <h2 className="mt-3 font-display text-3xl text-eva-midnight sm:text-4xl">
            {nada.title}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">{nada.subtitle}</p>
          <p className="mt-6 text-sm font-semibold text-eva-midnight">
            Explore the profound power of sound to work on promoting:
          </p>
          <ul className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            {nada.bullets.map((b) => (
              <li
                key={b}
                className="rounded-full border border-eva-periwinkle/40 bg-white/80 px-4 py-2"
              >
                ✔️ {b}
              </li>
            ))}
          </ul>
          <a
            href={nada.ctaUrl}
            className="mt-10 inline-flex rounded-full bg-eva-gold px-8 py-3 text-sm font-semibold text-eva-midnight shadow-md shadow-eva-gold/25 transition hover:brightness-105"
            target="_blank"
            rel="noopener noreferrer"
          >
            {nada.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
