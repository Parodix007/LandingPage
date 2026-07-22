"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { site } from "@/content/site";
import type { AreaId, BudgetId } from "@/content/types";
import { GhostPill } from "@/components/ui/GhostPill";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { useRegisterContactFocus } from "@/components/providers/InquiryProvider";
import {
  submitWithRetry,
  submitDetailsWithRetry,
  InquiryError,
  type InquiryFields,
  type InquiryDetailsFields,
} from "@/lib/inquiry";
import { loadTurnstile, executeTurnstile, teardownTurnstile } from "@/lib/turnstile";
import { track, EVENT_LEAD, EVENT_LEAD_DETAILS } from "@/lib/analytics";

type Status = "idle" | "submitting" | "success" | "error";
// Step-2 (optional qualifying details) phases: "form" = interactive (may carry a stale
// `detailsError` from a previous failed attempt), "submitting" = in flight, "done"/"skipped"
// are the two terminal, non-interactive states (SPEC: details.done is never shown on skip).
type DetailsPhase = "form" | "submitting" | "done" | "skipped";

const form = site.contact.form;

// Stricter than the old /.+@.+\..+/ — no whitespace and none of the backend-forbidden < > , chars.
const EMAIL_RE = /^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/;
// Optional phone: at least 7 digits, only phone-ish chars (+, digits, space, () . -),
// 7–25 total. Literal space (not \s) so CR/LF can't slip through. Validated ONLY when non-empty.
const PHONE_RE = /^(?=(?:\D*\d){7})[+0-9 ().-]{7,25}$/;

type FieldKey = "name" | "email" | "message";
const NO_FIELD_ERRORS: Record<FieldKey, string | null> = { name: null, email: null, message: null };

// Custom card-styled radio labels can't rely on the sr-only input's own focus ring (it's
// visually clipped) — `focus-within` on the wrapping <label> (an ANCESTOR of the input) surfaces
// a visible indicator instead (SPEC §11.2: every interactive control needs one).
const FOCUS_WITHIN_RING =
  "focus-within:outline focus-within:outline-2 focus-within:outline-[color:var(--color-accent)] focus-within:outline-offset-2";

const INPUT_CLASSES =
  "w-full rounded-[var(--radius-input)] border bg-white/[0.05] p-[13px_15px] text-[15px] text-ink placeholder:text-ink-50 transition-[border-color] duration-300 focus:border-accent focus:outline-none";

const RADIO_SELECTED_CLASSES =
  "border-[color-mix(in_oklch,var(--color-accent)_55%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)]";
const RADIO_IDLE_CLASSES =
  "border-border-10 bg-white/[0.04] hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

type RadioOption<T extends string> = { id: T; label: string };

// Shared radio-card group for the step-2 qualifying questions (area / budget) — same visual
// pattern the old service picker used, generic over the option id union so it serves both
// AreaId and BudgetId without duplication.
function RadioCardGroup<T extends string>({
  legend,
  name,
  options,
  selected,
  onChange,
}: {
  legend: string;
  name: string;
  options: RadioOption<T>[];
  selected: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="p-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-50">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-[10px] min-[480px]:grid-cols-3">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center justify-center rounded-[var(--radius-picker)] border p-[12px] text-center text-[13.5px] font-medium leading-snug transition-[all] duration-300 ${FOCUS_WITHIN_RING} ${
                isSelected ? RADIO_SELECTED_CLASSES : RADIO_IDLE_CLASSES
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.id}
                checked={isSelected}
                onChange={() => onChange(opt.id)}
                aria-label={opt.label}
                className="sr-only"
              />
              <span className="text-ink">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type SuccessPanelProps = {
  area: AreaId | null;
  budget: BudgetId | null;
  phone: string;
  phoneError: string | null;
  phoneRef: React.RefObject<HTMLInputElement | null>;
  detailsWebsite: string;
  detailsPhase: DetailsPhase;
  detailsError: string | null;
  onAreaChange: (id: AreaId) => void;
  onBudgetChange: (id: BudgetId) => void;
  onPhoneChange: (value: string) => void;
  onDetailsWebsiteChange: (value: string) => void;
  onDetailsSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onSkip: () => void;
  onReset: () => void;
};

// Step 2 lives inside the same success panel as the step-1 confirmation (SPEC): heading +
// paragraph are permanent; the qualifying fieldset/phone/submit/skip block collapses once the
// user either skips or the details POST succeeds, leaving just the heading, the terminal
// message (if any), and the "send another" link.
function SuccessPanel({
  area,
  budget,
  phone,
  phoneError,
  phoneRef,
  detailsWebsite,
  detailsPhase,
  detailsError,
  onAreaChange,
  onBudgetChange,
  onPhoneChange,
  onDetailsWebsiteChange,
  onDetailsSubmit,
  onSkip,
  onReset,
}: SuccessPanelProps) {
  const details = form.success.details;
  const showQualifying = detailsPhase === "form" || detailsPhase === "submitting";
  const submitting = detailsPhase === "submitting";

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-[60px] text-center">
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

      {showQualifying && (
        <form
          onSubmit={onDetailsSubmit}
          noValidate
          className="flex w-full max-w-[420px] flex-col gap-5 text-left"
        >
          <RadioCardGroup
            legend={details.areaLegend}
            name="cf-area"
            options={details.areaOptions}
            selected={area}
            onChange={onAreaChange}
          />
          <RadioCardGroup
            legend={details.budgetLegend}
            name="cf-budget"
            options={details.budgetOptions}
            selected={budget}
            onChange={onBudgetChange}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="cf-phone" className="text-[13px] font-medium text-ink-60">
              {details.phoneLabel}
            </label>
            <input
              id="cf-phone"
              ref={phoneRef}
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={phoneError ? "cf-phone-error" : undefined}
              className={`${INPUT_CLASSES} ${
                phoneError ? "border-[color:var(--color-error-border)]" : "border-border-12"
              }`}
            />
            {phoneError && (
              <p id="cf-phone-error" className="m-0 text-[12px] text-error">
                {phoneError}
              </p>
            )}
          </div>

          {/* Honeypot — mirrors the step-1 field below (same aria-hidden/off-viewport/
              tabIndex=-1 treatment): "" = human, populated ⇒ backend fake-200s step 2 too. */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={detailsWebsite}
              onChange={(e) => onDetailsWebsiteChange(e.target.value)}
            />
          </div>

          <div role="status" aria-live="polite">
            {detailsError && (
              <p className="m-0 text-center text-[13px] text-error">{detailsError}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 min-[420px]:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 rounded-[var(--radius-pill)] bg-accent p-[13px] text-[15px] font-semibold text-black transition-[filter] duration-[250ms] hover:brightness-[1.15] disabled:cursor-not-allowed disabled:opacity-70 ${PILL_FOCUS}`}
            >
              {submitting ? details.submitting : details.submit}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onSkip}
              className={`rounded-[var(--radius-pill)] px-4 py-[13px] text-[13px] text-ink-50 underline-offset-2 transition-colors duration-300 hover:text-ink-70 hover:underline disabled:cursor-not-allowed disabled:opacity-70 ${PILL_FOCUS}`}
            >
              {details.skip}
            </button>
          </div>
        </form>
      )}

      {detailsPhase === "done" && (
        <p
          role="status"
          aria-live="polite"
          className="m-0 max-w-[380px] text-[14px] leading-[1.5] text-ink-70"
        >
          {details.done}
        </p>
      )}

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
  const register = useRegisterContactFocus();

  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<FieldKey, string | null>>(NO_FIELD_ERRORS);
  const [errorMessage, setErrorMessage] = useState(form.submitError);

  const [area, setArea] = useState<AreaId | null>(null);
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [detailsWebsite, setDetailsWebsite] = useState("");
  const [detailsPhase, setDetailsPhase] = useState<DetailsPhase>("form");
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Synchronous double-submit guards: React state updates aren't guaranteed to have flushed
  // between two rapid clicks, but these refs are read/written immediately inside the handlers.
  const submittingRef = useRef(false);
  const detailsSubmittingRef = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const turnstileHostRef = useRef<HTMLDivElement>(null);

  // Turnstile loads at mount — literally per SPEC §8.2, including dev/mock builds (the widget
  // renders only when a site key is configured, into turnstileHostRef so a Managed sitekey's
  // interaction-only challenge has somewhere visible to appear; executeTurnstile() is only ever
  // invoked on the real submit paths, inside submitWithRetry/submitDetailsWithRetry).
  useEffect(() => {
    loadTurnstile(turnstileHostRef.current ?? undefined);
    return () => teardownTurnstile();
  }, []);

  // ModalProvider's CTA-close path scrolls to #contact then calls this to focus the name field.
  useEffect(() => {
    register(() => nameRef.current?.focus({ preventScroll: true }));
    return () => register(null);
  }, [register]);

  function focusFirstInvalid(errs: Record<FieldKey, string | null>) {
    const order: [FieldKey, React.RefObject<HTMLElement | null>][] = [
      ["name", nameRef],
      ["email", emailRef],
      ["message", messageRef],
    ];
    for (const [key, ref] of order) {
      if (errs[key]) {
        ref.current?.focus();
        return;
      }
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    const em = email.trim();
    const next: Record<FieldKey, string | null> = {
      name: name.trim() ? null : form.fieldErrors.name,
      email: !em
        ? form.fieldErrors.emailRequired
        : !EMAIL_RE.test(em)
          ? form.fieldErrors.emailInvalid
          : null,
      message: message.trim() ? null : form.fieldErrors.message,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      // Drop any stale submit error so the live region only ever holds the submit-error OR
      // per-field errors, never both (SPEC §14.2 / handoff §8).
      if (status === "error") setStatus("idle");
      focusFirstInvalid(next);
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");

    const fields: InquiryFields = {
      name: name.trim(),
      email: em,
      message,
      website,
    };

    try {
      await submitWithRetry(fields, executeTurnstile);
      setStatus("success");
      track(EVENT_LEAD);
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

  async function handleDetailsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (detailsSubmittingRef.current) return;

    const ph = phone.trim();
    if (ph && !PHONE_RE.test(ph)) {
      setPhoneError(form.success.details.phoneInvalid);
      phoneRef.current?.focus();
      return;
    }
    setPhoneError(null);

    // All three qualifying fields empty ⇒ treat as skip, no network call (SPEC).
    if (area === null && budget === null && ph === "") {
      setDetailsPhase("skipped");
      return;
    }

    detailsSubmittingRef.current = true;
    setDetailsError(null);
    setDetailsPhase("submitting");

    const detailsFields: InquiryDetailsFields = {
      name: name.trim(),
      email: email.trim(),
      area: area ?? undefined,
      budget: budget ?? undefined,
      phone: ph || undefined,
      website: detailsWebsite,
    };

    try {
      await submitDetailsWithRetry(detailsFields, executeTurnstile);
      setDetailsPhase("done");
      track(EVENT_LEAD_DETAILS);
    } catch (err) {
      if (process.env.NODE_ENV !== "production" && !(err instanceof InquiryError)) {
        console.warn("[ContactForm] submitDetailsWithRetry rejected with a non-InquiryError:", err);
      }
      setDetailsError(form.success.details.error);
      // Stays interactive — the fields keep their values, a retry is just a second submit.
      setDetailsPhase("form");
    } finally {
      detailsSubmittingRef.current = false;
    }
  }

  function handleSkip() {
    setDetailsPhase("skipped");
  }

  // "Send another" fully resets to a fresh step-1 form — nothing is carried over.
  function reset() {
    setStatus("idle");
    setName("");
    setEmail("");
    setMessage("");
    setWebsite("");
    setErrors(NO_FIELD_ERRORS);
    setErrorMessage(form.submitError);
    setArea(null);
    setBudget(null);
    setPhone("");
    setPhoneError(null);
    setDetailsWebsite("");
    setDetailsError(null);
    setDetailsPhase("form");
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border-08 bg-surface p-6 min-[560px]:p-10">
      {status === "success" ? (
        <SuccessPanel
          area={area}
          budget={budget}
          phone={phone}
          phoneError={phoneError}
          phoneRef={phoneRef}
          detailsWebsite={detailsWebsite}
          detailsPhase={detailsPhase}
          detailsError={detailsError}
          onAreaChange={setArea}
          onBudgetChange={setBudget}
          onPhoneChange={(value) => {
            setPhone(value);
            setPhoneError(null);
          }}
          onDetailsWebsiteChange={setDetailsWebsite}
          onDetailsSubmit={handleDetailsSubmit}
          onSkip={handleSkip}
          onReset={reset}
        />
      ) : (
        <>
          <div className="mb-7 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[24px] font-semibold tracking-[-0.02em] text-ink">
                calm<span className="text-accent">_</span>soft
              </span>
              <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-ink-50">
                {form.title}
              </span>
            </div>
            <p className="m-0 text-[14px] leading-[1.5] text-ink-60">{form.intro}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[26px]">
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
              <label htmlFor="cf-message" className="text-[13px] font-medium text-ink-60">
                {form.fields.message}
              </label>
              <textarea
                id="cf-message"
                ref={messageRef}
                rows={3}
                placeholder={form.messagePlaceholder}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrors((p) => ({ ...p, message: null }));
                }}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? "cf-message-error" : undefined}
                className={`${INPUT_CLASSES} resize-y ${
                  errors.message ? "border-[color:var(--color-error-border)]" : "border-border-12"
                }`}
              />
              {errors.message && (
                <p id="cf-message-error" className="m-0 text-[12px] text-error">{errors.message}</p>
              )}
            </div>

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
      {/* Turnstile interaction host — zero-height/invisible except when Cloudflare demands an
          interactive challenge. Always mounted (outside the success/idle split) so step-1 and
          step-2 submits share the same live widget instance across the panel swap. */}
      <div ref={turnstileHostRef} className="flex justify-center" />
    </div>
  );
}
