import { sanityClient } from "@/sanity/client";
import {
  homePageQuery,
  postBySlugQuery,
  postsQuery,
  siteSettingsQuery,
} from "@/sanity/queries";
import {
  FALLBACK_BLOG_POSTS,
  FALLBACK_HOME,
  FALLBACK_SETTINGS,
  type BlogPostData,
  type HomePageData,
  type ServiceItem,
  type SiteSettingsData,
} from "./siteContent";

type SanityHome = {
  tagline?: string | null;
  heroHeadline?: string | null;
  heroSub?: string | null;
  heroPrimaryCtaLabel?: string | null;
  heroPrimaryCtaPath?: string | null;
  heroSecondaryCtaLabel?: string | null;
  heroSecondaryCtaUrl?: string | null;
  heroCardTitle?: string | null;
  heroCardBody?: string | null;
  sayYesHeading?: string | null;
  nadaSectionTitle?: string | null;
  nadaSectionSubtitle?: string | null;
  nadaBullets?: string[] | null;
  nadaCtaLabel?: string | null;
  nadaCtaUrl?: string | null;
  painPoints?: { text?: string | null }[] | null;
  aboutLead?: string | null;
  aboutBody?: string | null;
  aboutAvadhi?: string | null;
  servicesIntro?: string | null;
  servicesSub?: string | null;
  services?: {
    title?: string | null;
    body?: string | null;
    accent?: string | null;
  }[] | null;
  sessionCadenceTitle?: string | null;
  sessionCadenceBody?: string | null;
  outcomes?: { title?: string | null; body?: string | null }[] | null;
  testimonialQuote?: string | null;
  testimonialName?: string | null;
};

function mapAccent(
  a: string | null | undefined,
): ServiceItem["accent"] {
  if (a === "teal" || a === "coral" || a === "gold" || a === "lavender")
    return a;
  return "lavender";
}

function mergeHome(s: SanityHome | null): HomePageData {
  const f = FALLBACK_HOME;
  if (!s) return f;

  const services: ServiceItem[] =
    s.services?.length ?
      s.services.map((x) => ({
        title: x.title || "",
        body: x.body || "",
        accent: mapAccent(x.accent),
      }))
    : f.services;

  const outcomes =
    s.outcomes?.length ?
      s.outcomes
        .filter((o) => o.title && o.body)
        .map((o) => ({ title: o.title!, body: o.body! }))
    : f.outcomes;

  const painPoints =
    s.painPoints?.length ?
      s.painPoints.map((p) => p.text || "").filter(Boolean)
    : f.painPoints;

  const nadaBullets =
    s.nadaBullets?.length ? s.nadaBullets : f.nada.bullets;

  return {
    tagline: s.tagline || f.tagline,
    hero: {
      slides: s.heroHeadline
        ? [{ headline: s.heroHeadline, sub: s.heroSub || "" }]
        : f.hero.slides,
      primaryCta: {
        label: s.heroPrimaryCtaLabel || f.hero.primaryCta.label,
        href: s.heroPrimaryCtaPath || f.hero.primaryCta.href,
      },
      secondaryCta: {
        label: s.heroSecondaryCtaLabel || f.hero.secondaryCta.label,
        href: s.heroSecondaryCtaUrl || f.hero.secondaryCta.href,
        external: true,
      },
      cardTitle: s.heroCardTitle || f.hero.cardTitle,
      cardBody: s.heroCardBody || f.hero.cardBody,
    },
    sayYesHeading: s.sayYesHeading || f.sayYesHeading,
    nada: {
      title: s.nadaSectionTitle || f.nada.title,
      subtitle: s.nadaSectionSubtitle || f.nada.subtitle,
      bullets: nadaBullets,
      ctaLabel: s.nadaCtaLabel || f.nada.ctaLabel,
      ctaUrl: s.nadaCtaUrl || f.nada.ctaUrl,
    },
    painPoints,
    about: {
      lead: s.aboutLead || f.about.lead,
      body: s.aboutBody || f.about.body,
      avadhi: s.aboutAvadhi || f.about.avadhi,
    },
    servicesIntro: s.servicesIntro || f.servicesIntro,
    servicesSub: s.servicesSub || f.servicesSub,
    services,
    sessionCadence: {
      title: s.sessionCadenceTitle || f.sessionCadence.title,
      body: s.sessionCadenceBody || f.sessionCadence.body,
    },
    outcomes,
    testimonial: {
      quote: s.testimonialQuote || f.testimonial.quote,
      name: s.testimonialName || f.testimonial.name,
    },
    aboutDetailed: f.aboutDetailed,
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  if (!sanityClient) return FALLBACK_HOME;
  try {
    const doc = await sanityClient.fetch<SanityHome | null>(homePageQuery);
    return mergeHome(doc);
  } catch {
    return FALLBACK_HOME;
  }
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  if (!sanityClient) return FALLBACK_SETTINGS;
  try {
    const doc = await sanityClient.fetch<{
      title?: string | null;
      description?: string | null;
      whatsappUrl?: string | null;
      nadaAcademyUrl?: string | null;
    } | null>(siteSettingsQuery);
    if (!doc) return FALLBACK_SETTINGS;
    return {
      title: doc.title || FALLBACK_SETTINGS.title,
      description: doc.description || FALLBACK_SETTINGS.description,
      whatsappUrl: doc.whatsappUrl || FALLBACK_SETTINGS.whatsappUrl,
      nadaAcademyUrl:
        doc.nadaAcademyUrl || FALLBACK_SETTINGS.nadaAcademyUrl,
    };
  } catch {
    return FALLBACK_SETTINGS;
  }
}

export async function getBlogPosts(): Promise<BlogPostData[]> {
  if (!sanityClient) return FALLBACK_BLOG_POSTS;
  try {
    const rows =
      await sanityClient.fetch<
        {
          slug: string;
          title: string;
          publishedAt: string;
          excerpt?: string | null;
          body?: BlogPostData["body"];
        }[]
      >(postsQuery);
    if (!rows?.length) return FALLBACK_BLOG_POSTS;
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt || "",
      publishedAt: r.publishedAt,
      body: r.body,
    }));
  } catch {
    return FALLBACK_BLOG_POSTS;
  }
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPostData | null> {
  if (!sanityClient) {
    return FALLBACK_BLOG_POSTS.find((p) => p.slug === slug) || null;
  }
  try {
    const row = await sanityClient.fetch<
      BlogPostData & { _id?: string } | null
    >(postBySlugQuery, { slug });
    if (row) return row;
    return FALLBACK_BLOG_POSTS.find((p) => p.slug === slug) || null;
  } catch {
    return FALLBACK_BLOG_POSTS.find((p) => p.slug === slug) || null;
  }
}
