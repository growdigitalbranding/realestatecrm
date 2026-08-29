"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "./gsap";
import { TIMELINE } from "@/lib/coach/content";

/**
 * The one horizontal-scroll section on the site.
 *
 * A timeline is already a line, and reading a line left-to-right is what the
 * form is for — so the horizontal axis carries meaning here rather than being a
 * trick. Everywhere else on this site, vertical scrolling is left alone.
 *
 * Three behaviours, in order of preference:
 *  - Desktop, motion allowed: the section pins and the track scrubs sideways.
 *  - Narrow screens: native horizontal swipe, which is the better gesture on
 *    touch anyway — no pin, no hijacking.
 *  - Reduced motion: also native scroll. Pinning takes control of the page away
 *    from the reader, which is exactly what that preference is asking us not to do.
 */
export function HorizontalTimeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!section || !viewport || !track || !progress) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      // GSAP owns the horizontal offset while pinned, so the native scrollbar
      // would be a second, conflicting control. matchMedia restores this on revert.
      gsap.set(viewport, { overflowX: "hidden" });

      // Functional values are re-evaluated on every ScrollTrigger.refresh, so
      // this stays correct through resizes and font loads.
      const distance = () => Math.max(track.scrollWidth - viewport.clientWidth, 0);

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Longer than the raw travel: matching them 1:1 whips the track
          // across in a few hundred pixels of scroll, which reads as a glitch
          // rather than a timeline you can follow.
          end: () => `+=${distance() * 1.45 + window.innerHeight * 0.25}`,
          pin: true,
          // A touch of scrub smoothing so the track keeps a little inertia
          // after the wheel stops, matching Lenis's feel.
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Local scroll progress: how far through the timeline you are.
            // Written straight to the DOM rather than through state — this
            // fires on every scroll frame.
            progress.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="timeline-heading"
      className="relative overflow-hidden border-t border-[var(--rule)] bg-[var(--paper-deep)]"
    >
      <div className="flex h-dvh min-h-[36rem] flex-col justify-center py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">The path here</p>
          <h2 id="timeline-heading" className="coach-display mt-4 text-4xl sm:text-5xl">
            Ten years, condensed
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
            Nobody arrives at this work in a straight line. Here is the actual
            one, including the years that looked like nothing was happening.
          </p>
        </div>

        <div
          ref={viewportRef}
          className="mt-12 overflow-x-auto overflow-y-hidden"
          // Native horizontal scroll is the fallback path; give it a real
          // accessible name and keyboard focus so it isn't a trap.
          tabIndex={0}
          role="group"
          aria-label="Career timeline, scrollable"
        >
          <ol ref={trackRef} className="coach-track flex w-max gap-6 px-6 pb-6">
            {TIMELINE.map((entry) => (
              <li
                key={entry.year}
                className="w-[19rem] shrink-0 border-t border-[var(--ink)] pt-5 sm:w-[26rem]"
              >
                <span className="coach-display block text-5xl text-[var(--clay)]">
                  {entry.year}
                </span>
                <h3 className="mt-4 text-lg font-medium">{entry.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  {entry.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mx-auto mt-2 w-full max-w-6xl px-6">
          <div className="h-px w-full bg-[var(--rule)]" aria-hidden="true">
            <div
              ref={progressRef}
              className="h-px w-full origin-left scale-x-0 bg-[var(--clay)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
