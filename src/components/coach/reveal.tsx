"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger index — use for lists so items arrive in reading order. */
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "header";
};

/**
 * The one entrance animation used across the site.
 *
 * Deliberately small: 18px and 0.5s. An entrance's job is to draw the eye to
 * where reading should start, and anything larger turns into a wait. Framer
 * Motion (rather than GSAP) because this is component-local state, not a
 * scroll-scrubbed timeline — `whileInView` renders the initial state on the
 * server too, so there is no flash of unstyled position on hydration.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    // Render the resting state with no animation attached at all.
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: delay * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}

/** Shared variants for parent/child staggers where Reveal's delay prop is clumsy. */
export const staggerParent: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
