"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { site } from "@/content/site";
import { GhostPill } from "@/components/ui/GhostPill";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { useInquiry, useRegisterServiceRadioFocus } from "@/components/providers/InquiryProvider";
import { submitWithRetry, InquiryError, type InquiryFields } from "@/lib/inquiry";
import { loadTurnstile, executeTurnstile, teardownTurnstile } from "@/lib/turnstile";

type Status = "idle" | "submitting" | "success" | "error";
type Meeting = "online" | "onsite";
type Tone = "accent" | "accent2";

const form = site.contact.form;

// Stricter than the old /.+@.+\..+/ — no whitespace and none of the backend-forbidden < > , chars.
const EMAIL_RE = /^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/;
// Optional phone: at least 7 digits, only phone-ish chars (+, digits, space, () . -),
// 7–25 total. Literal space (not \s) so CR/LF can't slip through. Validated ONLY when non-empty.
const PHONE_RE = /^(?=(?:\D*\d){7})[+0-9 ().-]{7,25}$/;

type FieldKey = "name" | "email" | "phone" | "service" | "message";
const NO_FIELD_ERRORS: Record<FieldKey, string | null> = {
  name: null, email: null, phone: null, service: null, message: null,
};

// Custom card-styled radio/checkbox labels can't rely on the sr-only input's own focus ring
// (it's visually clipped) — `focus-within` on the wrapping <label> (an ANCESTOR of the input,
// same pattern as Services.tsx's `focus-within` card-hover border) surfaces a visible indicator instead
// (SPEC §11.2: every interactive control needs one).
const FOCUS_WITHIN_RING =
  "focus-within:outline focus-within:outline-2 focus-within:outline-[color:var(--color-accent)] focus-within:outline-offset-2";

const INPUT_CLASSES =
  "w-full rounded-[var(--radius-input)] border bg-white/[0.05] p-[13px_15px] text-[15px] text-ink placeholder:text-ink-50 transition-[border-color] duration-300 focus:border-accent focus:outline-none";

// Tone-based lookups keep every class name a complete literal string (Tailwind's JIT scans
// source text — interpolating fragments of a utility name into a template string, e.g.
// `bg-[...${cssVar}...]`, would never be picked up). Mirrors Services.tsx's TONE_* records.
const TOGGLE_CHECKED_CLASSES: Record<Tone, string> = {
  accent:
    "border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_10%,transparent)]",
  accent2:
    "border-[color-mix(in_oklch,var(--color-accent2)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-accent2)_10%,transparent)]",
};
const TOGGLE_MARK_CLASSES: Record<Tone, string> = {
  accent: "bg-accent",
  accent2: "bg-accent2",
};
const TOGGLE_BADGE_CLASSES: Record<Tone, string> = {
  accent: "bg-[color-mix(in_oklch,var(--color-accent)_20%,transparent)] text-accent",
  accent2: "bg-[color-mix(in_oklch,var(--color-accent2)_20%,transparent)] text-accent2",
};

const SERVICE_SELECTED_CLASSES =
  "border-[color-mix(in_oklch,var(--color-accent)_55%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)]";
const SERVICE_IDLE_CLASSES = "border-border-10 bg-white/[0.04] hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

const MEETING_SELECTED_CLASSES =
  "border-[color-mix(in_oklch,var(--color-accent)_55%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] text-ink";
const MEETING_IDLE_CLASSES = "border-border-12 bg-white/[0.04] text-ink-60 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

type ToggleCardProps = {
  tone: Tone;
  checked: boolean;
  onChange: () => void;
  label: string;
  sub: string;
  badge: string;
};

// Local to this file (not a new interactive/ leaf) — the two toggle rows are identical apart
// from tone/copy/checked state.
function ToggleCard({ tone, checked, onChange, label, sub, badge }: ToggleCardProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-[var(--radius-mini)] border p-[20px_22px] transition-[all] duration-300 ${FOCUS_WITHIN_RING} ${
        checked ? TOGGLE_CHECKED_CLASSES[tone] : "border-border-10 bg-white/[0.03] hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-[2px] flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border text-[14px] text-black transition-[all] duration-300 ${
          checked ? `border-transparent ${TOGGLE_MARK_CLASSES[tone]}` : "border-[color:rgba(255,255,255,0.25)] bg-transparent"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="flex flex-col gap-[6px]">
        <span className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[15px] font-semibold text-ink">{label}</span>
          <span
            className={`rounded-[var(--radius-pill)] px-[10px] py-1 text-[12px] font-semibold uppercase tracking-[0.08em] ${TOGGLE_BADGE_CLASSES[tone]}`}
          >
            {badge}
          </span>
        </span>
        <span className="text-[12.5px] leading-[1.5] text-ink-60">{sub}</span>
      </span>
    </label>
  );
}

function SuccessPanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-[70px] text-center">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full border border-accent bg-[color-mix(in_oklch,var(--color-accent)_22%,transparent)] text-[26px] text-accent"
      >
        ✓
      </span>
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
        <h3 className="m-0 text-[30px] font-bold tracking-[-0.02em] text-ink">
          {form.success.heading}
        </h3>
        <p className="m-0 max-w-[380px] text-[16px] leading-[1.55] text-ink-70">
          {form.success.paragraph}
        </p>
      </div>
      <GhostPill tone="accent" size="sm" onClick={onReset}>
        {form.success.again}
      </GhostPill>
      <span className="mt-[6px] font-mono text-[14px] font-semibold tracking-[-0.02em] text-ink-50">
        calm<span className="text-accent">_</span>soft
      </span>
    </div>
  );
}

export function ContactForm() {
  const { selectedService, selectService } = useInquiry();
  const register = useRegisterServiceRadioFocus();

  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [discover, setDiscover] = useState(true);
  const [handover, setHandover] = useState(true);
  const [meeting, setMeeting] = useState<Meeting>("online");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<FieldKey, string | null>>(NO_FIELD_ERRORS);
  const [errorMessage, setErrorMessage] = useState(form.submitError);

  // Clears a stale service validation error when a service becomes selected via an external
  // CTA (InquiryProvider.selectService(), e.g. the Services-card/modal "Start with this
  // service" actions) — mirrors the direct-radio onChange behavior below. This is the
  // documented "adjusting state when a prop changes" idiom (React: storing information from
  // previous renders) rather than a useEffect, so the update happens during render instead of
  // in a post-commit effect (react-hooks/set-state-in-effect).
  const [prevSelectedService, setPrevSelectedService] = useState(selectedService);
  if (selectedService !== prevSelectedService) {
    setPrevSelectedService(selectedService);
    if (selectedService !== null) {
      setErrors((p) => ({ ...p, service: null }));
    }
  }

  // Synchronous double-submit guard: React state updates aren't guaranteed to have flushed
  // between two rapid clicks, but this ref is read/written immediately inside the handler.
  const submittingRef = useRef(false);
  const selectedRadioRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const firstServiceRadioRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Turnstile loads at mount — literally per SPEC §8.2, including dev/mock builds (the
  // invisible widget renders only when a site key is configured; executeTurnstile() is only
  // ever invoked on the real submit path, inside submitWithRetry).
  useEffect(() => {
    loadTurnstile();
    return () => teardownTurnstile();
  }, []);

  useEffect(() => {
    register(() => selectedRadioRef.current?.focus({ preventScroll: true }));
    return () => register(null);
  }, [register]);

  function focusFirstInvalid(errs: Record<FieldKey, string | null>) {
    const order: [FieldKey, React.RefObject<HTMLElement | null>][] = [
      ["name", nameRef], ["email", emailRef], ["phone", phoneRef],
      ["service", firstServiceRadioRef], ["message", messageRef],
    ];
    for (const [key, ref] of order) {
      if (errs[key]) { ref.current?.focus(); return; }
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    const em = email.trim();
    const ph = phone.trim();
    const next: Record<FieldKey, string | null> = {
      name: name.trim() ? null : form.fieldErrors.name,
      email: !em
        ? form.fieldErrors.emailRequired
        : !EMAIL_RE.test(em)
          ? form.fieldErrors.emailInvalid
          : null,
      phone: ph && !PHONE_RE.test(ph) ? form.fieldErrors.phoneInvalid : null,
      service: selectedService === null ? form.fieldErrors.service : null,
      message: message.trim() ? null : form.fieldErrors.message,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      // Drop any stale submit error so the live region only ever holds the submit-error
      // OR per-field errors, never both (SPEC §14.2 / handoff §8).
      if (status === "error") setStatus("idle");
      focusFirstInvalid(next);
      return;
    }

    // Guaranteed non-null by the service check above; a local const gives TypeScript (and
    // readers) an explicit narrowing point instead of a scattered non-null assertion.
    const service = selectedService;
    if (service === null) return;

    submittingRef.current = true;
    setStatus("submitting");

    const fields: InquiryFields = {
      name: name.trim(),
      email: email.trim(),
      company: company || undefined,
      phone: phone || undefined,
      service,
      meeting,
      discover,
      handover,
      message,
      website,
    };

    try {
      await submitWithRetry(fields, executeTurnstile);
      setStatus("success");
    } catch (err) {
      // InquiryError is the documented rejection type (SPEC §8.1); any other throw still
      // lands on the same user-facing error state, but is flagged in dev as unexpected.
      if (process.env.NODE_ENV !== "production" && !(err instanceof InquiryError)) {
        console.warn("[ContactForm] submitWithRetry rejected with a non-InquiryError:", err);
      }
      setErrorMessage(err instanceof InquiryError && err.serverMessage ? err.serverMessage : form.submitError);
      setStatus("error");
    } finally {
      submittingRef.current = false;
    }
  }

  function reset() {
    setStatus("idle");
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border-08 bg-surface p-6 min-[560px]:p-10">
      {status === "success" ? (
        <SuccessPanel onReset={reset} />
      ) : (
        <>
          <div className="mb-7 flex items-center justify-between">
            <span className="font-mono text-[24px] font-semibold tracking-[-0.02em] text-ink">
              calm<span className="text-accent">_</span>soft
            </span>
            <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-ink-50">
              {form.title}
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[26px]">
            <div className="grid grid-cols-1 gap-[14px] min-[560px]:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="cf-name" className="text-[13px] font-medium text-ink-60">
                  {form.fields.name}
                </label>
                <input
                  id="cf-name"
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((p) => ({ ...p, name: null }));
                  }}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "cf-name-error" : undefined}
                  className={`${INPUT_CLASSES} ${
                    errors.name ? "border-[color:var(--color-error-border)]" : "border-border-12"
                  }`}
                />
                {errors.name && (
                  <p id="cf-name-error" className="m-0 text-[12px] text-error">{errors.name}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="cf-email" className="text-[13px] font-medium text-ink-60">
                  {form.fields.email}
                </label>
                <input
                  id="cf-email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: null }));
                  }}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "cf-email-error" : undefined}
                  className={`${INPUT_CLASSES} ${
                    errors.email ? "border-[color:var(--color-error-border)]" : "border-border-12"
                  }`}
                />
                {errors.email && (
                  <p id="cf-email-error" className="m-0 text-[12px] text-error">{errors.email}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="cf-company" className="text-[13px] font-medium text-ink-60">
                  {form.fields.company}
                </label>
                <input
                  id="cf-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={`${INPUT_CLASSES} border-border-12`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="cf-phone" className="text-[13px] font-medium text-ink-60">
                  {form.fields.phone}
                </label>
                <input
                  id="cf-phone"
                  ref={phoneRef}
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrors((p) => ({ ...p, phone: null }));
                  }}
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={errors.phone ? "cf-phone-error" : undefined}
                  className={`${INPUT_CLASSES} ${
                    errors.phone ? "border-[color:var(--color-error-border)]" : "border-border-12"
                  }`}
                />
                {errors.phone && (
                  <p id="cf-phone-error" className="m-0 text-[12px] text-error">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <fieldset
                aria-invalid={errors.service ? true : undefined}
                aria-describedby={errors.service ? "cf-service-error" : undefined}
                className={`m-0 flex min-w-0 flex-col gap-3 rounded-[var(--radius-mini)] border p-0 transition-[border-color] duration-300 ${
                  errors.service ? "border-[color:var(--color-error-border)]" : "border-transparent"
                }`}
              >
                <legend className="p-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-50">
                  {form.servicePicker.legend}
                </legend>
                <div className="grid grid-cols-2 gap-[10px]">
                  {form.servicePicker.options.map((opt, i) => {
                    const selected = selectedService === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer flex-col gap-1 rounded-[var(--radius-picker)] border p-[16px_18px] transition-[all] duration-300 ${FOCUS_WITHIN_RING} ${
                          selected ? SERVICE_SELECTED_CLASSES : SERVICE_IDLE_CLASSES
                        }`}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={opt.id}
                          checked={selected}
                          onChange={() => {
                            selectService(opt.id);
                            setErrors((p) => ({ ...p, service: null }));
                          }}
                          aria-label={opt.label}
                          aria-invalid={i === 0 && errors.service ? true : undefined}
                          aria-describedby={i === 0 && errors.service ? "cf-service-error" : undefined}
                          className="sr-only"
                          ref={(el) => {
                            if (selected) selectedRadioRef.current = el;
                            if (i === 0) firstServiceRadioRef.current = el;
                          }}
                        />
                        <span className="text-[15px] font-semibold text-ink">{opt.label}</span>
                        <span className="text-[12.5px] text-ink-55">{opt.sub}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {errors.service && (
                <p id="cf-service-error" className="m-0 text-[12px] text-error">{errors.service}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="cf-message" className="text-[13px] font-medium text-ink-60">
                {form.fields.message}
              </label>
              <textarea
                id="cf-message"
                ref={messageRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrors((p) => ({ ...p, message: null }));
                }}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? "cf-message-error" : undefined}
                className={`${INPUT_CLASSES} min-h-[110px] resize-y ${
                  errors.message ? "border-[color:var(--color-error-border)]" : "border-border-12"
                }`}
              />
              {errors.message && (
                <p id="cf-message-error" className="m-0 text-[12px] text-error">{errors.message}</p>
              )}
            </div>

            <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
              <legend className="p-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-50">
                {form.toggles.legend}
              </legend>
              <ToggleCard
                tone="accent"
                checked={discover}
                onChange={() => setDiscover((v) => !v)}
                label={form.toggles.discover.label}
                sub={form.toggles.discover.sub}
                badge={form.toggles.discover.badge}
              />
              <ToggleCard
                tone="accent2"
                checked={handover}
                onChange={() => setHandover((v) => !v)}
                label={form.toggles.handover.label}
                sub={form.toggles.handover.sub}
                badge={form.toggles.handover.badge}
              />
            </fieldset>

            <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
              <legend className="p-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-50">
                {form.meeting.legend}
              </legend>
              <div className="flex gap-[10px]">
                {(
                  [
                    { value: "online" as const, label: form.meeting.online },
                    { value: "onsite" as const, label: form.meeting.onsite },
                  ]
                ).map(({ value, label }) => {
                  const selected = meeting === value;
                  return (
                    <label
                      key={value}
                      className={`flex-1 cursor-pointer rounded-[var(--radius-picker)] border p-[13px] text-center text-[14.5px] font-medium transition-[all] duration-300 ${FOCUS_WITHIN_RING} ${
                        selected ? MEETING_SELECTED_CLASSES : MEETING_IDLE_CLASSES
                      }`}
                    >
                      <input
                        type="radio"
                        name="meeting"
                        value={value}
                        checked={selected}
                        onChange={() => setMeeting(value)}
                        aria-label={label}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Honeypot — aria-hidden container, positioned off-screen (NOT display:none, which
                bots detect more readily); "" = human, populated ⇒ backend silently rejects. */}
            <div
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
            >
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-[14px]">
              <button
                type="submit"
                disabled={status === "submitting"}
                className={`w-full rounded-[var(--radius-pill)] bg-accent p-[15px] text-[16px] font-semibold text-black transition-[filter] duration-[250ms] hover:brightness-[1.15] disabled:cursor-not-allowed disabled:opacity-70 ${PILL_FOCUS}`}
              >
                {status === "submitting" ? form.submitting : form.submit}
              </button>
              <div role="status" aria-live="polite" className="flex flex-col items-center gap-1">
                {status === "error" && (
                  <p className="m-0 text-center text-[13px] text-error">{errorMessage}</p>
                )}
              </div>
              <p className="m-0 text-center text-[12.5px] text-ink-50">{form.finePrint}</p>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
