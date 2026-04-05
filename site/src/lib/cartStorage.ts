export type CartLine = { productId: string; quantity: number };

const KEY = "ewa_shop_cart_v1";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) => x && typeof x.productId === "string" && x.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lines));
}

export function addToCart(productId: string, qty = 1): void {
  const cart = readCart();
  const existing = cart.find((l) => l.productId === productId);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + qty);
  } else {
    cart.push({ productId, quantity: Math.min(99, qty) });
  }
  writeCart(cart);
}

export function removeLine(productId: string): void {
  writeCart(readCart().filter((l) => l.productId !== productId));
}

export function clearCart(): void {
  writeCart([]);
}
