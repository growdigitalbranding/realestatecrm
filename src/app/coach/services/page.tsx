import type { Metadata } from "next";
import Link from "next/link";
import { PinnedService } from "@/components/coach/pinned-service";
import { Reveal } from "@/components/coach/reveal";
import { PROCESS, SERVICES } from "@/lib/coach/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Two things: a six-month one-on-one coaching engagement, and a keynote written fresh for your room. Prices published, no 'contact for pricing'.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">Services</p>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="coach-display mt-6 max-w-3xl text-[clamp(2.5rem,6.5vw,5rem)]">
            Two things, done properly.
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)] sm:text-base">
            I could list eight offerings. I&apos;d be worse at all of them. Below
            is everything I actually do, with what it costs — you shouldn&apos;t
            have to book a call to find out a price.
          </p>
        </Reveal>
      </section>

      {/* Each service holds still while its own detail scrolls past. */}
      {SERVICES.map((service, i) => (
        <PinnedService key={service.slug} service={service} index={i} />
      ))}

      <section
        aria-labelledby="process-heading"
        className="border-t border-[var(--rule)] py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">
              However we start
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 id="process-heading" className="coach-display mt-4 max-w-2xl text-4xl sm:text-5xl">
              Four steps, and one of them is leaving
            </h2>
          </Reveal>

          <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item, i) => (
              <Reveal key={item.step} as="li" delay={i}>
                <div className="border-t border-[var(--ink)] pt-5">
                  <span className="coach-display text-4xl text-[var(--clay)]">{item.step}</span>
                  <h3 className="mt-4 text-lg font-medium">{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={2}>
            <div className="mt-20 border-t border-[var(--rule)] pt-10">
              <p className="max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
                Still deciding which one you need? Say so in the enquiry —
                working that out is genuinely part of the first conversation.
              </p>
              <Link
                href="/coach/contact"
                className="mt-6 inline-flex items-center gap-3 bg-[var(--ink)] px-7 py-4 text-sm uppercase tracking-[0.18em] text-[var(--paper)] transition-colors hover:bg-[var(--clay)]"
              >
                Book an intro call
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
