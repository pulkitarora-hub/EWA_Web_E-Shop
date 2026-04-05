import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableBody } from "@/components/portable/PortableBody";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/getSiteContent";
import { BLOG_FALLBACK_BODIES } from "@/lib/blogFallbackBodies";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const fallbackParagraphs = BLOG_FALLBACK_BODIES[slug] ?? [post.excerpt];

  return (
    <article className="bg-eva-cream px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="text-sm font-semibold text-eva-royal hover:underline"
        >
          ← Back to blog
        </Link>
        <time
          dateTime={post.publishedAt}
          className="mt-6 block text-sm text-muted"
        >
          {new Intl.DateTimeFormat("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(post.publishedAt))}
        </time>
        <h1 className="mt-3 font-display text-4xl text-eva-midnight sm:text-5xl">
          {post.title}
        </h1>
        <div className="mt-10">
          {post.body?.length ? (
            <PortableBody value={post.body} />
          ) : (
            <div className="space-y-6">
              {fallbackParagraphs.map((para, i) => (
                <p key={i} className="leading-relaxed text-muted">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
