import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InquiryDetailsFields, InquiryFields } from "./inquiry";

const importInquiry = async () => await import("./inquiry");

const fields: InquiryFields = {
  name: "Jan",
  email: "jan@firma.pl",
  message: "Hi",
  website: "",
};

const detailsFieldsAll: InquiryDetailsFields = {
  name: "Jan",
  email: "jan@firma.pl",
  area: "web",
  budget: "10-30k",
  phone: "+48 123 456 789",
  website: "",
};

const detailsFieldsMinimal: InquiryDetailsFields = {
  name: "Jan",
  email: "jan@firma.pl",
  website: "",
};

const EXPECTED_POST_KEYS = ["email", "formToken", "message", "name", "turnstileToken", "website"].sort();
const EXPECTED_DETAILS_POST_KEYS_MINIMAL = ["email", "formToken", "name", "turnstileToken", "website"].sort();
const EXPECTED_DETAILS_POST_KEYS_ALL = [
  "area",
  "budget",
  "email",
  "formToken",
  "name",
  "phone",
  "turnstileToken",
  "website",
].sort();

function jsonResponse(ok: boolean, status: number, body: unknown) {
  return { ok, status, json: async () => body };
}

describe("submitInquiry / submitWithRetry (POST /api/contact)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("API: two-step GET token + POST payload, exact URLs/headers/body key set (base with trailing slash is normalized)", async () => {
    // Trailing slash on the base is deliberately included here to exercise normalization.
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test/");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { submitInquiry } = await importInquiry();
    await expect(submitInquiry(fields, "tok")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [getUrl, getInit] = fetchMock.mock.calls[0];
    expect(getUrl).toBe("https://api.test/api/contact/token");
    expect(getInit).toMatchObject({ method: "GET", signal: expect.anything() });

    const [postUrl, postInit] = fetchMock.mock.calls[1];
    expect(postUrl).toBe("https://api.test/api/contact");
    expect(postInit).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });

    const parsedBody = JSON.parse(postInit.body as string);
    expect(Object.keys(parsedBody).sort()).toEqual(EXPECTED_POST_KEYS);
    expect(parsedBody.formToken).toBe("ft");
    expect(parsedBody.turnstileToken).toBe("tok");
  });

  it("missing `token` field on GET response: throws InquiryError, POST is never called", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(true, 200, {}));
    vi.stubGlobal("fetch", fetchMock);

    const { submitInquiry, InquiryError } = await importInquiry();
    await expect(submitInquiry(fields, "tok")).rejects.toBeInstanceOf(InquiryError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("GET token non-2xx (429): throws InquiryError(status 429), POST is never called", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(false, 429, { error: "Invalid request" }));
    vi.stubGlobal("fetch", fetchMock);

    const { submitInquiry, InquiryError } = await importInquiry();
    const err: unknown = await submitInquiry(fields, "tok").catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect((err as InstanceType<typeof InquiryError>).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 413, 415])("POST %d: throws InquiryError with that status, submitWithRetry does NOT retry", async (status) => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft" }))
      .mockResolvedValueOnce(jsonResponse(false, status, { error: "Invalid request" }));
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValue("tok");

    const { submitWithRetry, InquiryError } = await importInquiry();
    const err: unknown = await submitWithRetry(fields, execMock).catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect((err as InstanceType<typeof InquiryError>).status).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(2); // one attempt: 1×GET + 1×POST, no retry
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it("submitWithRetry: POST 403 then 200 — retries exactly once with fresh tokens and succeeds", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft1" }))
      .mockResolvedValueOnce(jsonResponse(false, 403, { error: "Verification failed" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft2" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValueOnce("t1").mockResolvedValueOnce("t2");

    const { submitWithRetry } = await importInquiry();
    await expect(submitWithRetry(fields, execMock)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(4); // 2×GET + 2×POST
    expect(execMock).toHaveBeenCalledTimes(2);

    const secondPostBody = JSON.parse(fetchMock.mock.calls[3][1].body as string);
    expect(secondPostBody.formToken).toBe("ft2");
    expect(secondPostBody.turnstileToken).toBe("t2");
  });

  it("submitWithRetry: POST 403 twice — throws InquiryError(403) after exactly 2 attempts, no third", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft1" }))
      .mockResolvedValueOnce(jsonResponse(false, 403, { error: "Verification failed" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft2" }))
      .mockResolvedValueOnce(jsonResponse(false, 403, { error: "Verification failed" }));
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValueOnce("t1").mockResolvedValueOnce("t2");

    const { submitWithRetry, InquiryError } = await importInquiry();
    const err: unknown = await submitWithRetry(fields, execMock).catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect((err as InstanceType<typeof InquiryError>).status).toBe(403);

    expect(fetchMock).toHaveBeenCalledTimes(4); // exactly 2×GET + 2×POST, no third attempt
    expect(execMock).toHaveBeenCalledTimes(2);
  });

  it("serverMessage: extracted from POST error body when present", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft" }))
      .mockResolvedValueOnce(jsonResponse(false, 400, { error: "Invalid request" }));
    vi.stubGlobal("fetch", fetchMock);

    const { submitInquiry, InquiryError } = await importInquiry();
    const err: unknown = await submitInquiry(fields, "tok").catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect((err as InstanceType<typeof InquiryError>).status).toBe(400);
    expect((err as InstanceType<typeof InquiryError>).serverMessage).toBe("Invalid request");
  });

  it("serverMessage: undefined when the error body is empty/non-JSON (generic fallback path)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft" })).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not JSON");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const { submitInquiry, InquiryError } = await importInquiry();
    const err: unknown = await submitInquiry(fields, "tok").catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect((err as InstanceType<typeof InquiryError>).status).toBe(500);
    expect((err as InstanceType<typeof InquiryError>).serverMessage).toBeUndefined();
  });

  it("network error: fetch rejects throws InquiryError with no status", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { submitInquiry, InquiryError } = await importInquiry();
    const err: unknown = await submitInquiry(fields, "tok").catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect((err as InstanceType<typeof InquiryError>).status).toBeUndefined();
  });

  it("submitWithRetry mock '1': resolves after MOCK_DELAY_MS without touching Turnstile or fetch", async () => {
    vi.stubEnv("NEXT_PUBLIC_INQUIRY_MOCK", "1");
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValue("tok");

    const { submitWithRetry, MOCK_DELAY_MS } = await importInquiry();
    const p = submitWithRetry(fields, execMock);
    await vi.advanceTimersByTimeAsync(MOCK_DELAY_MS);
    await expect(p).resolves.toBeUndefined();

    expect(execMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submitWithRetry mock 'fail': rejects with InquiryError without touching Turnstile or fetch", async () => {
    vi.stubEnv("NEXT_PUBLIC_INQUIRY_MOCK", "fail");
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValue("tok");

    const { submitWithRetry, InquiryError, MOCK_DELAY_MS } = await importInquiry();
    const p = submitWithRetry(fields, execMock);
    p.catch(() => {}); // attach before advancing timers to avoid an unhandled rejection
    await vi.advanceTimersByTimeAsync(MOCK_DELAY_MS);
    await expect(p).rejects.toBeInstanceOf(InquiryError);

    expect(execMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no API base and no mock: submitInquiry throws InquiryError", async () => {
    const { submitInquiry, InquiryError } = await importInquiry();
    await expect(submitInquiry(fields, "tok")).rejects.toBeInstanceOf(InquiryError);
  });
});

describe("submitInquiryDetails / submitDetailsWithRetry (POST /api/contact/details)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to /api/contact/details with the minimal key set when all optionals are absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { submitInquiryDetails } = await importInquiry();
    await expect(submitInquiryDetails(detailsFieldsMinimal, "tok")).resolves.toBeUndefined();

    const [postUrl, postInit] = fetchMock.mock.calls[1];
    expect(postUrl).toBe("https://api.test/api/contact/details");
    const parsedBody = JSON.parse(postInit.body as string);
    expect(Object.keys(parsedBody).sort()).toEqual(EXPECTED_DETAILS_POST_KEYS_MINIMAL);
    expect(parsedBody.area).toBeUndefined();
    expect(parsedBody.budget).toBeUndefined();
    expect(parsedBody.phone).toBeUndefined();
    expect("area" in parsedBody).toBe(false);
    expect("budget" in parsedBody).toBe(false);
    expect("phone" in parsedBody).toBe(false);
  });

  it("posts to /api/contact/details with all optional keys present when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { submitInquiryDetails } = await importInquiry();
    await expect(submitInquiryDetails(detailsFieldsAll, "tok")).resolves.toBeUndefined();

    const [, postInit] = fetchMock.mock.calls[1];
    const parsedBody = JSON.parse(postInit.body as string);
    expect(Object.keys(parsedBody).sort()).toEqual(EXPECTED_DETAILS_POST_KEYS_ALL);
    expect(parsedBody.area).toBe("web");
    expect(parsedBody.budget).toBe("10-30k");
    expect(parsedBody.phone).toBe("+48 123 456 789");
  });

  it("submitDetailsWithRetry: POST 403 then 200 — retries exactly once with fresh tokens", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft1" }))
      .mockResolvedValueOnce(jsonResponse(false, 403, { error: "Verification failed" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft2" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValueOnce("t1").mockResolvedValueOnce("t2");

    const { submitDetailsWithRetry } = await importInquiry();
    await expect(submitDetailsWithRetry(detailsFieldsAll, execMock)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(execMock).toHaveBeenCalledTimes(2);
    const secondPostBody = JSON.parse(fetchMock.mock.calls[3][1].body as string);
    expect(secondPostBody.formToken).toBe("ft2");
    expect(secondPostBody.turnstileToken).toBe("t2");
  });

  it("submitDetailsWithRetry: POST 403 twice — throws InquiryError(403), no third attempt", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft1" }))
      .mockResolvedValueOnce(jsonResponse(false, 403, { error: "Verification failed" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { token: "ft2" }))
      .mockResolvedValueOnce(jsonResponse(false, 403, { error: "Verification failed" }));
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValueOnce("t1").mockResolvedValueOnce("t2");

    const { submitDetailsWithRetry, InquiryError } = await importInquiry();
    const err: unknown = await submitDetailsWithRetry(detailsFieldsAll, execMock).catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect((err as InstanceType<typeof InquiryError>).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(execMock).toHaveBeenCalledTimes(2);
  });

  it("submitDetailsWithRetry mock '1': resolves after MOCK_DELAY_MS without touching Turnstile or fetch", async () => {
    vi.stubEnv("NEXT_PUBLIC_INQUIRY_MOCK", "1");
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValue("tok");

    const { submitDetailsWithRetry, MOCK_DELAY_MS } = await importInquiry();
    const p = submitDetailsWithRetry(detailsFieldsMinimal, execMock);
    await vi.advanceTimersByTimeAsync(MOCK_DELAY_MS);
    await expect(p).resolves.toBeUndefined();

    expect(execMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submitDetailsWithRetry mock 'fail': rejects with InquiryError without touching Turnstile or fetch", async () => {
    vi.stubEnv("NEXT_PUBLIC_INQUIRY_MOCK", "fail");
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const execMock = vi.fn().mockResolvedValue("tok");

    const { submitDetailsWithRetry, InquiryError, MOCK_DELAY_MS } = await importInquiry();
    const p = submitDetailsWithRetry(detailsFieldsMinimal, execMock);
    p.catch(() => {});
    await vi.advanceTimersByTimeAsync(MOCK_DELAY_MS);
    await expect(p).rejects.toBeInstanceOf(InquiryError);

    expect(execMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no API base and no mock: submitInquiryDetails throws InquiryError", async () => {
    const { submitInquiryDetails, InquiryError } = await importInquiry();
    await expect(submitInquiryDetails(detailsFieldsMinimal, "tok")).rejects.toBeInstanceOf(InquiryError);
  });
});
