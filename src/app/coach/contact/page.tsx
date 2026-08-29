import type { Metadata } from "next";
import { ContactForm } from "@/components/coach/contact-form";
import { SITE } from "@/lib/coach/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start with a free thirty-minute intro call, or email directly. Replies within two working days.",
};

const EXPECTATIONS = [
  { label: "Reply time", value: "Within two working days, always by a person" },
  { label: "The intro call", value: "30 minutes, free, no pitch and no follow-up sequence" },
  { label: "If I'm not right for it", value: "I'll say so and point you somewhere better" },
];

/**
 * Deliberately the quietest page on the site — see the note in ContactForm.
 * No pinning, no parallax, no scroll-linked anything. The reader has already
 * decided; the only job left is not getting in their way.
 */
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="grid gap-16 md:grid-cols-12 md:gap-20">
        <header className="md:col-span-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">Contact</p>
          <h1 className="coach-display mt-6 text-[clamp(2.5rem,5.5vw,4.25rem)]">
            Tell me what&apos;s going on.
          </h1>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
            You don&apos;t need it worded well. Half a paragraph of the real
            thing is more useful to me than a tidy summary.
          </p>

          <dl className="mt-12 space-y-6 border-t border-[var(--rule)] pt-8">
            {EXPECTATIONS.map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]/70">
                  {item.label}
                </dt>
                <dd className="mt-1 text-[15px]">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 space-y-2 text-sm text-[var(--ink-soft)]">
            <p>
              <a
                href={`mailto:${SITE.email}`}
                className="border-b border-[var(--rule)] pb-0.5 transition-colors hover:border-[var(--clay)] hover:text-[var(--clay)]"
              >
                {SITE.email}
              </a>
            </p>
            <p>
              <a
                href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`}
                className="border-b border-[var(--rule)] pb-0.5 transition-colors hover:border-[var(--clay)] hover:text-[var(--clay)]"
              >
                {SITE.phone}
              </a>
            </p>
            <p className="pt-2 text-[var(--ink-soft)]/70">{SITE.location}</p>
          </div>
        </header>

        <div className="md:col-span-7">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
