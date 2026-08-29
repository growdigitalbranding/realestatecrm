import type { Metadata } from "next";
import Link from "next/link";
import { AboutHero } from "@/components/coach/about-hero";
import { Principles } from "@/components/coach/principles";
import { HorizontalTimeline } from "@/components/coach/horizontal-timeline";
import { Reveal } from "@/components/coach/reveal";
import { SITE } from "@/lib/coach/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "A small coaching practice in Oakland — six-month one-on-one engagements and keynotes on the cost of a career that only makes sense from the outside.",
};

const CREDENTIALS = [
  { label: "ICF-accredited", detail: "Associate Certified Coach, 2021" },
  { label: "Two-year apprenticeship", detail: "Co-facilitation under Dr. Nomi Haas" },
  { label: "Twelve clients, capped", detail: "Deliberately, permanently" },
  { label: "60+ engagements", detail: "Since 2021, across four sectors" },
];

export default function AboutPage() {
  return (
    <>
      <AboutHero />

      {/* The thesis, stated plainly and without animation on the text itself. */}
      <section className="border-t border-[var(--rule)] py-24 sm:py-32">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-12 md:gap-16">
          <Reveal className="md:col-span-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">Who this is for</p>
          </Reveal>
          <div className="md:col-span-8">
            <Reveal>
              <p className="coach-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.15]">
                Most people who find me are doing well. That&apos;s usually the
                problem.
              </p>
            </Reveal>
            <Reveal delay={1}>
              <div className="mt-8 max-w-2xl space-y-5 text-[15px] leading-relaxed text-[var(--ink-soft)] sm:text-base">
                <p>
                  They&apos;re competent, promoted, well-reviewed, and quietly aware
                  that the next ten years look exactly like the last three. Nothing
                  is wrong enough to act on. That&apos;s precisely what makes it
                  hard to leave.
                </p>
                <p>
                  I coach people through the decisions that don&apos;t have a
                  spreadsheet answer — a pivot, a first leadership role, the
                  reckoning that tends to arrive around a birthday. Six months,
                  twenty-four sessions, a defined ending. Then you get on with it
                  without me.
                </p>
                <p>
                  I was on the other side of this in 2019, six years into an
                  operations career I was good at and had stopped caring about. It
                  took a stranger asking one well-aimed question to unstick it. This
                  practice is my attempt to be that stranger, more reliably.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Principles />

      <HorizontalTimeline />

      <section className="border-t border-[var(--rule)] py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="coach-display text-3xl sm:text-4xl">The credentials part</h2>
          </Reveal>
          <dl className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {CREDENTIALS.map((item, i) => (
              <Reveal key={item.label} delay={i}>
                <div className="border-t border-[var(--ink)] pt-4">
                  <dt className="text-base font-medium">{item.label}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {item.detail}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>

          <Reveal delay={2}>
            <p className="mt-14 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {SITE.bookingWindow}{" "}
              <Link
                href="/coach/contact"
                className="border-b border-[var(--ink)] pb-0.5 text-[var(--ink)] transition-colors hover:border-[var(--clay)] hover:text-[var(--clay)]"
              >
                The intro call is thirty minutes and free
              </Link>
              , and about a third of them end with me pointing you somewhere else.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
