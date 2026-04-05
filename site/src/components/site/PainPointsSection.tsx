type Props = { items: string[]; whatsappUrl: string };

export function PainPointsSection({ items, whatsappUrl }: Props) {
  return (
    <section className="bg-eva-midnight px-4 py-16 text-eva-lilac sm:px-6">
      <div className="mx-auto max-w-3xl">
        <ul className="space-y-4">
          {items.map((text) => (
            <li
              key={text}
              className="border-l-4 border-eva-lavender pl-4 font-display text-lg leading-snug text-white sm:text-xl"
            >
              {text}
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <a
            href={whatsappUrl}
            className="inline-flex rounded-full bg-eva-teal px-6 py-3 text-sm font-semibold text-eva-midnight transition hover:brightness-105"
            target="_blank"
            rel="noopener noreferrer"
          >
            Text us to schedule your appointment
          </a>
        </div>
      </div>
    </section>
  );
}
