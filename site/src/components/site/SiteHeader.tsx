"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { mainNav } from "@/lib/nav";

const leftNav = mainNav.filter((_, i) => i < Math.ceil(mainNav.length / 2));
const rightNav = mainNav.filter((_, i) => i >= Math.ceil(mainNav.length / 2));

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-[13px] font-medium uppercase tracking-[0.08em] transition ${
        active
          ? "text-white"
          : "text-eva-lilac/80 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-eva-royal text-white">
      {/* Desktop: left nav — center logo — right nav */}
      <div className="mx-auto hidden max-w-7xl items-center px-6 py-3 md:flex">
        <nav className="flex flex-1 items-center justify-end gap-1 pr-6" aria-label="Left navigation">
          {leftNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}
        </nav>

        <Link href="/" className="group -my-2 shrink-0">
          <Image
            src="/images/logo-dark.png"
            alt="Evolve with Avadhi"
            width={80}
            height={80}
            className="rounded-full transition group-hover:brightness-110"
            priority
          />
        </Link>

        <nav className="flex flex-1 items-center gap-1 pl-6" aria-label="Right navigation">
          {rightNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}
          <Link
            href="/contact"
            className="ml-auto rounded-full bg-eva-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider text-eva-midnight shadow-md shadow-eva-gold/25 transition hover:brightness-105"
          >
            Book
          </Link>
        </nav>
      </div>

      {/* Mobile: logo left, hamburger right */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-dark.png"
            alt="Evolve with Avadhi"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="font-display text-base text-eva-lavender-white">
            Evolve with Avadhi
          </span>
        </Link>
        <button
          type="button"
          className="rounded-lg border border-white/15 p-2"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Toggle menu</span>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-eva-royal px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  isActive(item.href)
                    ? "bg-white/10 text-white"
                    : "text-eva-lilac hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-3 rounded-full bg-eva-gold px-4 py-2.5 text-center text-sm font-semibold text-eva-midnight"
              onClick={() => setOpen(false)}
            >
              Book a session
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
