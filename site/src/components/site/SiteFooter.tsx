import Image from "next/image";
import Link from "next/link";
import { mainNav } from "@/lib/nav";
import type { SiteSettingsData } from "@/lib/siteContent";
import { externalLinksFromSettings } from "@/lib/siteContent";

type Props = { settings: SiteSettingsData };

export function SiteFooter({ settings }: Props) {
  const links = externalLinksFromSettings(settings);
  return (
    <footer className="bg-eva-royal text-eva-lilac">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-dark.png"
                alt="Evolve with Avadhi"
                width={44}
                height={44}
                className="rounded-full"
              />
              <p className="font-display text-2xl text-white">Evolve with Avadhi</p>
            </div>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-eva-periwinkle/90">
              {settings.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={links.whatsappBook}
                className="inline-flex rounded-full bg-eva-teal px-4 py-2 text-sm font-semibold text-eva-midnight transition hover:brightness-105"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                href={links.nadaAcademy}
                className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5"
                target="_blank"
                rel="noopener noreferrer"
              >
                Nada Wellness Academy
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-eva-mint/90">
                Explore
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="hover:text-white hover:underline hover:underline-offset-4"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-eva-mint/90">
                Note
              </p>
              <p className="mt-3 text-sm leading-relaxed text-eva-periwinkle/85">
                Crisis support: if you are in immediate danger, contact local
                emergency services or a crisis helpline in your region.
              </p>
            </div>
          </div>
        </div>
        <div className="eva-divider mt-12" />
        <p className="mt-8 text-center text-xs text-eva-periwinkle/60">
          © {new Date().getFullYear()} Evolve with Avadhi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
