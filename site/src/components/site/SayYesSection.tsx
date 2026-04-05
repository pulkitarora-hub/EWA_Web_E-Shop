type Props = { heading: string };

export function SayYesSection({ heading }: Props) {
  return (
    <section className="bg-eva-cream px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="font-display text-3xl text-eva-midnight sm:text-4xl">
          {heading}
        </h2>
        <p className="eva-divider mx-auto mt-8 max-w-md" />
      </div>
    </section>
  );
}
