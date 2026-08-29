import Link from "next/link";
import { NAV, SITE } from "@/lib/coach/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--rule)] bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="coach-display text-4xl sm:text-5xl">{SITE.tagline}</p>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[var(--paper)]/60">
              {SITE.bookingWindow}
            </p>
            <Link
              href="/coach/contact"
              className="mt-8 inline-flex items-center gap-2 border-b border-[var(--paper)]/40 pb-1 text-sm transition-colors hover:border-[var(--clay-soft)] hover:text-[var(--clay-soft)]"
            >
              Start with an intro call
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--paper)]/45">Pages</h2>
            <ul className="mt-5 space-y-3">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--paper)]/75 transition-colors hover:text-[var(--paper)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--paper)]/45">
              Direct
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-[var(--paper)]/75">
              <li>
                <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-[var(--paper)]">
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`}
                  className="transition-colors hover:text-[var(--paper)]"
                >
                  {SITE.phone}
                </a>
              </li>
              <li className="pt-2 text-[var(--paper)]/50">{SITE.location}</li>
            </ul>
          </div>
        </div>

        <p className="mt-16 border-t border-[var(--paper)]/15 pt-8 text-xs text-[var(--paper)]/40">
          © {new Date().getFullYear()} {SITE.name}. ICF-accredited. Coaching is not a substitute
          for therapy or medical care.
        </p>
      </div>
    </footer>
  );
}
