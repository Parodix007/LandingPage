import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { site } from "@/content/site";
import { ContactForm } from "./ContactForm";
import { submitWithRetry, InquiryError } from "@/lib/inquiry";
import { loadTurnstile } from "@/lib/turnstile";

// SPEC §14.1 — ContactForm tests mock the whole lib/inquiry + lib/turnstile modules; those
// libs have their own unit tests for the real API/mock/Turnstile branches.
vi.mock("@/lib/inquiry", () => ({
  submitWithRetry: vi.fn(),
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

const form = site.contact.form;

function renderForm() {
  render(
    <InquiryProvider>
      <ContactForm />
    </InquiryProvider>,
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
  await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");
  await user.click(screen.getByRole("radio", { name: form.servicePicker.options[0].label }));
  await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
}

describe("ContactForm (SPEC §8, §14.2)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("loads Turnstile once on mount", () => {
    renderForm();
    expect(loadTurnstile).toHaveBeenCalledTimes(1);
  });

  it("blocks submit on empty fields and shows per-field validation messages", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.name)).toBeInTheDocument();
    expect(screen.getByText(form.fieldErrors.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(form.fieldErrors.service)).toBeInTheDocument();
    expect(screen.getByText(form.fieldErrors.message)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.name)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(form.fields.name)).toHaveAttribute("aria-describedby", "cf-name-error");
    expect(screen.getByLabelText(form.fields.email)).toHaveAttribute("aria-invalid", "true");
    // Focus moves to the first invalid field (name, per focusFirstInvalid's field order).
    expect(screen.getByLabelText(form.fields.name)).toHaveFocus();
    // Accessible-description checks resolve the aria-describedby reference end-to-end, rather
    // than asserting the raw attribute string.
    expect(screen.getByLabelText(form.fields.name)).toHaveAccessibleDescription(form.fieldErrors.name);
    expect(screen.getByLabelText(form.fields.email)).toHaveAccessibleDescription(
      form.fieldErrors.emailRequired,
    );
    expect(screen.getByLabelText(form.fields.message)).toHaveAccessibleDescription(
      form.fieldErrors.message,
    );
    expect(
      screen.getByRole("radio", { name: form.servicePicker.options[0].label }),
    ).toHaveAccessibleDescription(form.fieldErrors.service);
  });

  it("blocks submit when no service is selected, marking the service group invalid", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");
    await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.service)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: form.servicePicker.legend })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByText(form.fieldErrors.name)).not.toBeInTheDocument();
  });

  it("blocks submit when the message is empty, marking the message field invalid", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");
    await user.click(screen.getByRole("radio", { name: form.servicePicker.options[0].label }));
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.message)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.message)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(form.fields.message)).toHaveAccessibleDescription(
      form.fieldErrors.message,
    );
  });

  it("rejects an invalid email with its own message, and clears it once corrected — leaving other errors untouched", async () => {
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
    // Other invalid fields (service, message) are still flagged — per-field clearing didn't
    // wipe them.
    expect(screen.getByText(form.fieldErrors.service)).toBeInTheDocument();
    expect(screen.getByText(form.fieldErrors.message)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(form.fields.email));
    await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");

    expect(screen.queryByText(form.fieldErrors.emailInvalid)).not.toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.email)).not.toHaveAttribute("aria-invalid");
    // Untouched fields keep their error until their own input changes.
    expect(screen.getByText(form.fieldErrors.service)).toBeInTheDocument();
  });

  it("shows a distinct message for an empty email vs an invalid one", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.click(screen.getByRole("radio", { name: form.servicePicker.options[0].label }));
    await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.emailRequired)).toBeInTheDocument();
    expect(screen.queryByText(form.fieldErrors.emailInvalid)).not.toBeInTheDocument();
  });

  it("rejects an invalid phone number while other fields are valid", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(form.fields.phone), "abc");
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.phoneInvalid)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.phone)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(form.fields.phone)).toHaveAccessibleDescription(
      form.fieldErrors.phoneInvalid,
    );
  });

  it("rejects a digit-less phone number (e.g. a run of dashes) as invalid", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(form.fields.phone), "-------");
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(submitWithRetry).not.toHaveBeenCalled();
    expect(screen.getByText(form.fieldErrors.phoneInvalid)).toBeInTheDocument();
  });

  it("accepts a phone number formatted with a non-leading + and parentheses", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(form.fields.phone), "(+48) 123 456 789");
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(form.fieldErrors.phoneInvalid)).not.toBeInTheDocument();
  });

  it("accepts a valid phone number with no phone error and sends it in the payload", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(form.fields.phone), "+48 123 456 789");
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(form.fieldErrors.phoneInvalid)).not.toBeInTheDocument();
    const [fields] = vi.mocked(submitWithRetry).mock.calls[0];
    expect(fields.phone).toBe("+48 123 456 789");
  });

  it("assembles the exact InquiryFields from field state, service/toggle/meeting selection, and honours untouched defaults", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    // Untouched defaults (SPEC §14.2): discover/handover ON, meeting 'online', no service picked.
    form.servicePicker.options.forEach((opt) => {
      expect(screen.getByRole("radio", { name: opt.label })).not.toBeChecked();
    });
    expect(screen.getByRole("radio", { name: form.meeting.online })).toBeChecked();
    expect(screen.getByRole("radio", { name: form.meeting.onsite })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: form.toggles.discover.label })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: form.toggles.handover.label })).toBeChecked();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), "anna@example.com");
    await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");

    const serviceOption = form.servicePicker.options[0];
    await user.click(screen.getByRole("radio", { name: serviceOption.label }));
    await user.click(screen.getByRole("checkbox", { name: form.toggles.discover.label })); // -> false
    await user.click(screen.getByRole("radio", { name: form.meeting.onsite }));

    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    expect(submitWithRetry).toHaveBeenCalledWith(
      {
        name: "Anna Nowak",
        email: "anna@example.com",
        company: undefined,
        phone: undefined,
        service: serviceOption.id,
        message: "We need a new platform.",
        discover: false,
        handover: true,
        meeting: "onsite",
        website: "",
      },
      expect.any(Function),
    );
  });

  it("includes company when filled and omits phone when left empty", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(form.fields.company), "calm_soft sp. z o.o.");
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    const [fields] = vi.mocked(submitWithRetry).mock.calls[0];
    expect(fields.company).toBe("calm_soft sp. z o.o.");
    expect(fields.phone).toBeUndefined();
  });

  it("trims a leading space from the email before sending the payload", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(form.fields.name), "Anna Nowak");
    await user.type(screen.getByLabelText(form.fields.email), " anna@example.com");
    await user.click(screen.getByRole("radio", { name: form.servicePicker.options[0].label }));
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
    await user.click(screen.getByRole("radio", { name: form.servicePicker.options[0].label }));
    await user.type(screen.getByLabelText(form.fields.message), "We need a new platform.");
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(submitWithRetry).toHaveBeenCalledTimes(1));
    const [fields] = vi.mocked(submitWithRetry).mock.calls[0];
    expect(fields.email).toBe("anna@example.com");
  });

  it("shows the success panel on a resolved submission; 'send another' returns to the form with values kept", async () => {
    vi.mocked(submitWithRetry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText(form.success.heading)).toBeInTheDocument();
    expect(screen.getByText(form.success.paragraph)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: form.submit })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: form.success.again }));

    expect(screen.getByRole("button", { name: form.submit })).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.name)).toHaveValue("Anna Nowak");
    expect(screen.getByLabelText(form.fields.email)).toHaveValue("anna@example.com");
  });

  it("shows the inline submit error and keeps the form intact and re-enabled", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(new InquiryError("mock failure"));
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
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

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText("Custom backend message")).toBeInTheDocument();
    expect(screen.queryByText(form.submitError)).not.toBeInTheDocument();
  });

  it("falls back to the generic submit error when the backend gives no serverMessage", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(new InquiryError("x", { status: 500 }));
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText(form.submitError)).toBeInTheDocument();
  });

  it("never renders the submit error together with per-field validation messages", async () => {
    vi.mocked(submitWithRetry).mockRejectedValue(new InquiryError("mock failure"));
    const user = userEvent.setup();
    renderForm();

    // 1. Valid submit that the backend rejects → the form-level error shows, but no per-field
    //    error node is present (all fields were valid at submit time).
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: form.submit }));
    expect(await screen.findByText(form.submitError)).toBeInTheDocument();
    expect(screen.getByLabelText(form.fields.name)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText(form.fields.email)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText(form.fields.phone)).not.toHaveAttribute("aria-invalid");
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
    fireEvent.click(screen.getByRole("radio", { name: form.servicePicker.options[0].label }));
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
