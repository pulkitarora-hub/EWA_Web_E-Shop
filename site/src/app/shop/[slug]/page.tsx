import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { fetchShopProductBySlug, fetchShopProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/getSiteContent";
import { externalLinksFromSettings } from "@/lib/siteContent";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await fetchShopProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await fetchShopProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.shortDescription,
  };
}

function formatPrice(inr: number) {
  if (inr <= 0) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(inr);
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await fetchShopProductBySlug(slug);
  if (!p) notFound();

  const settings = await getSiteSettings();
  const links = externalLinksFromSettings(settings);
  const price = formatPrice(p.priceInr);

  return (
    <div className="bg-eva-cream px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/shop"
          className="text-sm font-semibold text-eva-royal hover:underline"
        >
          ← Back to shop
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-eva-royal">
          {p.category}
        </p>
        <h1 className="mt-2 font-display text-4xl text-eva-midnight sm:text-5xl">
          {p.name}
        </h1>
        {price ? (
          <p className="mt-4 font-display text-3xl text-eva-midnight">{price}</p>
        ) : (
          <p className="mt-4 text-lg font-medium text-eva-royal">
            Custom pricing — let’s find the right fit.
          </p>
        )}
        <p className="mt-8 whitespace-pre-line leading-relaxed text-muted">
          {p.shortDescription}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <AddToCartButton productId={p.id} />
          <a
            href={links.whatsappBook}
            className="inline-flex rounded-full bg-eva-teal px-6 py-3 text-sm font-semibold text-eva-midnight transition hover:brightness-105"
            target="_blank"
            rel="noopener noreferrer"
          >
            Enquire on WhatsApp
          </a>
          <Link
            href="/contact"
            className="inline-flex rounded-full border border-eva-royal/35 px-6 py-3 text-sm font-semibold text-eva-midnight hover:bg-white"
          >
            Contact form
          </Link>
        </div>
      </div>
    </div>
  );
}
