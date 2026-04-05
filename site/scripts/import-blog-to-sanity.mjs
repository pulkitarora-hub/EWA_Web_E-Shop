/**
 * One-time: seed blog posts into Sanity from the fallback list.
 * Usage (from repo root):
 *   cd site && npm install && SANITY_API_TOKEN=xxx node scripts/import-blog-to-sanity.mjs
 *
 * Requires: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET (default production)
 */
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

const posts = [
  {
    _type: "post",
    _id: "seed-post-sunk-cost",
    title: "Love’s dilemma: navigating the sunk cost fallacy in relationships",
    slug: { _type: "slug", current: "loves-dilemma-navigating-the-sunk-cost-fallacy-in-relationships" },
    publishedAt: "2024-04-10T00:00:00.000Z",
    excerpt:
      "Breakthrough methods are confidential & effective — our specializations in relationship dynamics.",
  },
  {
    _type: "post",
    _id: "seed-post-self-awareness",
    title:
      "Cultivating self-awareness: how regular reflection can help identify strengths, weaknesses, and core values",
    slug: {
      _type: "slug",
      current:
        "cultivating-self-awareness-how-regular-reflection-can-help-identify-strengths-weaknesses-and-core-values",
    },
    publishedAt: "2024-02-16T00:00:00.000Z",
    excerpt:
      "How regular reflection helps you see strengths, gaps, and core values with clarity.",
  },
  {
    _type: "post",
    _id: "seed-post-eq-workplace",
    title: "The art of emotional intelligence in the workplace",
    slug: { _type: "slug", current: "the-art-of-emotional-intelligence-in-workplace" },
    publishedAt: "2023-12-22T00:00:00.000Z",
    excerpt:
      "Practical emotional intelligence ideas for healthier teams and leadership.",
  },
];

async function main() {
  for (const doc of posts) {
    await client.createOrReplace(doc);
    console.log("Upserted", doc.slug.current);
  }
  console.log("Done. Add body content in Sanity Studio.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
