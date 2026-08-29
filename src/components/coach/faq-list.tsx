"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScrollTrigger } from "./gsap";
import { FAQ_SECTIONS } from "@/lib/coach/content";

/**
 * The FAQ is the page where restraint is the design.
 *
 * Someone on this page is looking for one specific answer. Two things help with
 * that and nothing else does:
 *  1. The disclosure animates its height, so opening an answer doesn't teleport
 *     the rest of the list past the reader's eye.
 *  2. The category rail tracks which group you're in, so a long list keeps a
 *     sense of place.
 *
 * There is no parallax here, no pin, no reveal-on-scroll. Scroll effects on a
 * page people arrive at with a question would be pure friction.
 */
export function FaqList() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(FAQ_SECTIONS[0].id);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Position tracking runs regardless of the motion preference: it is
    // information, not decoration, and it never moves anything on its own.
    const triggers = FAQ_SECTIONS.map((section) =>
      ScrollTrigger.create({
        trigger: `#${section.id}`,
        start: "top 30%",
        end: "bottom 30%",
        onToggle: (self) => {
          if (self.isActive) setActiveSection(section.id);
        },
      }),
    );

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  const jumpTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div ref={rootRef} className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-12 md:gap-16">
      <nav aria-label="Question categories" className="md:col-span-3">
        <ul className="sticky top-24 space-y-3 border-l border-[var(--rule)] pl-4">
          {FAQ_SECTIONS.map((section) => {
            const active = activeSection === section.id;
            return (
              <li key={section.id} className="relative">
                {active && (
                  <motion.span
                    layoutId="faq-active"
                    className="absolute -left-4 top-0 h-full w-px bg-[var(--clay)]"
                    transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => jumpTo(section.id)}
                  aria-current={active ? "true" : undefined}
                  className={`text-left text-sm transition-colors ${
                    active ? "text-[var(--ink)]" : "text-[var(--ink-soft)]/70 hover:text-[var(--ink)]"
                  }`}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="md:col-span-9">
        {FAQ_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="mb-16 scroll-mt-28 last:mb-0"
          >
            <h2
              id={`${section.id}-heading`}
              className="coach-display border-b border-[var(--ink)] pb-3 text-2xl"
            >
              {section.label}
            </h2>

            <ul>
              {section.items.map((item, i) => {
                const id = `${section.id}-${i}`;
                const open = openId === id;
                return (
                  <li key={item.q} className="border-b border-[var(--rule)]">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : id)}
                        aria-expanded={open}
                        aria-controls={`${id}-answer`}
                        className="flex w-full items-start justify-between gap-6 py-5 text-left"
                      >
                        <span className="text-[15px] font-medium sm:text-base">{item.q}</span>
                        <motion.span
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-[var(--clay)]"
                          animate={{ rotate: open ? 45 : 0 }}
                          transition={{ duration: reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                          +
                        </motion.span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          id={`${id}-answer`}
                          role="region"
                          className="overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: reduced ? 0 : 0.32,
                            ease: [0.16, 1, 0.3, 1],
                            opacity: { duration: reduced ? 0 : 0.2 },
                          }}
                          // Heights change as answers open; ScrollTrigger's
                          // section boundaries have to be recomputed or the
                          // rail drifts out of sync with the page.
                          onAnimationComplete={() => ScrollTrigger.refresh()}
                        >
                          <p className="max-w-2xl pb-6 pr-8 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
