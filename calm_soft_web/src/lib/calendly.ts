// Calendly popup widget integration.
//
// Client-only. Every DOM/window access lives INSIDE a function — importing this module must be
// a pure no-op. Unlike Turnstile (which loads at ContactForm mount), Calendly loads lazily on
// first click (CalendlyCta's onClick) to protect the Lighthouse ≥95 gate — see
// docs/superpowers/specs/2026-07-20-pricing-calendly-reorder-design.md.

type CalendlyApi = {
  initPopupWidget: (options: { url: string }) => void;
};

declare global {
  interface Window {
    Calendly?: CalendlyApi;
  }
}

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
const STYLESHEET_HREF = "https://assets.calendly.com/assets/external/widget.css";
// Guards only a load hang (script blocked by adblock/CSP, network stall) — mirrors
// turnstile.ts's LOAD_TIMEOUT_MS pattern (shorter here: no interactive challenge to wait on).
const LOAD_TIMEOUT_MS = 10_000;

// Function-scoped module state (never touched at import time).
let loadPromise: Promise<void> | null = null;

function appendStylesheet(): void {
  if (document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return; // idempotent
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

/**
 * Idempotent — safe to call on every click (cached promise, never injects a second <script>).
 * Resolves once `window.Calendly` is available (immediately if already loaded); rejects on
 * script error or the load timeout.
 */
export function loadCalendly(): Promise<void> {
  if (loadPromise) return loadPromise; // idempotent — never inject a second <script>

  loadPromise = new Promise<void>((resolve, reject) => {
    if (window.Calendly) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error("Calendly script timed out"));
    }, LOAD_TIMEOUT_MS);

    appendStylesheet();

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => {
      clearTimeout(timer);
      resolve();
    });
    script.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("Failed to load Calendly script"));
    });
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Loads the widget (if needed) then opens the popup for the given URL. */
export async function openCalendlyPopup(url: string): Promise<void> {
  await loadCalendly();
  window.Calendly?.initPopupWidget({ url });
}
