"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "./gsap";
import { PRINCIPLES } from "@/lib/coach/content";

/**
 * Scroll-linked, not scroll-triggered.
 *
 * The rule down the left edge draws in continuous proportion to how far through
 * the four principles you are, and each number lifts to full contrast as its
 * paragraph reaches the reading line. It is a position indicator for a section
 * that has no other structure — you always know which of the four you're in.
 *
 * Under reduced motion nothing runs and the rule is simply drawn in full.
 */
export function Principles() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const line = lineRef.current;
    if (!section || !line) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(line, { scaleY: 0 });

      // The line tracks scroll position exactly: scrub with no smoothing, so it
      // reads as a measurement rather than an animation.
      gsap.to(line, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 65%",
          end: "bottom 75%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-principle]", section).forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0.32 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
              end: "top 55%",
              scrub: true,
            },
          },
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="principles-heading"
      className="border-t border-[var(--rule)] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">How I work</p>
        <h2 id="principles-heading" className="coach-display mt-4 max-w-2xl text-4xl sm:text-5xl">
          Four things I will not negotiate on
        </h2>

        <div className="relative mt-16 pl-8 sm:pl-14">
          {/* Track and the drawn rule that runs inside it. */}
          <div className="absolute left-0 top-0 h-full w-px bg-[var(--rule)]" aria-hidden="true">
            <div ref={lineRef} className="h-full w-px origin-top bg-[var(--clay)]" />
          </div>

          <ol className="space-y-16">
            {PRINCIPLES.map((principle) => (
              <li key={principle.n} data-principle className="grid gap-4 sm:grid-cols-12 sm:gap-8">
                <span className="coach-display text-3xl text-[var(--clay)] sm:col-span-2">
                  {principle.n}
                </span>
                <div className="sm:col-span-10">
                  <h3 className="coach-display text-2xl sm:text-3xl">{principle.title}</h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)] sm:text-base">
                    {principle.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
