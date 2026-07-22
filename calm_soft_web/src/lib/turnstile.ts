// Cloudflare Turnstile integration. Production sitekey is a Managed widget rendered with
// `appearance: "interaction-only"` — visually collapsed unless Cloudflare demands an
// interactive challenge, in which case it appears inside a form-provided host element.
//
// Client-only. Every DOM/window access lives INSIDE a function — importing this module must be
// a pure no-op (SPEC: Turnstile loads at ContactForm mount, not at module load / import time).

type TurnstileRenderOptions = {
  sitekey: string;
  execution: "execute";
  appearance: "interaction-only";
  theme: "dark";
  size: "flexible";
  callback: (token: string) => void;
  "error-callback": (code?: string) => void;
  "expired-callback": () => void;
  "before-interactive-callback": () => void;
  "timeout-callback": () => void;
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
// missing site key, or a wedged non-interactive execution) — NOT how long a user takes to
// solve an interactive challenge: "before-interactive-callback" below clears this timer the
// moment Cloudflare goes interactive, so solve time is unbounded by design (the backstop for
// an ignored challenge is "timeout-callback"/"expired-callback"). The token itself still
// arrives exclusively via the Cloudflare callback in tryRender(), never from this timer.
const LOAD_TIMEOUT_MS = 20_000;

type PendingExecute = {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  // Fired once the challenge enters interactive mode — see "before-interactive-callback"
  // below. Only clears the load-guard timer; never settles the promise.
  interactive: () => void;
};

// Function-scoped module state (never touched at import time).
let scriptPromise: Promise<void> | null = null;
let widgetId: string | null = null;
let container: HTMLDivElement | null = null;
// Caller-provided element the widget renders into (e.g. ContactForm's always-mounted host
// div) — set via loadTurnstile()'s optional `host` param. When absent, tryRender() falls back
// to a lib-created off-screen container (keeps the lazy/no-host path — and existing tests —
// working unchanged).
let hostEl: HTMLElement | null = null;
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

  let target: HTMLElement;
  if (hostEl) {
    // Caller-provided host (ContactForm's always-mounted div): render straight into it, with
    // NO off-screen styling and NO aria-hidden — this element must be able to visibly show an
    // interactive challenge, and React (not this module) owns its DOM lifecycle.
    target = hostEl;
  } else {
    container = document.createElement("div");
    // Off-screen (not display:none), matching the honeypot pattern used elsewhere in the app —
    // fallback path for callers that don't pass a host (e.g. tests, or loadTurnstile() called
    // without one).
    container.style.position = "absolute";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.overflow = "hidden";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);
    target = container;
  }

  widgetId = window.turnstile.render(target, {
    sitekey: siteKey,
    // Default render behaviour is `execution: "render"`, which auto-runs the challenge at
    // render time AND auto-re-runs it immediately after every reset() — that auto-rerun races
    // our explicit execute() in executeTurnstile() below ("already executing", the execute is
    // silently swallowed and no token/callback ever arrives). `execution: "execute"` makes the
    // challenge run ONLY in response to our own execute() call.
    // The production sitekey is a Managed widget (NOT Invisible) — `appearance: "interaction-
    // only"` keeps it visually collapsed whenever the challenge solves non-interactively (the
    // overwhelmingly common case, indistinguishable from an Invisible widget to the user).
    // When Cloudflare DOES demand interaction, the checkbox renders inside the form-provided
    // host element (loadTurnstile()'s `host` param) instead of being trapped in a hidden,
    // unreachable container.
    execution: "execute",
    appearance: "interaction-only",
    theme: "dark", // site is dark-theme-only (SPEC) — no light-theme flash inside the host
    size: "flexible",
    // Turnstile delivers the token ONLY through this callback — execute()/render() never
    // return it. executeTurnstile() below settles its promise exclusively from these
    // callbacks, never from a return value.
    callback: (token: string) => {
      pending?.resolve(token);
      pending = null;
    },
    "error-callback": (code?: string) => {
      pending?.reject(
        new Error(code ? `Turnstile verification failed (${code})` : "Turnstile verification failed")
      );
      pending = null;
    },
    "expired-callback": () => {
      pending?.reject(new Error("Turnstile token expired"));
      pending = null;
    },
    // Fires right before the widget switches into interactive mode (about to show the
    // checkbox in the host). The user may now take arbitrarily long to click it, so stand
    // down the 20s load-guard timer — it would otherwise fire mid-solve for no reason. The
    // backstop for a challenge the user never solves is "timeout-callback" below.
    "before-interactive-callback": () => {
      pending?.interactive();
    },
    // Fires when an interactive challenge was shown but not solved in time (Cloudflare's own
    // interactive timeout, distinct from our LOAD_TIMEOUT_MS above, which was already cleared
    // by before-interactive-callback). Without this callback Turnstile would silently
    // auto-reset instead of telling us anything went wrong.
    "timeout-callback": () => {
      pending?.reject(new Error("Turnstile interactive challenge timed out"));
      pending = null;
    },
  });
}

/**
 * Idempotent — safe to call on every ContactForm mount (including dev/mock builds, which also
 * load the script per SPEC). Always injects api.js; only renders the widget when a site key is
 * configured. `host`, when passed, is the element the widget renders into (ContactForm's
 * always-mounted div) — required so a Managed sitekey's interactive challenge has somewhere
 * visible to appear; omit it to fall back to a lib-created off-screen container.
 */
export function loadTurnstile(host?: HTMLElement): void {
  if (host) hostEl = host;
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
 * fail a second time by construction. With the widget rendered using `execution: "execute"`
 * (see tryRender() above), reset() no longer triggers an automatic re-run of the challenge, so
 * the explicit execute() immediately after cannot collide with it.
 */
export function executeTurnstile(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Only clear `pending` (and abort the widget) if it is STILL this call's settle — an
      // abandoned call's timer must never clobber a newer executeTurnstile()'s pending settle.
      if (pending === settle) {
        pending = null;
        // Abort the wedged execution so the next executeTurnstile() starts from a clean
        // widget state instead of colliding with a still-running challenge.
        if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
      }
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
      // Challenge went interactive — clear ONLY the load-guard timer, never resolve/reject.
      // The promise stays pending until the user solves it (callback), abandons it
      // (timeout-callback), or the token expires (expired-callback).
      interactive: () => {
        clearTimeout(timer);
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

/** Tears down the rendered widget (e.g. on unmount, or before a "send another" remount so a
 * fresh widget can render cleanly). Only removes the lib-created off-screen `container` from
 * the DOM (the no-host fallback path) — a caller-provided `hostEl` is React-owned and is NEVER
 * removed here, just forgotten (`hostEl = null`) so a later loadTurnstile(host) starts clean. */
export function teardownTurnstile(): void {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId);
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
  widgetId = null;
  container = null;
  hostEl = null;
  pending = null;
}
