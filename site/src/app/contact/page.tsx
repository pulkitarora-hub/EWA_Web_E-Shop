import type { Metadata } from "next";
import Image from "next/image";
import { getSiteSettings } from "@/lib/getSiteContent";
import { externalLinksFromSettings } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a session or ask a question — WhatsApp or the form below.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const links = externalLinksFromSettings(settings);

  return (
    <div className="bg-eva-cream px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 overflow-hidden rounded-3xl">
          <Image
            src="/images/avadhi-yellow.png"
            alt="Avadhi Sharma"
            width={1200}
            height={400}
            className="h-64 w-full object-cover object-top sm:h-80"
          />
        </div>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="font-display text-4xl text-eva-midnight sm:text-5xl">
              Let’s connect
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Prefer chat? Message us on WhatsApp for appointment requests and
              quick questions.
            </p>
            <a
              href={links.whatsappBook}
              className="mt-8 inline-flex rounded-full bg-eva-teal px-6 py-3 text-sm font-semibold text-eva-midnight shadow-md shadow-eva-teal/25 transition hover:brightness-105"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open WhatsApp
            </a>
            <p className="mt-10 text-sm text-muted">
              For crisis support, please contact local emergency services or a
              crisis line — this form is not monitored as an emergency channel.
            </p>
          </div>

          <div className="rounded-3xl border border-eva-periwinkle/40 bg-white p-8 shadow-eva-soft">
            <h2 className="font-display text-xl text-eva-midnight">Send a message</h2>
            <p className="mt-2 text-sm text-muted">
              Wire this form to Formspark, Resend, your API route, or a CRM when
              you are ready — fields are structured for a typical enquiry flow.
            </p>
            <form className="mt-6 space-y-4" action="#" method="post">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-eva-midnight">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="mt-1 w-full rounded-xl border border-eva-periwinkle/50 bg-eva-cream/50 px-4 py-2.5 text-eva-midnight outline-none ring-eva-royal/30 focus:ring-2"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-eva-midnight">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-xl border border-eva-periwinkle/50 bg-eva-cream/50 px-4 py-2.5 text-eva-midnight outline-none ring-eva-royal/30 focus:ring-2"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-medium text-eva-midnight">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="mt-1 w-full resize-y rounded-xl border border-eva-periwinkle/50 bg-eva-cream/50 px-4 py-2.5 text-eva-midnight outline-none ring-eva-royal/30 focus:ring-2"
                  placeholder="What would you like help with?"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-eva-royal py-3 text-sm font-semibold text-white shadow-md shadow-eva-royal/25 transition hover:brightness-110 sm:w-auto sm:px-8"
              >
                Submit (connect backend)
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
