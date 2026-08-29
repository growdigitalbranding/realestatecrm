import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/coach/faq-list";
import { FAQ_SECTIONS, SITE } from "@/lib/coach/content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Straight answers on cost, cadence, cancellation, confidentiality, and when coaching is the wrong call.",
};

/**
 * FAQPage structured data, built from the same content the page renders — so
 * the two can't drift. This is the page most likely to be surfaced as a direct
 * answer in search, which is worth the extra few lines.
 */
function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };
}

export default function FaqPage() {
  return (
    <div className="py-24 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />

      <header className="mx-auto mb-20 max-w-6xl px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">FAQ</p>
        <h1 className="coach-display mt-6 max-w-3xl text-[clamp(2.5rem,6.5vw,5rem)]">
          The questions people actually ask.
        </h1>
        <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)] sm:text-base">
          Including the awkward ones about money and about when this isn&apos;t
          the right thing for you. If something isn&apos;t here,{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="border-b border-[var(--ink)] pb-0.5 text-[var(--ink)] transition-colors hover:border-[var(--clay)] hover:text-[var(--clay)]"
          >
            just ask me directly
          </a>
          .
        </p>
      </header>

      <FaqList />

      <div className="mx-auto mt-24 max-w-6xl px-6">
        <div className="border-t border-[var(--ink)] pt-10">
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
            Answered your question and it turns out you want to talk? The intro
            call is thirty minutes, free, and genuinely without a pitch.
          </p>
          <Link
            href="/coach/contact"
            className="mt-6 inline-flex items-center gap-3 bg-[var(--ink)] px-7 py-4 text-sm uppercase tracking-[0.18em] text-[var(--paper)] transition-colors hover:bg-[var(--clay)]"
          >
            Book an intro call
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
