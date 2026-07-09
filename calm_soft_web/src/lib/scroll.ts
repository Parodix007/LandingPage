// Mockable scroll module (SPEC §6.5) — anchor offsets are handled via CSS
// scroll-margin-top (globals.css); this is the single place that touches the DOM for
// scrolling, so tests can mock "@/lib/scroll" instead of asserting real scroll positions.
export function scrollToContact(): void {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}
