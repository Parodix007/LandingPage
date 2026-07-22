import type { AreaId, BudgetId } from "@/content/types";

// SPEC (frontend-integration.md §3): payload sent to POST /api/contact — additionalProperties
// is false server-side, so this type must carry EXACTLY these fields (formToken and
// turnstileToken are appended separately at the call site, never stored here). No `elapsedMs`.
export type InquiryFields = {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot — the REAL bound value from the form ("" for humans)
};

// Step 2 (optional qualifying details, additionalProperties:false on POST /api/contact/details):
// name/email are echoed from the already-submitted step-1 state; area/budget/phone are optional
// and MUST be omitted from the JSON body entirely when unset (undefined drops in
// JSON.stringify) — never send them explicitly as null.
export type InquiryDetailsFields = {
  name: string;
  email: string;
  area?: AreaId;
  budget?: BudgetId;
  phone?: string;
  website: string; // honeypot — same convention as InquiryFields
};

export class InquiryError extends Error {
  status?: number;
  serverMessage?: string;

  constructor(message: string, opts?: { status?: number; serverMessage?: string }) {
    super(message);
    this.name = "InquiryError";
    this.status = opts?.status;
    this.serverMessage = opts?.serverMessage;
  }
}

export const MOCK_DELAY_MS = 900;
const TIMEOUT_MS = 10_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Decisions are made purely on HTTP status (frontend-integration.md §4); the response body is
// parsed only to surface a human-readable message when the backend provides one, never to
// branch control flow.
async function extractServerMessage(res: Response): Promise<string | undefined> {
  const body: unknown = await res.json().catch(() => null);
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
  }
  return undefined;
}

/**
 * Shared two-step transport against calm_soft_api: GET a one-time formToken, then POST `fields`
 * (plus the formToken and caller-supplied turnstileToken) to `path`. A single AbortController +
 * 10s timeout spans BOTH requests. Env is read at CALL time (never module scope) so the deployed
 * bundle always reflects the current build-time value and tests can stub it per case. Used by
 * both submitInquiry (/api/contact) and submitInquiryDetails (/api/contact/details) — identical
 * semantics, only the path and payload shape differ.
 */
async function submitOnce(
  path: string,
  fields: InquiryFields | InquiryDetailsFields,
  turnstileToken: string,
): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!base) {
    // Mock is NEVER a silent fallback here — the mock short-circuit lives in the *WithRetry
    // wrappers, before this function is ever reached on the real path.
    throw new InquiryError("Inquiry endpoint not configured and mock not explicitly enabled");
  }

  // Normalize base+path joining: strip a single trailing slash from the configured origin.
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const tokenUrl = `${normalizedBase}/api/contact/token`;
  const postUrl = `${normalizedBase}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let tokenRes: Response;
    try {
      tokenRes = await fetch(tokenUrl, {
        method: "GET",
        signal: controller.signal,
      });
    } catch {
      throw new InquiryError("Network error or timeout");
    }

    if (!tokenRes.ok) {
      throw new InquiryError(`Failed to obtain form token (status ${tokenRes.status})`, {
        status: tokenRes.status,
        serverMessage: await extractServerMessage(tokenRes),
      });
    }

    const tokenBody: unknown = await tokenRes.json().catch(() => null);
    const token =
      tokenBody !== null &&
      typeof tokenBody === "object" &&
      typeof (tokenBody as Record<string, unknown>).token === "string"
        ? ((tokenBody as Record<string, unknown>).token as string)
        : "";

    if (!token) {
      // Missing/empty token is treated as a failure — do NOT proceed to POST.
      throw new InquiryError("Form token missing from response");
    }

    let res: Response;
    try {
      res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, formToken: token, turnstileToken }),
        signal: controller.signal,
      });
    } catch {
      throw new InquiryError("Network error or timeout");
    }

    if (!res.ok) {
      throw new InquiryError(`Inquiry request failed with status ${res.status}`, {
        status: res.status,
        serverMessage: await extractServerMessage(res),
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

/** Single-attempt POST /api/contact. */
export async function submitInquiry(fields: InquiryFields, turnstileToken: string): Promise<void> {
  return submitOnce("/api/contact", fields, turnstileToken);
}

/** Single-attempt POST /api/contact/details (step 2, optional qualifying details). */
export async function submitInquiryDetails(
  fields: InquiryDetailsFields,
  turnstileToken: string,
): Promise<void> {
  return submitOnce("/api/contact/details", fields, turnstileToken);
}

/**
 * Mock short-circuits BEFORE executeTurnstile is ever called — the mock path never touches
 * Turnstile or the network.
 */
async function mockOrRun(run: () => Promise<void>): Promise<void> {
  const mock = process.env.NEXT_PUBLIC_INQUIRY_MOCK;
  if (mock === "1" || mock === "fail") {
    await delay(MOCK_DELAY_MS);
    if (mock === "fail") {
      throw new InquiryError("Mock failure (NEXT_PUBLIC_INQUIRY_MOCK=fail)");
    }
    return;
  }
  return run();
}

/**
 * On the real path, retries EXACTLY once and ONLY on a 403, minting a fresh Turnstile token AND
 * a fresh formToken (the retried `attempt`'s own GET) for the retry. A second 403 propagates as
 * an error; any other status/error never retries.
 */
async function attemptWithRetry(
  attempt: (turnstileToken: string) => Promise<void>,
  executeTurnstile: () => Promise<string>,
): Promise<void> {
  const turnstileToken = await executeTurnstile();
  try {
    await attempt(turnstileToken);
  } catch (e) {
    if (e instanceof InquiryError && e.status === 403) {
      const retryTurnstileToken = await executeTurnstile();
      await attempt(retryTurnstileToken);
    } else {
      throw e;
    }
  }
}

/** Step 1: POST /api/contact, with the mock short-circuit + 403-retry-once semantics. */
export async function submitWithRetry(
  fields: InquiryFields,
  executeTurnstile: () => Promise<string>,
): Promise<void> {
  return mockOrRun(() =>
    attemptWithRetry((token) => submitInquiry(fields, token), executeTurnstile),
  );
}

/** Step 2: POST /api/contact/details, identical mock/retry/abort semantics as submitWithRetry. */
export async function submitDetailsWithRetry(
  fields: InquiryDetailsFields,
  executeTurnstile: () => Promise<string>,
): Promise<void> {
  return mockOrRun(() =>
    attemptWithRetry((token) => submitInquiryDetails(fields, token), executeTurnstile),
  );
}
