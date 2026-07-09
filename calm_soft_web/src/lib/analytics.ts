// Cookieless analytics: the <script> only renders when BOTH env vars are set (SPEC §10).
// Custom events are a conscious MVP non-goal.
export function getAnalyticsScriptProps(): { src: string; domain: string } | null {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  return src && domain ? { src, domain } : null;
}
