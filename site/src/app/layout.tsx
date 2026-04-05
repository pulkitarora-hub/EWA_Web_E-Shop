import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteSettings } from "@/lib/getSiteContent";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: settings.title,
      template: "%s · Evolve with Avadhi",
    },
    description: settings.description,
    metadataBase: new URL("https://www.evolvewithavadhi.com"),
    openGraph: {
      title: "Evolve with Avadhi",
      description: settings.description,
      url: "https://www.evolvewithavadhi.com",
      siteName: "Evolve with Avadhi",
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${fraunces.variable} min-h-screen font-sans antialiased`}
      >
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
