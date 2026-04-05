import Image from "next/image";
import Link from "next/link";
import type { HomePageData } from "@/lib/siteContent";

type Props = { about: HomePageData["about"] };

export function AboutTeaser({ about }: Props) {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
            Who we are
          </p>
          <h2 className="mt-2 font-display text-3xl text-eva-midnight sm:text-4xl">
            {about.lead}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">{about.body}</p>
          <p className="mt-4 text-muted leading-relaxed">{about.avadhi}</p>
          <Link
            href="/about"
            className="mt-6 inline-flex rounded-full bg-eva-royal px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-eva-royal/25 transition hover:brightness-110"
          >
            Read more about Avadhi
          </Link>
        </div>
        <div className="relative">
          <Image
            src="/images/avadhi-portrait.png"
            alt="Avadhi Sharma"
            width={600}
            height={450}
            className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-eva-soft ring-1 ring-eva-periwinkle/50"
          />
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-eva-gold/35 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
