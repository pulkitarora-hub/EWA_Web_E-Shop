import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/getSiteContent";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles on relationships, emotional intelligence, self-awareness, and mental health.",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function BlogIndexPage() {
  const blogPosts = await getBlogPosts();

  return (
    <div className="bg-eva-cream px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl text-eva-midnight sm:text-5xl">
          Blog
        </h1>
        <p className="mt-4 text-lg text-muted">
          Ideas and frameworks for relationships, work, and inner life.
        </p>
        <ul className="mt-12 space-y-10">
          {blogPosts.map((post) => (
            <li
              key={post.slug}
              className="border-b border-eva-periwinkle/30 pb-10"
            >
              <time
                dateTime={post.publishedAt}
                className="text-sm text-eva-royal"
              >
                {formatDate(post.publishedAt)}
              </time>
              <h2 className="mt-2 font-display text-2xl text-eva-midnight">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-eva-royal hover:underline"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-muted">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-semibold text-eva-royal"
              >
                Read article →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
