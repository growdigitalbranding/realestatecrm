"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Registration happens once per module instance, and only in the browser —
 * ScrollTrigger needs a real `window` to measure against. Every component that
 * animates imports gsap from here rather than from the package, so there is no
 * path to a tween running against an unregistered plugin.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/**
 * True when the visitor has asked their OS to reduce motion.
 *
 * Every scroll effect on this site is wrapped in this check. Reduced motion
 * means the layout renders in its final state — never a hidden or half-scrubbed
 * one — so the page is fully readable without a single tween running.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
