import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getHomePageData } from "@/lib/getSiteContent";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Services",
    description:
      "Individual therapy, couples counselling, adulting & growth, and spiritual offerings — online and in person.",
  };
}

export default async function ServicesPage() {
  const home = await getHomePageData();
  const { services, servicesSub, sessionCadence } = home;

  return (
    <div className="bg-eva-cream">
      <section className="eva-gradient-hero relative overflow-hidden px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="font-display text-4xl sm:text-5xl">Services</h1>
            <p className="mt-4 text-lg leading-relaxed text-eva-lavender-white/95">
              {servicesSub}
            </p>
          </div>
          <Image
            src="/images/avadhi-namaste.png"
            alt="Avadhi Sharma"
            width={300}
            height={375}
            className="hidden w-56 rounded-3xl object-cover shadow-eva-glow ring-1 ring-white/15 lg:block"
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <ol className="space-y-12">
          {services.map((s, i) => (
            <li key={s.title} className="flex gap-6">
              <span
                className="font-display text-3xl text-eva-royal/40"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-2xl text-eva-midnight">
                  {s.title}
                </h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 rounded-3xl border border-eva-periwinkle/40 bg-white p-8 shadow-eva-soft">
          <h2 className="font-display text-xl text-eva-midnight">
            {sessionCadence.title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-muted leading-relaxed">
            {sessionCadence.body}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full bg-eva-teal px-5 py-2.5 text-sm font-semibold text-eva-midnight transition hover:brightness-105"
          >
            Schedule a session
          </Link>
        </div>
      </section>
    </div>
  );
}
