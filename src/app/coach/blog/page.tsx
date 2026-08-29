import type { Metadata } from "next";
import { PostCard } from "@/components/coach/post-card";
import { Reveal } from "@/components/coach/reveal";
import { POSTS } from "@/lib/coach/content";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes on competence, commitments, and the conversations that unstick a career. Written between clients, not on a content calendar.",
};

export default function BlogPage() {
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <header>
        <Reveal>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--clay)]">Journal</p>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="coach-display mt-6 max-w-3xl text-[clamp(2.5rem,6.5vw,5rem)]">
            Written between clients.
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)] sm:text-base">
            No content calendar and no posting schedule. These go up when
            something comes up often enough in sessions that it&apos;s worth
            writing down properly.
          </p>
        </Reveal>
      </header>

      <ul className="mt-20 border-b border-[var(--rule)]">
        {posts.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
      </ul>
    </div>
  );
}
