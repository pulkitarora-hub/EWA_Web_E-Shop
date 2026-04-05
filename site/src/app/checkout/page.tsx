"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readCart, clearCart } from "@/lib/cartStorage";
import { createShopOrder, verifyShopOrder } from "@/lib/shopApi";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [rzReady, setRzReady] = useState(false);
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>(
    [],
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCart(readCart());
  }, []);

  async function handlePay() {
    setError(null);
    const items = readCart();
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!rzReady || typeof window === "undefined" || !window.Razorpay) {
      setError("Payment script is still loading. Try again in a moment.");
      return;
    }
    setPaying(true);
    try {
      const order = await createShopOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        customerEmail: email || undefined,
        customerName: name || undefined,
        customerPhone: phone || undefined,
      });

      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Evolve with Avadhi",
        description: "Shop order",
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await verifyShopOrder({
            orderId: order.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          clearCart();
          router.push(
            `/checkout/success?orderId=${encodeURIComponent(order.orderId)}`,
          );
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment could not start.");
      setPaying(false);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-[50vh] bg-eva-cream px-4 py-24 text-center text-muted">
        Loading checkout…
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-eva-cream px-4 py-24 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block font-semibold text-eva-royal underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRzReady(true)}
      />
      <div className="bg-eva-cream px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-lg rounded-3xl border border-eva-periwinkle/40 bg-white p-8 shadow-eva-soft">
          <h1 className="font-display text-3xl text-eva-midnight">Checkout</h1>
          <p className="mt-2 text-sm text-muted">
            Pay securely with Razorpay. Details are optional but help us reach you
            if needed.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="co-name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="co-name"
                className="mt-1 w-full rounded-xl border border-eva-periwinkle/50 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="co-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="co-email"
                type="email"
                className="mt-1 w-full rounded-xl border border-eva-periwinkle/50 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="co-phone" className="text-sm font-medium">
                Phone
              </label>
              <input
                id="co-phone"
                className="mt-1 w-full rounded-xl border border-eva-periwinkle/50 px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
          {error ? (
            <p className="mt-4 text-sm text-eva-coral">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={paying || !rzReady}
            className="mt-8 w-full rounded-full bg-eva-royal py-3 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => void handlePay()}
          >
            {paying ? "Opening…" : rzReady ? "Pay with Razorpay" : "Loading…"}
          </button>
          <Link
            href="/cart"
            className="mt-4 block text-center text-sm text-eva-royal underline"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </>
  );
}
