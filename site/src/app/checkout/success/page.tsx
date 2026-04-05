import Link from "next/link";

type Props = { searchParams: Promise<{ orderId?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  return (
    <div className="bg-eva-cream px-4 py-24 text-center">
      <h1 className="font-display text-3xl text-eva-midnight">
        Thank you — payment received
      </h1>
      {orderId ? (
        <p className="mt-4 text-sm text-muted">
          Order reference:{" "}
          <span className="font-mono text-eva-midnight">{orderId}</span>
        </p>
      ) : null}
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-full bg-eva-teal px-6 py-3 text-sm font-semibold text-eva-midnight"
      >
        Back to shop
      </Link>
    </div>
  );
}
