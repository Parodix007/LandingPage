import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { site } from "@/content/site";
import { ContactForm } from "./ContactForm";
import { submitWithRetry, submitDetailsWithRetry, InquiryError } from "@/lib/inquiry";
import { loadTurnstile } from "@/lib/turnstile";
import { track, EVENT_LEAD, EVENT_LEAD_DETAILS } from "@/lib/analytics";

// SPEC §14.1 — ContactForm tests mock the whole lib/inquiry + lib/turnstile modules; those
// libs have their own unit tests for the real API/mock/Turnstile branches.
vi.mock("@/lib/inquiry", () => ({
  submitWithRetry: vi.fn(),
  submitDetailsWithRetry: vi.fn(),
  InquiryError: class extends Error {
    status?: number;
    serverMessage?: string;
    constructor(message: string, opts?: { status?: number; serverMessage?: string }) {
      super(message);
      this.status = opts?.status;
      this.serverMessage = opts?.serverMessage;
    }
  },
}));

vi.mock("@/lib/turnstile", () => ({
  loadTurnstile: vi.fn(),
  executeTurnstile: vi.fn().mockResolvedValue("tok"),
  teardownTurnstile: vi.fn(),
}));

// 2026-07-22 GA4 addendum — ContactForm tests mock the whole lib/analytics module too;
// analytics.ts has its own unit tests for the real track()/gtag delegation.
vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
  EVENT_LEAD: "generate_lead",
  EVENT_LEAD_DETAILS: "lead_details_submitted",
  EVENT_CALENDLY: "calendly_open",
}));

const form = site.contact.form;
const details = form.success.details;

function renderForm() {
  render(
    <InquiryProvider>
      <ContactForm />
    </InquiryProvider>,
  );
}

async function fillStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
  await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");
  await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
}

// Renders the form, completes step 1 successfully, and lands on the success/details panel.
async function completeStep1(user: ReturnType<typeof userEvent.setup>) {
  renderForm();
  vi.mocked(submitWithRetry).mockResolvedValue(undefined);
  await fillStep1(user);
  await user.click(screen.getByRole("button", { name: form.submit }));
  await screen.findByText(form.success.heading);
}

describe("ContactForm step 1 (SPEC §8, §14.2)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("loads Turnstile once on mount, passing the interaction host element", () => {
    renderForm();
    expect(loadTurnstile).toHaveBeenCalledTimes(1);
    expect(loadTurnstile).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it("blocks submit on empty fields and shows per-field validation messages, focusing the first invalid field", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.name)).toBeInTheDocument();
    expect(screen.getByText(form.fieldErrors.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(form.fieldErrors.message)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.name)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(form.fields.name)).toHaveAttribute("aria-describedby", "cf-name-error");
    expect(screen.getByLabelText(form.fields.email)).toHaveAttribute("aria-invalid", "true");
    // Focus moves to the first invalid field (name, per focusFirstInvalid's field order).
    expect(screen.getByLabelText(form.fields.name)).toHaveFocus();
    expect(screen.getByLabelText(form.fields.name)).toHaveAccessibleDescription(form.fieldErrors.name);
    expect(screen.getByLabelText(form.fields.email)).toHaveAccessibleDescription(
      form.fieldErrors.emailRequired,
    );
    expect(screen.getByLabelText(form.fields.message)).toHaveAccessibleDescription(
      form.fieldErrors.message,
    );
  });

  it("blocks submit when the message is empty, marking only the message field invalid", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.message)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.message)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(form.fields.message)).toHaveAccessibleDescription(
      form.fieldErrors.message,
    );
    expect(screen.queryByText(form.fieldErrors.name)).not.toBeInTheDocument();
  });

  it("rejects an invalid email with its own message, and clears it once corrected — leaving the message error untouched", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), "abc");
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.emailInvalid)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.email)).toHaveAccessibleDescription(
      form.fieldErrors.emailInvalid,
    );
    // The other invalid field (message) is still flagged — per-field clearing didn't wipe it.
    expect(screen.getByText(form.fieldErrors.message)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(form.fields.email));
    await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");

    expect(screen.queryByText(form.fieldErrors.emailInvalid)).not.toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.email)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText(form.fieldErrors.message)).toBeInTheDocument();
  });

  it("shows a distinct message for an empty email vs an invalid one", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.emailRequired)).toBeInTheDocument();
    expect(screen.queryByText(form.fieldErrors.emailInvalid)).not.toBeInTheDocument();
  });

  it("assembles the exact InquiryFields payload from field state", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    expect(submitWithRetry).toHaveBeenCalledWith(
      {
        name: "Anna Nowak",
        email: "anna@example.com",
        message: "We need a new platform.",
        website: "",
      },
      expect.any(Function),
    );
  });

  it("trims a leading space from the email before sending the payload", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), " anna@example.com");
    await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    const [fields] = vi.mocked(submitWithRetry).mock.calls[0];
    expect(fields.email).toBe("anna@example.com");
  });

  it("trims a trailing space from the email before sending the payload", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), "anna@example.com ");
    await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    const [fields] = vi.mocked(submitWithRetry).mock.calls[0];
    expect(fields.email).toBe("anna@example.com");
  });

  it("shows the success panel on a resolved submission and hides the step-1 form", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    expect(screen.getByText(form.success.heading)).toBeInTheDocument();
    expect(screen.getByText(form.success.paragraph)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: form.submit })).not.toBeInTheDocument();
  });

  it("shows the inline submit error and keeps the form intact and re-enabled", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(new InquiryError("mock failure"));
    const user = userEvent.setup();
    renderForm();

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText(form.submitError)).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: form.submit });
    expect(submitButton).not.toBeDisabled();
    expect(screen.getByLabelText(form.fields.name)).toHaveValue("Anna Nowak");
  });

  it("shows the backend's serverMessage when present instead of the generic submit error", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(
      new InquiryError("x", { status: 400, serverMessage: "Custom backend message" }),
    );
    const user = userEvent.setup();
    renderForm();

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText("Custom backend message")).toBeInTheDocument();
    expect(screen.queryByText(form.submitError)).not.toBeInTheDocument();
  });

  it("falls back to the generic submit error when the backend gives no serverMessage", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(new InquiryError("x", { status: 500 }));
    const user = userEvent.setup();
    renderForm();

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText(form.submitError)).toBeInTheDocument();
  });

  it("never renders the submit error together with per-field validation messages", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(new InquiryError("mock failure"));
    const user = userEvent.setup();
    renderForm();

    // 1. Valid submit that the backend rejects → the form-level error shows, but no per-field
    //    error node is present (all fields were valid at submit time).
    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: form.submit }));
    expect(await screen.findByText(form.submitError)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.name)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText(form.fields.email)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText(form.fields.message)).not.toHaveAttribute("aria-invalid");

    // 2. Make a field invalid (clearing the email) — status is still 'error' at this point.
    await user.clear(screen.getByLabelText(form.fields.email));

    // 3. Resubmit → the invalid-fields branch must swap the stale form-level error for the
    //    per-field message, not stack both in the role="status" region.
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(screen.getByText(form.fieldErrors.emailRequired)).toBeInTheDocument();
    expect(screen.queryByText(form.submitError)).not.toBeInTheDocument();
  });

  it("guards against double submit — two rapid clicks while pending send exactly one request", async () => {
    let resolveFn: (() => void) | undefined;
    vi.mocked(submitWithRetry).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );
    renderForm();

    fireEvent.change(screen.getByLabelText(form.fields.name), { target: { value: "Anna Nowak" } });
    fireEvent.change(screen.getByLabelText(form.fields.email), {
      target: { value: "anna@example.com" },
    });
    fireEvent.change(screen.getByLabelText(form.fields.message), {
      target: { value: "We need a new platform." },
    });

    const submitButton = screen.getByRole("button", { name: form.submit });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(submitWithRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: form.submitting })).toBeDisabled();

    resolveFn?.();
    await waitFor(() => expect(screen.getByText(form.success.heading)).toBeInTheDocument());
  });
});

describe("ContactForm step 2 — optional qualifying details (SPEC §14.2)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("success panel shows the area/budget/phone details fields and the skip affordance, none preselected", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    // area/budget option sets can share a label (both have a "not sure yet" option), so each
    // group's radios are queried scoped to that group.
    const areaGroup = screen.getByRole("group", { name: details.areaLegend });
    expect(areaGroup).toBeInTheDocument();
    details.areaOptions.forEach((opt) => {
      expect(within(areaGroup).getByRole("radio", { name: opt.label })).not.toBeChecked();
    });
    const budgetGroup = screen.getByRole("group", { name: details.budgetLegend });
    expect(budgetGroup).toBeInTheDocument();
    details.budgetOptions.forEach((opt) => {
      expect(within(budgetGroup).getByRole("radio", { name: opt.label })).not.toBeChecked();
    });
    expect(screen.getByLabelText(details.phoneLabel)).toHaveValue("");
    expect(screen.getByRole("button", { name: details.submit })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: details.skip })).toBeInTheDocument();
  });

  it("selecting area, budget, and phone then submitting calls submitDetailsWithRetry with echoed name/email and the chosen ids", async () => {
    vi.mocked(submitDetailsWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await completeStep1(user);

    const areaOpt = details.areaOptions[0];
    const budgetOpt = details.budgetOptions[1];
    await user.click(screen.getByRole("radio", { name: areaOpt.label }));
    await user.click(screen.getByRole("radio", { name: budgetOpt.label }));
    await user.type(screen.getByLabelText(details.phoneLabel), "+48 123 456 789");
    await user.click(screen.getByRole("button", { name: details.submit }));

    await waitFor(() => expect(submitDetailsWithRetry).toHaveBeenCalledTimes(1));
    expect(submitDetailsWithRetry).toHaveBeenCalledWith(
      {
        name: "Anna Nowak",
        email: "anna@example.com",
        area: areaOpt.id,
        budget: budgetOpt.id,
        phone: "+48 123 456 789",
        website: "",
      },
      expect.any(Function),
    );
    expect(await screen.findByText(details.done)).toBeInTheDocument();
  });

  it("clicking skip collapses the details block (no network call, no done message)", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    await user.click(screen.getByRole("radio", { name: details.areaOptions[0].label }));
    await user.click(screen.getByRole("button", { name: details.skip }));

    expect(submitDetailsWithRetry).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: details.submit })).not.toBeInTheDocument();
    expect(screen.queryByText(details.done)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: form.success.again })).toBeInTheDocument();
  });

  it("submitting with all three qualifying fields empty behaves as skip (no network call)", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    await user.click(screen.getByRole("button", { name: details.submit }));

    expect(submitDetailsWithRetry).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: details.submit })).not.toBeInTheDocument();
    expect(screen.queryByText(details.done)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: form.success.again })).toBeInTheDocument();
  });

  it("blocks step-2 submit on an invalid phone number without calling submitDetailsWithRetry", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    await user.type(screen.getByLabelText(details.phoneLabel), "abc");
    await user.click(screen.getByRole("button", { name: details.submit }));

    expect(submitDetailsWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(details.phoneInvalid)).toBeInTheDocument();
    expect(screen.getByLabelText(details.phoneLabel)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(details.phoneLabel)).toHaveAccessibleDescription(details.phoneInvalid);
  });

  it("guards against step-2 double submit — two rapid clicks send exactly one details request", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    let resolveFn: (() => void) | undefined;
    vi.mocked(submitDetailsWithRetry).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );

    await user.click(screen.getByRole("radio", { name: details.areaOptions[0].label }));
    const submitButton = screen.getByRole("button", { name: details.submit });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(submitDetailsWithRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: details.submitting })).toBeDisabled();

    resolveFn?.();
    await waitFor(() => expect(screen.getByText(details.done)).toBeInTheDocument());
  });

  it("shows details.error on a rejected step-2 submit and allows a retry", async () => {
    vi.mocked(submitDetailsWithRetry).mockRejectedValueOnce(new InquiryError("mock failure"));
    const user = userEvent.setup();
    await completeStep1(user);

    await user.click(screen.getByRole("radio", { name: details.areaOptions[0].label }));
    await user.click(screen.getByRole("button", { name: details.submit }));

    expect(await screen.findByText(details.error)).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: details.submit });
    expect(submitButton).not.toBeDisabled();

    vi.mocked(submitDetailsWithRetry).mockResolvedValueOnce(undefined);
    await user.click(submitButton);

    expect(await screen.findByText(details.done)).toBeInTheDocument();
    expect(screen.queryByText(details.error)).not.toBeInTheDocument();
  });

  it("a honeypot-only fill (area/budget/phone all empty) still behaves as skip — no network call", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement;
    fireEvent.change(honeypot, { target: { value: "http://spam.example" } });
    await user.click(screen.getByRole("button", { name: details.submit }));

    expect(submitDetailsWithRetry).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: details.submit })).not.toBeInTheDocument();
    expect(screen.queryByText(details.done)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: form.success.again })).toBeInTheDocument();
  });

  it("renders the step-2 honeypot field hidden and unfocusable", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute("tabIndex", "-1");
    expect(honeypot?.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("carries a filled step-2 honeypot value through to the submitDetailsWithRetry payload", async () => {
    vi.mocked(submitDetailsWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await completeStep1(user);

    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement;
    fireEvent.change(honeypot, { target: { value: "http://spam.example" } });
    await user.click(screen.getByRole("radio", { name: details.areaOptions[0].label }));
    await user.click(screen.getByRole("button", { name: details.submit }));

    await waitFor(() => expect(submitDetailsWithRetry).toHaveBeenCalledTimes(1));
    expect(submitDetailsWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({ website: "http://spam.example" }),
      expect.any(Function),
    );
  });

  it("sends website: \"\" on a normal (human) step-2 submit", async () => {
    vi.mocked(submitDetailsWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await completeStep1(user);

    await user.click(screen.getByRole("radio", { name: details.areaOptions[0].label }));
    await user.click(screen.getByRole("button", { name: details.submit }));

    await waitFor(() => expect(submitDetailsWithRetry).toHaveBeenCalledTimes(1));
    expect(submitDetailsWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({ website: "" }),
      expect.any(Function),
    );
  });

  it("clicking 'again' resets to a fresh, empty step-1 form", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    await user.click(screen.getByRole("button", { name: form.success.again }));

    expect(screen.getByRole("button", { name: form.submit })).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.name)).toHaveValue("");
    expect(screen.getByLabelText(form.fields.email)).toHaveValue("");
    expect(screen.getByLabelText(form.fields.message)).toHaveValue("");
  });
});

describe("ContactForm analytics hooks (2026-07-22 GA4 addendum)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("fires EVENT_LEAD on a successful step-1 submit", async () => {
    const user = userEvent.setup();
    await completeStep1(user);

    expect(track).toHaveBeenCalledWith(EVENT_LEAD);
  });

  it("does not fire EVENT_LEAD on a failed step-1 submit", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(new InquiryError("mock failure"));
    const user = userEvent.setup();
    renderForm();

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: form.submit }));
    await screen.findByText(form.submitError);

    expect(track).not.toHaveBeenCalledWith(EVENT_LEAD);
  });

  it("fires EVENT_LEAD_DETAILS on a successful step-2 submit", async () => {
    vi.mocked(submitDetailsWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await completeStep1(user);

    await user.click(screen.getByRole("radio", { name: details.areaOptions[0].label }));
    await user.click(screen.getByRole("button", { name: details.submit }));
    await screen.findByText(details.done);

    expect(track).toHaveBeenCalledWith(EVENT_LEAD_DETAILS);
  });

  it("does not fire EVENT_LEAD_DETAILS on a failed step-2 submit", async () => {
    vi.mocked(submitDetailsWithRetry).mockRejectedValueOnce(new InquiryError("mock failure"));
    const user = userEvent.setup();
    await completeStep1(user);

    await user.click(screen.getByRole("radio", { name: details.areaOptions[0].label }));
    await user.click(screen.getByRole("button", { name: details.submit }));
    await screen.findByText(details.error);

    expect(track).not.toHaveBeenCalledWith(EVENT_LEAD_DETAILS);
  });
});
