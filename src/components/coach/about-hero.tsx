"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { HeroField } from "./hero-field";
import { Parallax } from "./parallax";
import { SITE } from "@/lib/coach/content";

/**
 * The hero carries the site's one big idea and the site's one 3D scene.
 *
 * Layered depth, from back to front:
 *  1. A static gradient — the real background, painted before any JS runs.
 *  2. Two parallax washes, drifting at different rates.
 *  3. The WebGL point field, resolving from scattered to aligned as you scroll.
 *  4. The headline, which lifts and fades as it leaves rather than sliding under
 *     the next section.
 *
 * Only the last of those touches text, and only on its way out of the viewport.
 */
export function AboutHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-22%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduced ? 1 : 0]);

  return (
    <section
      ref={ref}
      className="relative flex h-dvh min-h-[38rem] items-end overflow-hidden bg-[var(--paper)]"
    >
      {/* 1 — static ground */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 72% 18%, #efe3d1 0%, var(--paper) 55%, var(--paper) 100%)",
        }}
      />

      {/* 2 — parallax washes */}
      <Parallax distance={26} className="absolute inset-0">
        <div
          className="absolute right-[-10%] top-[6%] h-[34rem] w-[34rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #d9a17e 0%, transparent 68%)" }}
        />
      </Parallax>
      <Parallax distance={-16} className="absolute inset-0">
        <div
          className="absolute left-[-14%] bottom-[-6%] h-[28rem] w-[28rem] rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(circle, #7d9484 0%, transparent 70%)" }}
        />
      </Parallax>

      {/* 3 — the point field */}
      <HeroField className="absolute inset-0" />

      {/* A scrim between the field and the copy. Text contrast is not something
          to leave to whatever the particles happen to be doing. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(78deg, var(--paper) 0%, rgba(247,242,234,0.88) 34%, rgba(247,242,234,0.15) 68%, transparent 100%)",
        }}
      />

      {/* 4 — the copy */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-28"
      >
        <motion.p
          data-reveal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.1 }}
          className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]"
        >
          {SITE.role} · {SITE.location.split(" — ")[0]}
        </motion.p>

        <h1 className="coach-display mt-6 max-w-4xl text-[clamp(2.75rem,8vw,6.5rem)]">
          {["Coaching for people", "in the middle", "of becoming."].map((line, i) => (
            <motion.span
              key={line}
              data-reveal
              className="block"
              initial={{ opacity: 0, y: reduced ? 0 : 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0 : 0.75,
                delay: reduced ? 0 : 0.12 + i * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        <motion.div
          data-reveal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.5 }}
          className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
            A small practice run by {SITE.name} — six-month one-on-one engagements
            and keynotes about the cost of a career that only makes sense from the
            outside.
          </p>
          <Link
            href="/coach/services"
            className="inline-flex items-center gap-2 self-start border-b border-[var(--ink)] pb-1 text-sm font-medium transition-colors hover:border-[var(--clay)] hover:text-[var(--clay)] sm:self-auto"
          >
            See how it works
            <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
