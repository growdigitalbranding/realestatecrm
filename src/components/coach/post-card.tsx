"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Parallax } from "./parallax";
import { coverGradient } from "@/lib/coach/art";
import { formatPostDate, type Post } from "@/lib/coach/content";

/**
 * The cover art drifts inside its frame as the card passes through the
 * viewport — the classic magazine-tile parallax. It runs on the art only; the
 * title and dek sit still so the card stays readable while it moves.
 */
export function PostCard({ post, index }: { post: Post; index: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.li
      data-reveal
      initial={{ opacity: 0, y: reduced ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group border-t border-[var(--rule)]"
    >
      <Link href={`/coach/blog/${post.slug}`} className="grid gap-6 py-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-[3/2]">
            {/* The layer is taller than its frame so there is room to drift. */}
            <Parallax distance={18} className="absolute inset-0 -top-[12%] h-[124%]">
              <div className="h-full w-full" style={{ background: coverGradient(post.slug) }} />
            </Parallax>
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-[var(--ink-soft)]/70">
            <span className="text-[var(--clay)]">{post.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min</span>
          </div>
          <h2 className="coach-display mt-4 text-[clamp(1.75rem,3.6vw,2.75rem)] transition-colors group-hover:text-[var(--clay)]">
            {post.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {post.dek}
          </p>
        </div>
      </Link>
    </motion.li>
  );
}
