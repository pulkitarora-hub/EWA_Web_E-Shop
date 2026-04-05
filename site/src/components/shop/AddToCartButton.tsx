"use client";

import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cartStorage";

type Props = {
  productId: string;
  label?: string;
};

export function AddToCartButton({ productId, label = "Add to cart" }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex rounded-full bg-eva-royal px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
      onClick={() => {
        addToCart(productId, 1);
        router.push("/cart");
      }}
    >
      {label}
    </button>
  );
}
