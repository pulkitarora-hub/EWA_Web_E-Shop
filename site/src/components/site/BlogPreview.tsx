import Link from "next/link";
import type { BlogPostData } from "@/lib/siteContent";

type Props = { posts: BlogPostData[] };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function BlogPreview({ posts }: Props) {
  const preview = posts.slice(0, 3);
  return (
    <section className="bg-eva-midnight px-4 py-20 text-eva-lilac sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eva-periwinkle">
              Our blogs
            </p>
            <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl">
              Breakthrough methods are confidential &amp; effective — our
              specializations
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex w-fit rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/5"
          >
            View all posts
          </Link>
        </div>

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {preview.map((post) => (
            <li
              key={post.slug}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <time
                dateTime={post.publishedAt}
                className="text-xs text-eva-periwinkle/90"
              >
                {formatDate(post.publishedAt)}
              </time>
              <h3 className="mt-3 font-display text-lg text-white">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-eva-lilac/90">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 text-sm font-semibold text-eva-teal hover:underline"
              >
                Read more →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
