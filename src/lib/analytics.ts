/* Cookie-less funnel events (Plausible). No-op when analytics is not configured. */
type Plausible = (event: string, opts?: { props?: Record<string, string | number> }) => void;

export function track(event: string, props?: Record<string, string | number>) {
  try {
    const fn = (window as unknown as { plausible?: Plausible }).plausible;
    if (fn) fn(event, props ? { props } : undefined);
  } catch {
    /* ignore */
  }
}
