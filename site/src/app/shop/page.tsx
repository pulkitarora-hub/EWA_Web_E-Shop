import type { Metadata } from "next";
import Link from "next/link";
import { fetchShopProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Sessions, bundles, and programmes — pay securely at checkout with Razorpay.",
};

const hintBg: Record<string, string> = {
  lavender: "from-eva-lilac to-eva-periwinkle",
  teal: "from-eva-mint to-eva-teal/60",
  gold: "from-eva-peach to-eva-gold/70",
};

function formatPrice(inr: number) {
  if (inr <= 0) return "Enquire";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(inr);
}

export default async function ShopPage() {
  const products = await fetchShopProducts();

  return (
    <div className="bg-eva-cream">
      <section className="border-b border-eva-periwinkle/25 bg-white px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl text-eva-midnight sm:text-5xl">
            Shop
          </h1>
          <p className="mt-4 text-lg text-muted">
            Sessions, bundles, and programmes. Add items to your cart and pay
            with Razorpay at checkout.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id}
            className="flex flex-col overflow-hidden rounded-3xl border border-eva-periwinkle/35 bg-white shadow-eva-soft transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div
              className={`h-36 bg-gradient-to-br ${hintBg[p.imageHint] ?? "from-eva-lilac to-eva-lavender"}`}
            />
            <div className="flex flex-1 flex-col p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-eva-royal">
                {p.category}
              </p>
              <h2 className="mt-2 font-display text-xl text-eva-midnight">
                <Link href={`/shop/${p.slug}`} className="hover:text-eva-royal">
                  {p.name}
                </Link>
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {p.shortDescription}
              </p>
              <p className="mt-4 font-display text-2xl text-eva-midnight">
                {formatPrice(p.priceInr)}
              </p>
              <Link
                href={`/shop/${p.slug}`}
                className="mt-4 inline-flex rounded-full bg-eva-royal px-4 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
              >
                View details
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
