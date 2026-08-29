import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/coach/reading-progress";
import { Reveal } from "@/components/coach/reveal";
import { coverGradient } from "@/lib/coach/art";
import { formatPostDate, getPost, POSTS, SITE } from "@/lib/coach/content";

type Params = { slug: string };

// Next 16: `params` is a Promise on pages, metadata, and route handlers alike.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found" };

  return {
    title: post.title,
    description: post.dek,
    openGraph: {
      title: post.title,
      description: post.dek,
      type: "article",
      publishedTime: post.date,
      authors: [SITE.name],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const ordered = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  const index = ordered.findIndex((entry) => entry.slug === post.slug);
  const next = ordered[index + 1];

  return (
    // Progress is measured against the article, not the document — the footer
    // and the "read next" link aren't reading you have left to do.
    <ReadingProgress minutes={post.readingMinutes}>
      <article className="pb-24">
        <header className="mx-auto max-w-3xl px-6 pt-16 sm:pt-24">
          <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-[var(--ink-soft)]/70">
            <span className="text-[var(--clay)]">{post.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </div>

          <h1 className="coach-display mt-6 text-[clamp(2.25rem,5.5vw,4rem)]">{post.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--ink-soft)]">{post.dek}</p>
        </header>

        <div
          aria-hidden="true"
          className="mx-auto mt-12 h-40 max-w-3xl sm:h-56"
          style={{ background: coverGradient(post.slug) }}
        />

        <div className="mx-auto max-w-3xl px-6">
          {post.body.map((block, i) => (
            <section key={block.h ?? i} className="mt-12">
              {block.h && (
                <h2 className="coach-display text-[clamp(1.5rem,3vw,2.1rem)]">{block.h}</h2>
              )}
              <div className="mt-5 space-y-5 text-[17px] leading-[1.72] text-[var(--ink-soft)]">
                {block.p.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <Reveal>
            <aside className="mt-20 border-t border-[var(--ink)] pt-8">
              <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
                If this is describing your last eighteen months, that&apos;s
                usually a good sign an intro call is worth thirty minutes.{" "}
                <Link
                  href="/coach/contact"
                  className="border-b border-[var(--ink)] pb-0.5 text-[var(--ink)] transition-colors hover:border-[var(--clay)] hover:text-[var(--clay)]"
                >
                  Get in touch
                </Link>
                .
              </p>
            </aside>
          </Reveal>

          {next && (
            <Reveal delay={1}>
              <nav aria-label="More writing" className="mt-16 border-t border-[var(--rule)] pt-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--ink-soft)]/70">
                  Read next
                </p>
                <Link href={`/coach/blog/${next.slug}`} className="group mt-3 block">
                  <h2 className="coach-display text-2xl transition-colors group-hover:text-[var(--clay)] sm:text-3xl">
                    {next.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
                    {next.dek}
                  </p>
                </Link>
              </nav>
            </Reveal>
          )}

          <p className="mt-12">
            <Link
              href="/coach/blog"
              className="text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--clay)]"
            >
              ← All writing
            </Link>
          </p>
        </div>
      </article>
    </ReadingProgress>
  );
}
