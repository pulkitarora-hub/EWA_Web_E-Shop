import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getHomePageData } from "@/lib/getSiteContent";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomePageData();
  return {
    title: "About",
    description: home.aboutDetailed.mission.slice(0, 160),
  };
}

export default async function AboutPage() {
  const home = await getHomePageData();
  const { about, aboutDetailed } = home;

  return (
    <div className="bg-eva-cream">
      <section className="eva-gradient-hero px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-lilac/95">
            About Avadhi
          </p>
          <p className="mt-6 font-display text-xl leading-relaxed text-eva-lavender-white/95 sm:text-2xl">
            {aboutDetailed.mission}
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[340px_1fr] lg:items-start">
          <Image
            src="/images/avadhi-about.png"
            alt="Avadhi Sharma"
            width={400}
            height={500}
            className="w-full rounded-3xl object-cover shadow-eva-soft ring-1 ring-eva-periwinkle/40"
            priority
          />
          <div>
            <h2 className="font-display text-3xl text-eva-midnight sm:text-4xl">
              About Avadhi
            </h2>
            <div className="mt-6 space-y-5 leading-relaxed text-muted">
              {aboutDetailed.bioParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-8 font-display text-xl text-eva-royal">
              So, are you ready to Empower, Thrive, and Transcend?
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex rounded-full bg-eva-royal px-6 py-3 text-sm font-semibold text-white shadow-md shadow-eva-royal/25 transition hover:brightness-110"
            >
              Connect
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-eva-periwinkle/25 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
              Together, in our sessions
            </p>
            <ul className="mt-6 space-y-4 text-muted leading-relaxed">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-eva-teal" />
                We'll unlock the door to profound healing.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-eva-coral" />
                I'll guide you in releasing the blocks that hold you back, allowing you to experience greater happiness, inner peace, and a sense of purpose.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-eva-gold" />
                At its core, we will address the root of psychological challenges, initiating the transformative process of healing.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-eva-lavender" />
                Together, we'll embark on a journey that aligns with your life vision.
              </li>
            </ul>
          </div>
          <Image
            src="/images/avadhi-session.png"
            alt="Avadhi in a therapy session"
            width={600}
            height={450}
            className="rounded-3xl object-cover shadow-eva-soft ring-1 ring-eva-periwinkle/40"
          />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
            Education &amp; credentials
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Registered under Counsellor's Council of India",
              "Registered under Bhartiya Council Psychology Association",
              "Professional member American Psychology Association",
              "Psychological first aid — John Hopkins University",
              "International Sound Therapy Trainer",
              "Master NLP Practitioner",
              "Advanced Practitioner Emotional Freedom Technique",
              "Master's in Counselling Psychology",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-eva-royal" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-eva-periwinkle/25 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
            Certifications
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-10">
            <Image src="/images/cert-bcpa-1.png" alt="BCPA Certified — Member LM/2017133" width={160} height={200} />
            <Image src="/images/cert-cci-1.png" alt="CCI Certified — CRN No CRN4496773" width={160} height={200} />
          </div>
        </div>
      </section>

      <section className="bg-eva-cream px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
            My core values
          </p>
          <p className="mt-3 text-sm text-muted">
            As a counselling psychologist and Nada yogi who believes in kindness for every soul and the divinity of every human being, here are my core values that extend to my brand.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {aboutDetailed.coreValues.map((v, i) => (
              <li
                key={i}
                className="rounded-2xl border border-eva-periwinkle/30 bg-white p-5 text-sm leading-relaxed text-muted shadow-sm"
              >
                {v}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-eva-periwinkle/25 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 lg:items-center">
          <Image
            src="/images/avadhi-meditation.png"
            alt="Avadhi meditating with singing bowl"
            width={600}
            height={450}
            className="rounded-3xl object-cover shadow-eva-soft"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
              My oath
            </p>
            <p className="mt-4 font-display text-xl leading-snug text-eva-midnight sm:text-2xl">
              {aboutDetailed.oath}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-eva-cream px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex rounded-full bg-eva-royal px-6 py-3 text-sm font-semibold text-white shadow-md shadow-eva-royal/25 transition hover:brightness-110"
          >
            Get in touch
          </Link>
          <Link
            href="/services"
            className="inline-flex rounded-full border border-eva-royal/30 px-6 py-3 text-sm font-semibold text-eva-midnight hover:bg-white"
          >
            View services
          </Link>
        </div>
      </section>
    </div>
  );
}
