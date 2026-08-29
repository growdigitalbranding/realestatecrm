"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Lenis owns the scroll position for the whole coaching site.
 *
 * Why it's here and not just `scroll-behavior: smooth`: every scrubbed effect on
 * this site samples scroll on each frame. Native wheel scroll arrives in coarse,
 * uneven deltas, so a scrubbed timeline reads as a series of jumps. Lenis
 * interpolates the position, which is what makes the pinned services section and
 * the horizontal timeline feel driven rather than stepped.
 *
 * Two integrations matter:
 *  - ScrollTrigger must recompute from Lenis's position, not the browser's.
 *  - Lenis must be driven by GSAP's ticker, not its own rAF, so there is one
 *    animation loop per frame instead of two competing ones.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      // Slightly longer than default: the pinned sections need a bit of glide
      // for the scrub to read as motion rather than a jump cut.
      lerp: 0.11,
      wheelMultiplier: 0.9,
      // Lenis disables smoothing itself under prefers-reduced-motion, and
      // programmatic scrolls become instant. Nothing else to do here.
      respectReducedMotion: true,
      // GSAP's ticker drives the loop below instead.
      autoRaf: false,
      // Let Lenis handle in-page #anchor links so they glide instead of jumping.
      anchors: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => {
      // GSAP's ticker reports seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    // Lag smoothing pauses GSAP after a long frame, which would desync the
    // scrub from the (still-moving) scroll position.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    // App Router keeps the DOM around across navigations, so a new page can
    // inherit both the old scroll offset and stale ScrollTrigger measurements.
    window.scrollTo(0, 0);
    // Pins and scrubs are measured on creation; the next page's triggers mount
    // in the same frame, so refresh after they exist.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
