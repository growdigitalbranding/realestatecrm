"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A `template` (not a `layout`) so it remounts per navigation.
 *
 * The fade is 0.28s of opacity and nothing else. Its job is to cover the frame
 * where ScrollTrigger re-measures the incoming page's pins — without it you can
 * catch a pinned section snapping into position. It never moves anything, so it
 * costs no perceived load time.
 *
 * `data-reveal` matters here more than anywhere else on the site: this wrapper
 * holds every page, so without the no-JS fallback in the layout targeting it,
 * a visitor with JavaScript off would get a blank document.
 */
export default function CoachTemplate({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
