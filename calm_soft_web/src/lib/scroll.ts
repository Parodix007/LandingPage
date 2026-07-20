// Mockable scroll module (SPEC §6.5) — anchor offsets are handled via CSS
// scroll-margin-top (globals.css); this is the single place that touches the DOM for
// scrolling, so tests can mock "@/lib/scroll" instead of asserting real scroll positions.
//
// 2026-07-20 round2 polish: #contact only exists on the homepage, but modal CTAs (e.g.
// "Start a similar project ›") can fire from /work/ too. When the anchor is absent, fall
// back to a real navigation to "/#contact" instead of silently no-oping.
export function scrollToContact(): void {
  const el = document.getElementById("contact");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    return;
  }
  window.location.assign("/#contact");
}
