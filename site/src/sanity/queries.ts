export const homePageQuery = `*[_type == "homePage"][0]{
    _id,
    tagline,
    heroHeadline,
    heroSub,
    heroPrimaryCtaLabel,
    heroPrimaryCtaPath,
    heroSecondaryCtaLabel,
    heroSecondaryCtaUrl,
    heroCardTitle,
    heroCardBody,
    sayYesHeading,
    nadaSectionTitle,
    nadaSectionSubtitle,
    nadaBullets,
    nadaCtaLabel,
    nadaCtaUrl,
    painPoints[]{ text },
    aboutLead,
    aboutBody,
    aboutAvadhi,
    servicesIntro,
    servicesSub,
    services[]{ title, body, accent },
    sessionCadenceTitle,
    sessionCadenceBody,
    outcomes[]{ title, body },
    testimonialQuote,
    testimonialName
  }`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
    title,
    description,
    whatsappUrl,
    nadaAcademyUrl
  }`;

export const postsQuery = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    body
  }`;

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    body
  }`;
