import type { HomePageData } from "@/lib/siteContent";

const accentBorder: Record<
  HomePageData["services"][number]["accent"],
  string
> = {
  teal: "border-l-eva-teal",
  coral: "border-l-eva-coral",
  gold: "border-l-eva-gold",
  lavender: "border-l-eva-lavender",
};

type Props = {
  servicesIntro: string;
  servicesSub: string;
  services: HomePageData["services"];
};

export function ServicesGrid({ servicesIntro, servicesSub, services }: Props) {
  return (
    <section className="bg-eva-cream px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
            Services offered
          </p>
          <h2 className="mt-2 font-display text-3xl text-eva-midnight sm:text-4xl">
            {servicesIntro}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">{servicesSub}</p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <li
              key={s.title}
              className={`rounded-3xl border border-eva-periwinkle/30 border-l-4 bg-white p-8 shadow-eva-soft ${accentBorder[s.accent]} transition hover:-translate-y-0.5 hover:shadow-xl`}
            >
              <h3 className="font-display text-xl text-eva-midnight">
                {s.title}
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
