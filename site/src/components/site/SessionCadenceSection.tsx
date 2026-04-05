type Props = { title: string; body: string };

export function SessionCadenceSection({ title, body }: Props) {
  return (
    <section className="bg-white px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-eva-periwinkle/35 bg-eva-cream/50 p-8 sm:p-10">
        <h2 className="font-display text-2xl text-eva-midnight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">
          {body}
        </p>
      </div>
    </section>
  );
}
