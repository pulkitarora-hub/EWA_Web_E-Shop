import type { HomePageData } from "@/lib/siteContent";

type Props = { outcomes: HomePageData["outcomes"] };

export function OutcomesSection({ outcomes }: Props) {
  return (
    <section className="border-y border-eva-periwinkle/25 bg-eva-cream px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
          What people experience
        </p>
        <h2 className="mt-2 text-center font-display text-3xl text-eva-midnight sm:text-4xl">
          Breakthrough methods — confidential and effective
        </h2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {outcomes.map((o) => (
            <li
              key={o.title}
              className="rounded-2xl border border-eva-periwinkle/30 bg-white p-6 shadow-sm"
            >
              <h3 className="font-display text-lg text-eva-royal">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{o.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
