import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Fraunces } from "next/font/google";
import "lenis/dist/lenis.css";
import "./coach.css";
import { SmoothScroll } from "@/components/coach/smooth-scroll";
import { SiteHeader } from "@/components/coach/site-header";
import { SiteFooter } from "@/components/coach/site-footer";
import { SITE } from "@/lib/coach/content";

/**
 * `next/font` self-hosts both faces at build time. That matters beyond
 * performance here: this app serves a strict CSP with `font-src 'self'`, so a
 * Google Fonts stylesheet link would simply be blocked.
 */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.role}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.tagline,
  openGraph: {
    title: `${SITE.name} — ${SITE.role}`,
    description: SITE.tagline,
    type: "website",
  },
};

/**
 * The coaching site renders per request rather than as static HTML.
 *
 * This app builds a fresh nonce-based CSP for every request in `src/proxy.ts`
 * (`script-src 'self' 'nonce-…' 'strict-dynamic'`), and Next.js reads that
 * nonce back off the request headers to stamp onto its own script tags.
 * Prerendered HTML is written at build time, before any nonce exists — so a
 * static page here ships without one and the browser refuses every script on
 * it. Reading `headers()` ties the render to the request, which is both what
 * makes it dynamic and what makes the nonce reachable.
 *
 * The alternative — exempting /coach from the nonce and allowing
 * `'unsafe-inline'` — would weaken the policy across the whole public site to
 * save a few milliseconds on pages that fetch no data.
 */
export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  await headers();

  return (
    <div className={`coach-site ${display.variable} ${body.variable}`}>
      {/*
        Entrance animations render their hidden state on the server. With
        JavaScript off nothing would ever animate them in, so force every
        animated element to its resting state — the page then reads as plain,
        complete HTML. An `!important` rule beats Motion's inline styles.
      */}
      <noscript>
        <style>{`.coach-site [data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <SmoothScroll>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-[var(--paper)]"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="pt-16">
          {children}
        </main>
        <SiteFooter />
      </SmoothScroll>
    </div>
  );
}
