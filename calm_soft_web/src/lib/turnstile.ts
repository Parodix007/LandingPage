// Cloudflare Turnstile (invisible widget) integration.
//
// Client-only. Every DOM/window access lives INSIDE a function — importing this module must be
// a pure no-op (SPEC: Turnstile loads at ContactForm mount, not at module load / import time).

type TurnstileRenderOptions = {
  sitekey: string;
  size: "invisible";
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string, options?: { action?: string }) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
// Guards ONLY a load/render/no-callback hang (script blocked by adblock/CSP, network stall,
// missing site key) — NOT how long a user takes to solve an interactive challenge, which
// resolves purely via the Cloudflare callback in tryRender() below.
const LOAD_TIMEOUT_MS = 20_000;

type PendingExecute = {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
};

// Function-scoped module state (never touched at import time).
let scriptPromise: Promise<void> | null = null;
let widgetId: string | null = null;
let container: HTMLDivElement | null = null;
let pending: PendingExecute | null = null;

function appendScript(): Promise<void> {
  if (scriptPromise) return scriptPromise; // idempotent — never inject a second <script>
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Failed to load Turnstile script")));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function tryRender(): void {
  if (widgetId || !window.turnstile) return;

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return; // defensive: script injected, no widget rendered, no crash (SPEC)

  container = document.createElement("div");
  // Off-screen (not display:none), matching the honeypot pattern used elsewhere in the app.
  container.style.position = "absolute";
  container.style.width = "1px";
  container.style.height = "1px";
  container.style.overflow = "hidden";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.setAttribute("aria-hidden", "true");
  document.body.appendChild(container);

  widgetId = window.turnstile.render(container, {
    sitekey: siteKey,
    size: "invisible",
    // Turnstile delivers the token ONLY through this callback — execute()/render() never
    // return it. executeTurnstile() below settles its promise exclusively from these three
    // callbacks, never from a return value.
    callback: (token: string) => {
      pending?.resolve(token);
      pending = null;
    },
    "error-callback": () => {
      pending?.reject(new Error("Turnstile verification failed"));
      pending = null;
    },
    "expired-callback": () => {
      pending?.reject(new Error("Turnstile token expired"));
      pending = null;
    },
  });
}

/**
 * Idempotent — safe to call on every ContactForm mount (including dev/mock builds, which also
 * load the script per SPEC). Always injects api.js; only renders the invisible widget when a
 * site key is configured.
 */
export function loadTurnstile(): void {
  appendScript()
    .then(() => tryRender())
    .catch(() => {
      // Swallowed here — a failed script load surfaces to callers via executeTurnstile()'s
      // own timeout below, not as an unhandled rejection at mount time.
    });
  // The script/window.turnstile may already be available synchronously (e.g. a remount after
  // teardownTurnstile) — render immediately in that case too, without waiting on the promise.
  if (window.turnstile) tryRender();
}

/**
 * Resolves with a fresh, single-use Turnstile token. Safe to call repeatedly (e.g. the 403
 * retry in submitWithRetry) because reset() is called immediately before every execute() —
 * without it, a repeat execute() on an already-rendered widget can hand back the SAME cached
 * (now-stale, single-use) token instead of minting a new one, which would make the 403 retry
 * fail a second time by construction.
 */
export function executeTurnstile(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending = null;
      reject(new Error("Turnstile timed out"));
    }, LOAD_TIMEOUT_MS);

    const settle: PendingExecute = {
      resolve: (token) => {
        clearTimeout(timer);
        resolve(token);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    };

    const fire = (): boolean => {
      if (!widgetId || !window.turnstile) return false;
      pending = settle;
      // reset() BEFORE execute() — see function doc comment above.
      window.turnstile.reset(widgetId);
      window.turnstile.execute(widgetId, { action: "submit" });
      return true;
    };

    if (fire()) return;

    // Not loaded/rendered yet — ensure loading, then retry once ready. If there's no site
    // key (or the script fails to load), fire() never succeeds and the timeout above rejects.
    appendScript()
      .then(() => {
        tryRender();
        fire();
      })
      .catch(() => {
        // Script failed to load — the timer above will reject.
      });
  });
}

/** Tears down the rendered widget and its off-screen container (e.g. on unmount, or before a
 * "send another" remount so a fresh widget can render cleanly). */
export function teardownTurnstile(): void {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId);
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
  widgetId = null;
  container = null;
  pending = null;
}
