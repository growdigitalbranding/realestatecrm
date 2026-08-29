"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "./gsap";

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * How far the layer drifts across its full pass through the viewport, as a
   * percentage of its own height. Positive drifts down (slower than the page),
   * negative drifts up (faster).
   */
  distance?: number;
};

/**
 * Depth cue for layered hero and card art.
 *
 * Parallax is only used here on decorative layers behind text — never on the
 * text itself. Moving a paragraph relative to its own container makes it harder
 * to read while it settles, which is a real cost for no information gained.
 */
export function Parallax({ children, className, distance = 12 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // matchMedia both gates on the motion preference and reverts every tween it
    // created if the preference changes mid-session.
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        el,
        { yPercent: -distance / 2 },
        {
          yPercent: distance / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    return () => mm.revert();
  }, [distance]);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {children}
    </div>
  );
}
