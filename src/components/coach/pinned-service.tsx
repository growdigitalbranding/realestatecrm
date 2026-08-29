"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "./gsap";
import type { Service } from "@/lib/coach/content";

/**
 * A service, held still while its detail scrolls past it.
 *
 * The purpose of the pin is specific: while you read what a six-month
 * engagement involves, the thing being described — its name, its price, its
 * shape — stays on screen. Without the pin you scroll the title away in the
 * first beat and spend the next four reading details with no subject attached.
 *
 * Below `md`, and whenever reduced motion is set, none of this runs: the panels
 * are a plain stacked list in normal document flow, which is the markup the
 * server sends. The pinned version is an enhancement layered on top of a page
 * that already works.
 */
export function PinnedService({ service, index }: { service: Service; index: number }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const panelWrap = panelsRef.current;
    const step = stepRef.current;
    const bar = barRef.current;
    if (!pin || !panelWrap || !step || !bar) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", panelWrap);
      if (panels.length < 2) return;

      // Lift the panels out of flow so they can cross-fade in place. Reverted
      // automatically when the media query stops matching.
      gsap.set(panelWrap, { position: "relative" });
      gsap.set(panels, { position: "absolute", inset: 0 });
      gsap.set(panels.slice(1), { autoAlpha: 0, y: 28 });

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: 1 },
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          // One viewport-ish of scroll per beat: enough to read a short
          // paragraph before it moves on, short enough not to feel trapped.
          end: () => `+=${window.innerHeight * (panels.length - 1) * 0.85}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Scroll-linked readouts, written directly to the DOM because this
            // fires on every scroll frame.
            bar.style.transform = `scaleX(${self.progress})`;
            const current = Math.min(
              panels.length,
              Math.floor(self.progress * panels.length) + 1,
            );
            const label = String(current).padStart(2, "0");
            if (step.textContent !== label) step.textContent = label;
          },
        },
      });

      panels.forEach((panel, i) => {
        if (i === 0) return;
        // Not a cross-fade: two paragraphs dissolving through each other are
        // unreadable for the whole transition. The outgoing panel leaves
        // quickly and the incoming one starts just before it's gone — enough
        // overlap that the column is never empty, little enough that you're
        // never asked to read through one block of text to another.
        timeline
          .to(panels[i - 1], { autoAlpha: 0, y: -24, duration: 0.6 })
          .to(panel, { autoAlpha: 1, y: 0, duration: 0.9 }, ">-0.3");
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    });

    return () => mm.revert();
  }, []);

  const headingId = `service-${service.slug}`;

  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-[var(--rule)]"
      style={{ background: index % 2 === 0 ? "var(--paper)" : "var(--paper-deep)" }}
    >
      <div ref={pinRef} className="md:flex md:h-dvh md:min-h-[40rem] md:items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:grid-cols-12 md:gap-16 md:py-0">
          {/* The half that stays put. */}
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">
              {service.kicker}
            </p>
            <h2 id={headingId} className="coach-display mt-4 text-4xl sm:text-5xl">
              {service.title}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {service.summary}
            </p>

            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--rule)] pt-6">
              {service.meta.map((row) => (
                <div key={row.label}>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]/70">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>

            <a
              href="/coach/contact"
              className="mt-9 inline-flex items-center gap-2 border-b border-[var(--ink)] pb-1 text-sm font-medium transition-colors hover:border-[var(--clay)] hover:text-[var(--clay)]"
            >
              {service.cta}
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* The half that moves. */}
          <div className="md:col-span-7">
            <div className="mb-6 hidden items-center gap-4 md:flex">
              <span className="font-mono text-xs tabular-nums text-[var(--ink-soft)]">
                <span ref={stepRef}>01</span>
                <span className="text-[var(--ink-soft)]/50"> / {String(service.panels.length).padStart(2, "0")}</span>
              </span>
              <div className="h-px flex-1 bg-[var(--rule)]">
                <div ref={barRef} className="h-px w-full origin-left scale-x-0 bg-[var(--clay)]" />
              </div>
            </div>

            <div ref={panelsRef} className="space-y-10 md:h-64 md:space-y-0 lg:h-56">
              {service.panels.map((panel) => (
                <div key={panel.heading} data-panel>
                  <h3 className="coach-display text-2xl sm:text-3xl">{panel.heading}</h3>
                  <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)] sm:text-base">
                    {panel.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
