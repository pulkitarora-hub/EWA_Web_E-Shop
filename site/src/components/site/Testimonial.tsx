type Props = { quote: string; name: string };

export function Testimonial({ quote, name }: Props) {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-eva-lilac/50 via-white to-eva-mint/35 p-10 shadow-eva-soft ring-1 ring-eva-periwinkle/40 sm:p-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-royal">
          Testimonials
        </p>
        <blockquote className="mt-4 font-display text-2xl leading-snug text-eva-midnight sm:text-3xl">
          “{quote}”
        </blockquote>
        <p className="mt-6 text-sm font-semibold text-eva-lavender">— {name}</p>
      </div>
    </section>
  );
}
