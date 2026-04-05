import type { Product } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Offline fallback when the API is unreachable at build time. */
export const STATIC_PRODUCTS: Product[] = [
  {
    id: "static-intro-session",
    slug: "intro-session",
    name: "Intro consultation (60 min)",
    shortDescription:
      "A full session to understand your goals and map a path forward — individuals or couples.",
    priceInr: 2500,
    currency: "INR",
    imageHint: "lavender",
    category: "session",
    featured: true,
  },
  {
    id: "static-therapy-package",
    slug: "therapy-package",
    name: "Therapy bundle (8 sessions)",
    shortDescription:
      "Structured support for sustained change — best for medium-term goals.",
    priceInr: 20000,
    currency: "INR",
    imageHint: "teal",
    category: "session",
    featured: true,
  },
  {
    id: "static-sound-healing-intro",
    slug: "sound-healing-intro",
    name: "Sound healing circle — intro",
    shortDescription:
      "Experience Nada Yoga–inspired sound work in a guided group setting.",
    priceInr: 1500,
    currency: "INR",
    imageHint: "gold",
    category: "course",
  },
];

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceInr: number;
};

function mapApiProduct(p: ApiProduct): Product {
  const cat =
    p.slug.includes("sound") || p.slug.includes("healing") ? "course" : "session";
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.description || "",
    priceInr: p.priceInr,
    currency: "INR",
    imageHint: p.slug.includes("sound") ? "gold" : "lavender",
    category: cat,
    featured: p.slug === "intro-session" || p.slug === "therapy-package",
  };
}

export async function fetchShopProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/shop/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("bad_status");
    const data = (await res.json()) as { products: ApiProduct[] };
    if (!data.products?.length) return STATIC_PRODUCTS;
    return data.products.map(mapApiProduct);
  } catch {
    return STATIC_PRODUCTS;
  }
}

export async function fetchShopProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const products = await fetchShopProducts();
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(products: Product[]): Product[] {
  return products.filter((p) => p.featured);
}
