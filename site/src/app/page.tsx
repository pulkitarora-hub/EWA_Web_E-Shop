import { AboutTeaser } from "@/components/site/AboutTeaser";
import { BlogPreview } from "@/components/site/BlogPreview";
import { Hero } from "@/components/site/Hero";
import { OutcomesSection } from "@/components/site/OutcomesSection";
import { PainPointsSection } from "@/components/site/PainPointsSection";
import { SayYesSection } from "@/components/site/SayYesSection";
import { ServicesGrid } from "@/components/site/ServicesGrid";
import { SessionCadenceSection } from "@/components/site/SessionCadenceSection";
import { Testimonial } from "@/components/site/Testimonial";
import { getBlogPosts, getHomePageData, getSiteSettings } from "@/lib/getSiteContent";

export const revalidate = 60;

export default async function HomePage() {
  const [home, settings, posts] = await Promise.all([
    getHomePageData(),
    getSiteSettings(),
    getBlogPosts(),
  ]);

  return (
    <>
      <Hero tagline={home.tagline} hero={home.hero} />
      <SayYesSection heading={home.sayYesHeading} />
      <PainPointsSection
        items={home.painPoints}
        whatsappUrl={settings.whatsappUrl}
      />
      <AboutTeaser about={home.about} />
      <ServicesGrid
        servicesIntro={home.servicesIntro}
        servicesSub={home.servicesSub}
        services={home.services}
      />
      <SessionCadenceSection
        title={home.sessionCadence.title}
        body={home.sessionCadence.body}
      />
      <OutcomesSection outcomes={home.outcomes} />
      <Testimonial
        quote={home.testimonial.quote}
        name={home.testimonial.name}
      />
      <BlogPreview posts={posts} />
    </>
  );
}
