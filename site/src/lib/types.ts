export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  priceInr: number;
  currency: "INR";
  imageHint: string;
  category: "session" | "course" | "digital" | "other";
  featured?: boolean;
};
