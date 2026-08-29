/**
 * Deterministic cover art.
 *
 * The site ships no photography — partly a design choice (stock portraits are
 * the visual cliché of this industry) and partly a practical one: the app's CSP
 * allows images only from `'self'`. A slug hashed into two hues gives every
 * post a stable, distinct gradient with no asset pipeline at all.
 */
export function coverGradient(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 100000;
  }
  // Constrained to the warm end of the wheel so every cover sits inside the
  // brand's range — the ramp runs light clay to deep ink-brown, never olive.
  const hue = 12 + (hash % 34);
  return [
    "linear-gradient(146deg,",
    `hsl(${hue + 8} 52% 68%) 0%,`,
    `hsl(${hue} 38% 46%) 44%,`,
    `hsl(${hue - 4} 24% 19%) 100%)`,
  ].join(" ");
}
