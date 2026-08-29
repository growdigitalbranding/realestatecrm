"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";

/**
 * Reading progress for a journal article.
 *
 * Distinct from the header's page progress on purpose: this one measures the
 * *article*, not the document, so the footer and related links don't count as
 * reading left to do. The minutes remaining is the part readers actually use —
 * it answers "can I finish this before my next meeting".
 */
export function ReadingProgress({
  children,
  minutes,
}: {
  children: React.ReactNode;
  minutes: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [remaining, setRemaining] = useState(minutes);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 38, restDelta: 0.001 });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const left = Math.max(0, Math.ceil(minutes * (1 - value)));
    setRemaining((previous) => (previous === left ? previous : left));
  });

  return (
    <div ref={ref} className="relative">
      <div className="pointer-events-none sticky top-16 z-40">
        <div className="h-px w-full bg-transparent">
          <motion.div
            className="h-px origin-left bg-[var(--gold)]"
            style={{ scaleX }}
            aria-hidden="true"
          />
        </div>
        <div className="mx-auto flex max-w-3xl justify-end px-6 pt-2">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-soft)]/60"
            // Announcing a number that changes on scroll would be constant
            // noise for a screen reader; the figure is a glanceable aid only.
            aria-hidden="true"
          >
            {remaining > 0 ? `${remaining} min left` : "Finished"}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
