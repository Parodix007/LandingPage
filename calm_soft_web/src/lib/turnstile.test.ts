import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importTurnstile = async () => await import("./turnstile");

const SCRIPT_SELECTOR = 'script[src*="challenges.cloudflare.com/turnstile"]';
const scriptEls = () => document.head.querySelectorAll(SCRIPT_SELECTOR);

type RenderOptions = {
  sitekey: string;
  execution: string;
  appearance: string;
  theme: string;
  size: string;
  callback: (token: string) => void;
  "error-callback": (code?: string) => void;
  "expired-callback": () => void;
  "before-interactive-callback": () => void;
  "timeout-callback": () => void;
};

type TurnstileStub = {
  render: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

// Builds a `window.turnstile` stub. `onExecute` decides what happens when execute() runs
// (resolve via `callback`, reject via `error-callback`, or do nothing — to exercise the
// load-timeout path). jsdom never actually loads the real Cloudflare script, so this is the
// only way to drive the widget lifecycle deterministically.
function createTurnstileStub(onExecute: (cb: RenderOptions) => void): TurnstileStub {
  let callbacks: RenderOptions | null = null;
  const render = vi.fn((_container: HTMLElement, options: RenderOptions) => {
    callbacks = options;
    return "widget-1";
  });
  const execute = vi.fn(() => {
    if (callbacks) onExecute(callbacks);
  });
  const reset = vi.fn();
  const remove = vi.fn();
  return { render, execute, reset, remove };
}

function setTurnstileStub(stub: TurnstileStub) {
  window.turnstile = stub as unknown as Window["turnstile"];
}

describe("turnstile", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    scriptEls().forEach((el) => el.remove());
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("importing the module has no side effects (no script appended, no render called)", async () => {
    Reflect.deleteProperty(window, "turnstile");
    await importTurnstile();
    expect(scriptEls().length).toBe(0);
    expect(window.turnstile).toBeUndefined();
  });

  it("loadTurnstile() appends exactly one script and is idempotent across repeated calls", async () => {
    Reflect.deleteProperty(window, "turnstile");
    const { loadTurnstile } = await importTurnstile();

    loadTurnstile();
    loadTurnstile();
    loadTurnstile();

    expect(scriptEls().length).toBe(1);
  });

  it("executeTurnstile() calls reset(widgetId) before execute(widgetId, …) and resolves with the callback token", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    const callOrder: string[] = [];
    let capturedCallback: ((token: string) => void) | null = null;

    const render = vi.fn((_container: HTMLElement, options: RenderOptions) => {
      capturedCallback = options.callback;
      return "widget-1";
    });
    const reset = vi.fn(() => {
      callOrder.push("reset");
    });
    const execute = vi.fn(() => {
      callOrder.push("execute");
      capturedCallback?.("fresh-token");
    });
    const remove = vi.fn();
    setTurnstileStub({ render, execute, reset, remove });

    const { loadTurnstile, executeTurnstile } = await importTurnstile();
    loadTurnstile(); // synchronously renders because window.turnstile is already present

    const token = await executeTurnstile();

    expect(token).toBe("fresh-token");
    expect(reset).toHaveBeenCalledWith("widget-1");
    expect(execute).toHaveBeenCalledWith("widget-1", { action: "submit" });
    expect(callOrder).toEqual(["reset", "execute"]);

    // Render must opt into `execution: "execute"` (challenge runs ONLY on our explicit
    // execute() call — never auto-run at render time or auto-re-run after reset()), and the
    // Managed-widget appearance/theme/size trio that keeps it collapsed until Cloudflare
    // actually needs interaction.
    const options = render.mock.calls[0][1];
    expect(options.execution).toBe("execute");
    expect(options.appearance).toBe("interaction-only");
    expect(options.theme).toBe("dark");
    expect(options.size).toBe("flexible");
  });

  it("executeTurnstile() rejects when the error-callback fires with a code", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    const stub = createTurnstileStub((cb) => cb["error-callback"]("110200"));
    setTurnstileStub(stub);

    const { loadTurnstile, executeTurnstile } = await importTurnstile();
    loadTurnstile();

    await expect(executeTurnstile()).rejects.toThrow(/110200/);
  });

  it("executeTurnstile() rejects on its own timeout when no callback ever fires", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    const stub = createTurnstileStub(() => {
      // Deliberately never call any callback — simulates a hung widget.
    });
    setTurnstileStub(stub);

    const { loadTurnstile, executeTurnstile } = await importTurnstile();
    loadTurnstile();

    const pending = executeTurnstile();
    pending.catch(() => {}); // attach before advancing timers to avoid an unhandled rejection
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(pending).rejects.toThrow();

    // The timeout handler must also reset() the widget to abort the wedged execution: one
    // reset() from fire() itself, plus one more from the timeout handler.
    expect(stub.reset).toHaveBeenCalledTimes(2);
  });

  it("timeout of an abandoned call does not clobber a newer pending execute", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    // Default stub never fires any callback on execute() — both calls stay pending until we
    // drive the widget callback manually below.
    const stub = createTurnstileStub(() => {});
    setTurnstileStub(stub);

    const { loadTurnstile, executeTurnstile } = await importTurnstile();
    loadTurnstile();

    const first = executeTurnstile();
    first.catch(() => {}); // attach before advancing timers to avoid an unhandled rejection

    await vi.advanceTimersByTimeAsync(15_000);

    // Starting a second call BEFORE the first's timer fires replaces module-level `pending`
    // with the second call's settle (its fire() runs reset()+execute() again).
    const second = executeTurnstile();

    // Advance past the first call's 20s timer (now at t=20s relative to its own start).
    await vi.advanceTimersByTimeAsync(5_000);
    await expect(first).rejects.toThrow("Turnstile timed out");

    // The first call's timer must NOT have reset the widget again (pending !== settle1 by
    // the time it fired) — only the 2 resets from the two fire() calls should exist.
    expect(stub.reset).toHaveBeenCalledTimes(2);

    // Drive the widget callback (captured from the most recent render() call) with a fresh
    // token — the second, still-pending call must resolve with it.
    const options = stub.render.mock.calls[stub.render.mock.calls.length - 1][1] as RenderOptions;
    options.callback("second-token");

    await expect(second).resolves.toBe("second-token");
  });

  it("loadTurnstile(host) renders into the caller-provided host without off-screen styling, and teardown never removes it", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    const stub = createTurnstileStub(() => {});
    setTurnstileStub(stub);

    const host = document.createElement("div");
    document.body.appendChild(host);

    const { loadTurnstile, teardownTurnstile } = await importTurnstile();
    loadTurnstile(host); // window.turnstile already present ⇒ renders synchronously

    expect(stub.render).toHaveBeenCalledTimes(1);
    expect(stub.render.mock.calls[0][0]).toBe(host);
    // The host is React-owned and must stay exactly as the caller left it — no off-screen
    // positioning, no aria-hidden (it needs to be able to visibly show an interactive challenge).
    expect(host).not.toHaveAttribute("aria-hidden");
    expect(host.style.position).not.toBe("absolute");
    expect(host.style.left).not.toBe("-9999px");

    teardownTurnstile();

    expect(stub.remove).toHaveBeenCalledWith("widget-1");
    // Widget is removed, but the host element itself is never detached from the DOM.
    expect(host.parentNode).toBe(document.body);
  });

  it("before-interactive-callback suspends the load timeout until the challenge resolves", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    const stub = createTurnstileStub(() => {
      // execute() does nothing — the widget goes interactive instead of calling back directly.
    });
    setTurnstileStub(stub);

    const { loadTurnstile, executeTurnstile } = await importTurnstile();
    loadTurnstile();

    let settled = false;
    const pending = executeTurnstile();
    pending.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    const options = stub.render.mock.calls[0][1] as RenderOptions;
    options["before-interactive-callback"]();

    // Well past the 20s load-guard — must NOT have fired, since before-interactive-callback
    // cleared it the moment the challenge went interactive.
    await vi.advanceTimersByTimeAsync(25_000);
    expect(settled).toBe(false);

    options.callback("tok");
    await expect(pending).resolves.toBe("tok");
    expect(settled).toBe(true);
  });

  it("timeout-callback rejects an ignored interactive challenge", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    const stub = createTurnstileStub(() => {});
    setTurnstileStub(stub);

    const { loadTurnstile, executeTurnstile } = await importTurnstile();
    loadTurnstile();

    const pending = executeTurnstile();
    pending.catch(() => {});

    const options = stub.render.mock.calls[0][1] as RenderOptions;
    options["before-interactive-callback"]();
    options["timeout-callback"]();

    await expect(pending).rejects.toThrow(/interactive challenge timed out/);
  });
});
