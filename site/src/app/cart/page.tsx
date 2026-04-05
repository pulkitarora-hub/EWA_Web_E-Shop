"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readCart,
  removeLine,
  writeCart,
  type CartLine,
} from "@/lib/cartStorage";
import type { Product } from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CartPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setCart(readCart());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/shop/products`);
        const data = await res.json();
        if (cancelled || !data.products) return;
        const mapped: Product[] = data.products.map(
          (p: {
            id: string;
            slug: string;
            name: string;
            description: string | null;
            priceInr: number;
          }) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            shortDescription: p.description || "",
            priceInr: p.priceInr,
            currency: "INR" as const,
            imageHint: "lavender",
            category: "session" as const,
          }),
        );
        setProducts(mapped);
      } catch {
        const { STATIC_PRODUCTS } = await import("@/lib/products");
        if (!cancelled) setProducts(STATIC_PRODUCTS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = new Map(products.map((p) => [p.id, p]));

  function updateQty(productId: string, quantity: number) {
    const next = readCart()
      .map((l) =>
        l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l,
      )
      .filter((l) => l.quantity > 0);
    writeCart(next);
    setCart(next);
  }

  function remove(productId: string) {
    removeLine(productId);
    setCart(readCart());
  }

  let subtotal = 0;
  for (const line of cart) {
    const p = byId.get(line.productId);
    if (p) subtotal += p.priceInr * line.quantity;
  }

  return (
    <div className="bg-eva-cream px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl text-eva-midnight">Cart</h1>
        {cart.length === 0 ? (
          <p className="mt-6 text-muted">
            Your cart is empty.{" "}
            <Link href="/shop" className="font-semibold text-eva-royal underline">
              Browse the shop
            </Link>
          </p>
        ) : (
          <ul className="mt-8 space-y-6">
            {cart.map((line) => {
              const p = byId.get(line.productId);
              if (!p) {
                return (
                  <li
                    key={line.productId}
                    className="flex items-center justify-between rounded-2xl border border-eva-coral/40 bg-white p-4"
                  >
                    <span className="text-sm text-eva-coral">
                      Unknown product (refresh or remove) — id {line.productId}
                    </span>
                    <button
                      type="button"
                      className="text-sm font-semibold text-eva-royal"
                      onClick={() => remove(line.productId)}
                    >
                      Remove
                    </button>
                  </li>
                );
              }
              const lineTotal = p.priceInr * line.quantity;
              return (
                <li
                  key={line.productId}
                  className="flex flex-col gap-4 rounded-2xl border border-eva-periwinkle/35 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-display text-lg text-eva-midnight">
                      {p.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(p.priceInr)}{" "}
                      each
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={99}
                        className="w-16 rounded-lg border border-eva-periwinkle/50 px-2 py-1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateQty(line.productId, parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </label>
                    <p className="font-display text-lg text-eva-midnight">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(lineTotal)}
                    </p>
                    <button
                      type="button"
                      className="text-sm font-semibold text-eva-coral"
                      onClick={() => remove(line.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {cart.length > 0 ? (
          <div className="mt-10 flex flex-col gap-4 border-t border-eva-periwinkle/30 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-2xl text-eva-midnight">
              Subtotal:{" "}
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(subtotal)}
            </p>
            <Link
              href="/checkout"
              className="inline-flex justify-center rounded-full bg-eva-gold px-8 py-3 text-sm font-semibold text-eva-midnight shadow-md"
            >
              Checkout
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
