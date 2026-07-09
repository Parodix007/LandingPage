import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importTurnstile = async () => await import("./turnstile");

const SCRIPT_SELECTOR = 'script[src*="challenges.cloudflare.com/turnstile"]';
const scriptEls = () => document.head.querySelectorAll(SCRIPT_SELECTOR);

type RenderOptions = {
  sitekey: string;
  size: string;
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
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
  });

  it("executeTurnstile() rejects when the error-callback fires", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000BB");
    const stub = createTurnstileStub((cb) => cb["error-callback"]());
    setTurnstileStub(stub);

    const { loadTurnstile, executeTurnstile } = await importTurnstile();
    loadTurnstile();

    await expect(executeTurnstile()).rejects.toThrow();
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
  });
});
