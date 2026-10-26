"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Minus, Plus, Search, X } from "lucide-react";
import { CATEGORIES, getService, SERVICES, type CategoryId } from "@/data/services";
import { formatNZD, formatPrice, PRICING_DISCLAIMER, unitLabel, type PriceId } from "@/data/pricing";
import { SERVICE_REGIONS, SITE } from "@/data/site";
import { ContactList } from "../Contact";
import { Turnstile } from "./Turnstile";
import {
  defaultLines,
  emptyRequest,
  estimate,
  estimatorControls,
  PROPERTY_TYPES,
  TIME_PREFS,
  validateStep,
  type Errors,
  type QuoteRequest,
} from "@/lib/quote";

const STEP_NAMES = ["Services", "Property", "Contact"] as const;

export function QuoteForm({ initialServices, initialType, initialCategory }: { initialServices: string[]; initialType: "quote" | "booking"; initialCategory?: CategoryId }) {
  const [req, setReq] = useState<QuoteRequest>(() => {
    const r = emptyRequest(initialType, initialServices);
    r.lines = initialServices.flatMap((s) => defaultLines(getService(s)!));
    return r;
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [reference, setReference] = useState("");
  const [botToken, setBotToken] = useState("");
  const [botReset, setBotReset] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const set = <K extends keyof QuoteRequest>(k: K, v: QuoteRequest[K]) => {
    setReq((r) => ({ ...r, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const toggleService = (slug: string) => {
    setReq((r) => {
      const on = r.services.includes(slug);
      return {
        ...r,
        services: on ? r.services.filter((s) => s !== slug) : [...r.services, slug],
        lines: on ? r.lines.filter((l) => l.service !== slug) : [...r.lines, ...defaultLines(getService(slug)!)],
      };
    });
    setErrors((e) => ({ ...e, services: undefined }));
  };

  const qtyOf = (service: string, priceId: PriceId) => req.lines.find((l) => l.service === service && l.priceId === priceId)?.qty ?? 0;

  const setQty = (service: string, priceId: PriceId, qty: number, exclusiveWith?: PriceId[]) =>
    setReq((r) => {
      let lines = r.lines.filter((l) => !(l.service === service && (l.priceId === priceId || exclusiveWith?.includes(l.priceId))));
      if (qty > 0) lines = [...lines, { service, priceId, qty }];
      return { ...r, lines };
    });

  const est = useMemo(() => estimate(req.services, req.lines), [req.services, req.lines]);

  const focusFirstError = () =>
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    });

  const next = () => {
    const e = validateStep(step, req);
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (step < 2) return next();
    const e = validateStep(2, req);
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();
    if (!botToken) {
      setServerError(`Please wait a moment for the security check to finish, then try again. If it keeps failing, call ${SITE.phone}.`);
      setStatus("error");
      return;
    }
    setStatus("sending");
    setServerError("");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, turnstileToken: botToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setServerError(json.error ?? "Something went wrong.");
        if (json.errors) setErrors(json.errors);
        setStatus("error");
        setBotReset((n) => n + 1);
        return;
      }
      setReference(json.reference);
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError(`We couldn't reach our server. Please try again or call ${SITE.phone}.`);
      setStatus("error");
      setBotReset((n) => n + 1);
    }
  };

  if (status === "done") {
    return (
      <div className="mx-auto max-w-2xl rounded-[32px] bg-white p-10 text-center shadow-(--shadow-soft) md:p-16" role="status">
        <CheckCircle2 className="mx-auto size-12 text-forest" strokeWidth={1.4} aria-hidden />
        <h2 className="display mt-6 text-4xl text-forest md:text-5xl">Thank you, {req.name.split(" ")[0]}.</h2>
        <p className="mt-5 text-charcoal/70">
          Your {req.type === "booking" ? "booking request" : "quote request"} has been received. We&apos;ll confirm availability in {req.suburb}, {req.region} and come back to you by {req.contactPref}.
        </p>
        <p className="mt-6 inline-block rounded-full bg-stone px-5 py-2 text-sm font-semibold text-forest">Reference {reference}</p>
        <div className="mt-10">
          <Link href="/services" className="btn-ghost">
            Back to services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-10 pb-24 lg:grid-cols-[1fr_380px] lg:gap-14 lg:pb-0">
      <div className="min-w-0">
        {/* Type toggle */}
        <fieldset className="flex w-full rounded-full bg-stone p-1 sm:inline-flex sm:w-auto">
          <legend className="sr-only">Enquiry type</legend>
          {(["quote", "booking"] as const).map((t) => (
            <label key={t} className={`flex-1 cursor-pointer rounded-full px-4 py-2.5 text-center text-[0.82rem] font-semibold transition sm:flex-none sm:px-5 sm:py-2 sm:text-sm ${req.type === t ? "bg-forest text-ivory" : "text-forest/70"}`}>
              <input type="radio" name="type" value={t} checked={req.type === t} onChange={() => set("type", t)} className="sr-only" />
              {t === "quote" ? "Request a quote" : "Request a booking"}
            </label>
          ))}
        </fieldset>

        {/* Steps */}
        <ol className="mt-8 flex flex-wrap items-center gap-2 text-sm sm:gap-3" aria-label="Progress">
          {STEP_NAMES.map((n, i) => (
            <li key={n} className="flex items-center gap-2 sm:gap-3" aria-current={i === step ? "step" : undefined}>
              <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${i < step ? "bg-forest text-ivory" : i === step ? "border-2 border-forest text-forest" : "border border-charcoal/20 text-charcoal/40"}`}>
                {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={i === step ? "font-semibold text-forest" : "hidden text-charcoal/50 sm:inline"}>{n}</span>
              {i < 2 && <span className="h-px w-5 bg-charcoal/15 sm:w-6 md:w-12" aria-hidden />}
            </li>
          ))}
        </ol>

        <div className="mt-10">
          {step === 0 && (
            <ServicesStep
              req={req}
              errors={errors}
              toggle={toggleService}
              qtyOf={qtyOf}
              setQty={setQty}
              initialCategory={initialCategory}
            />
          )}
          {step === 1 && <PropertyStep req={req} errors={errors} set={set} />}
          {step === 2 && <ContactStep req={req} errors={errors} set={set} />}
          {step === 2 && (
            <div className="mt-6">
              <Turnstile onToken={setBotToken} resetKey={botReset} />
            </div>
          )}
        </div>

        {serverError && (
          <p role="alert" className="mt-8 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-800">
            {serverError}
          </p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-charcoal/10 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost w-full sm:w-auto">
              <ArrowLeft className="size-4" aria-hidden /> Back
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === "sending"}>
            {status === "sending" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
              </>
            ) : step < 2 ? (
              <>
                Continue <ArrowRight className="size-4" aria-hidden />
              </>
            ) : req.type === "booking" ? (
              "Send booking request"
            ) : (
              "Send quote request"
            )}
          </button>
        </div>
      </div>

      {/* Mobile: running estimate pinned to the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-between gap-4 border-t border-brass/30 bg-forest px-5 py-3.5 text-ivory shadow-[0_-10px_30px_-12px_rgb(0_0_0/0.35)] lg:hidden" aria-live="polite">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ivory/55">Indicative estimate</p>
          <p className="truncate font-serif text-xl">
            {est.total > 0 ? `${est.isMinimum ? "from " : ""}${formatNZD(est.total)}` : req.services.length ? "To be quoted" : "—"}
          </p>
        </div>
        <p className="shrink-0 text-right text-xs text-ivory/65">
          {req.services.length} {req.services.length === 1 ? "service" : "services"}
          <br />
          Step {step + 1} of 3
        </p>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Enquiry summary">
        <div className="rounded-[28px] bg-forest p-7 text-ivory md:p-8">
          <p className="eyebrow !text-sage">Your enquiry</p>
          {req.services.length ? (
            <ul className="mt-5 space-y-2.5">
              {req.services.map((slug) => (
                <li key={slug} className="flex items-start justify-between gap-3 text-sm">
                  <span>{getService(slug)?.name}</span>
                  <button type="button" onClick={() => toggleService(slug)} className="text-ivory/50 hover:text-ivory" aria-label={`Remove ${getService(slug)?.name}`}>
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-ivory/60">No services selected yet.</p>
          )}
          <div className="mt-7 border-t border-ivory/15 pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-ivory/55">Indicative estimate</p>
            <p className="mt-2 font-serif text-4xl" aria-live="polite">
              {est.total > 0 ? (
                <>
                  {est.isMinimum && <span className="text-lg text-ivory/70">from </span>}
                  {formatNZD(est.total)}
                </>
              ) : (
                <span className="text-2xl text-ivory/70">{req.services.length ? "To be quoted" : "—"}</span>
              )}
            </p>
            {est.quoteOnly.length > 0 && est.total > 0 && <p className="mt-2 text-xs text-ivory/60">Plus quote-only services, priced after assessment.</p>}
            <p className="mt-4 text-xs leading-relaxed text-ivory/55">{PRICING_DISCLAIMER}</p>
          </div>
        </div>
        <div className="mt-6 px-2">
          <p className="eyebrow mb-3">Prefer to talk? Call or WhatsApp</p>
          <ContactList />
        </div>
      </aside>
    </form>
  );
}

/* ───────────────────────────── Step 1 ───────────────────────────── */

function ServicesStep({
  req,
  errors,
  toggle,
  qtyOf,
  setQty,
  initialCategory,
}: {
  req: QuoteRequest;
  errors: Errors;
  toggle: (slug: string) => void;
  qtyOf: (s: string, p: PriceId) => number;
  setQty: (s: string, p: PriceId, q: number, exclusive?: PriceId[]) => void;
  initialCategory?: CategoryId;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">(initialCategory ?? "all");
  const list = SERVICES.filter((s) => (cat === "all" || s.categories.includes(cat)) && (!query || `${s.name} ${s.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <div>
      <h2 className="font-serif text-3xl text-forest">What can we help with?</h2>
      <p className="mt-2 text-charcoal/65">Select one or more services. Add quantities for an instant indicative estimate.</p>

      {req.services.length > 0 && (
        <div className="mt-8 space-y-4">
          {req.services.map((slug) => {
            const s = getService(slug)!;
            const controls = estimatorControls(s);
            return (
              <div key={slug} className="rounded-3xl border border-forest/15 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-forest">{s.name}</h3>
                  <button type="button" onClick={() => toggle(slug)} className="text-sm text-charcoal/50 hover:text-forest">
                    Remove
                  </button>
                </div>
                {controls.length === 0 && <p className="mt-2 text-sm text-charcoal/60">Priced after assessment – tell us more on the next step.</p>}
                {controls.map((c, ci) => (
                  <div key={ci} className="mt-4">
                    {c.kind === "size" && (
                      <fieldset>
                        <legend className="mb-2 text-sm font-semibold text-charcoal/70">Size</legend>
                        <div className="flex flex-wrap gap-2">
                          {c.items.map((it) => {
                            const on = qtyOf(slug, it.id as PriceId) > 0;
                            return (
                              <label key={it.id} className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${on ? "border-forest bg-forest text-ivory" : "border-charcoal/15 hover:border-forest/50"}`}>
                                <input
                                  type="radio"
                                  name={`size-${slug}`}
                                  className="sr-only"
                                  checked={on}
                                  onChange={() => setQty(slug, it.id as PriceId, 1, c.items.map((i) => i.id as PriceId))}
                                />
                                {it.label} · {formatPrice(it)}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}
                    {c.kind === "stepper" && (
                      <ul className="divide-y divide-charcoal/10">
                        {c.items.map((it) => {
                          const q = qtyOf(slug, it.id as PriceId);
                          return (
                            <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                              <span className="text-sm">
                                {it.label} <span className="text-charcoal/50">· {formatPrice(it)}</span>
                              </span>
                              <span className="flex items-center gap-1" role="group" aria-label={`${it.label} quantity`}>
                                <button type="button" className="grid size-10 place-items-center rounded-full border border-charcoal/15 sm:size-8 disabled:opacity-30" onClick={() => setQty(slug, it.id as PriceId, q - 1)} disabled={q === 0} aria-label="Decrease">
                                  <Minus className="size-3.5" />
                                </button>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={500}
                                  value={q}
                                  onChange={(e) => setQty(slug, it.id as PriceId, Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                                  className="w-12 rounded-lg border border-charcoal/10 py-1.5 text-center text-base tabular-nums sm:w-14 sm:py-1 sm:text-sm"
                                  aria-label={`${it.label}, ${unitLabel(it.unit)}s`}
                                />
                                <button type="button" className="grid size-10 place-items-center rounded-full border border-charcoal/15 sm:size-8" onClick={() => setQty(slug, it.id as PriceId, q + 1)} aria-label="Increase">
                                  <Plus className="size-3.5" />
                                </button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {c.kind === "toggle" &&
                      c.items.map((it) => (
                        <label key={it.id} className="flex cursor-pointer items-center gap-3 py-1.5 text-sm">
                          <input type="checkbox" className="size-4 accent-forest" checked={qtyOf(slug, it.id as PriceId) > 0} onChange={(e) => setQty(slug, it.id as PriceId, e.target.checked ? 1 : 0)} />
                          {it.label} <span className="text-charcoal/50">· {formatPrice(it)}</span>
                        </label>
                      ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" aria-hidden />
            <label htmlFor="q-search" className="sr-only">
              Search services
            </label>
            <input id="q-search" className="field !pl-11" placeholder="Search services" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <label htmlFor="q-cat" className="sr-only">
            Category
          </label>
          <select id="q-cat" className="field sm:max-w-[260px]" value={cat} onChange={(e) => setCat(e.target.value as CategoryId | "all")}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="mt-4" aria-describedby={errors.services ? "err-services" : undefined}>
          <legend className="sr-only">Services</legend>
          <div data-lenis-prevent className="grid max-h-[420px] gap-1 overflow-y-auto rounded-2xl border border-charcoal/10 bg-white p-2 sm:grid-cols-2">
            {list.map((s) => {
              const on = req.services.includes(s.slug);
              return (
                <label key={s.slug} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${on ? "bg-forest/8 font-semibold text-forest" : "hover:bg-stone/60"}`}>
                  <input type="checkbox" className="size-4 accent-forest" checked={on} onChange={() => toggle(s.slug)} tabIndex={0} />
                  {s.name}
                </label>
              );
            })}
            {!list.length && <p className="p-4 text-sm text-charcoal/60">No match – describe what you need on the next step.</p>}
          </div>
        </fieldset>
        {errors.services && (
          <p id="err-services" className="mt-2 text-sm text-red-700" tabIndex={-1} aria-invalid="true">
            {errors.services}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Field helpers ───────────────────────────── */

type SetFn = <K extends keyof QuoteRequest>(k: K, v: QuoteRequest[K]) => void;

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-charcoal/50">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const a11y = (id: string, error?: string) => ({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined });

/* ───────────────────────────── Step 2 ───────────────────────────── */

function PropertyStep({ req, errors, set }: { req: QuoteRequest; errors: Errors; set: SetFn }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <h2 className="font-serif text-3xl text-forest">Where and when?</h2>
      <p className="mt-2 text-charcoal/65">Service availability varies by area – we&apos;ll confirm coverage for your location.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Field id="region" label="Region" error={errors.region}>
          <select {...a11y("region", errors.region)} className="field" value={req.region} onChange={(e) => set("region", e.target.value)}>
            <option value="">Select region</option>
            {SERVICE_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field id="suburb" label="Suburb or town" error={errors.suburb}>
          <input {...a11y("suburb", errors.suburb)} className="field" autoComplete="address-level2" value={req.suburb} onChange={(e) => set("suburb", e.target.value)} />
        </Field>
        <Field id="propertyType" label="Property type" error={errors.propertyType}>
          <select {...a11y("propertyType", errors.propertyType)} className="field" value={req.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
            <option value="">Select type</option>
            {PROPERTY_TYPES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field id="preferredDate" label={req.type === "booking" ? "Preferred date" : "Preferred date (optional)"} error={errors.preferredDate} hint="We'll confirm the closest available time.">
          <input {...a11y("preferredDate", errors.preferredDate)} type="date" min={today} className="field" value={req.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="label">Time of day</legend>
          <div className="flex flex-wrap gap-2">
            {TIME_PREFS.map((t) => (
              <label key={t} className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${req.preferredTime === t ? "border-forest bg-forest text-ivory" : "border-charcoal/15"}`}>
                <input type="radio" name="time" className="sr-only" checked={req.preferredTime === t} onChange={() => set("preferredTime", t)} />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <Field id="details" label="Anything we should know?" error={errors.details} hint="Fabric types, stains, access, parking, pets, number of storeys…">
            <textarea {...a11y("details", errors.details)} rows={5} className="field resize-y" value={req.details} onChange={(e) => set("details", e.target.value)} maxLength={2000} />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Step 3 ───────────────────────────── */

function ContactStep({ req, errors, set }: { req: QuoteRequest; errors: Errors; set: SetFn }) {
  return (
    <div>
      <h2 className="font-serif text-3xl text-forest">How can we reach you?</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Full name" error={errors.name}>
          <input {...a11y("name", errors.name)} className="field" autoComplete="name" value={req.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input {...a11y("email", errors.email)} type="email" className="field" autoComplete="email" value={req.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field id="phone" label={req.contactPref === "phone" ? "Phone" : "Phone (optional)"} error={errors.phone}>
          <input {...a11y("phone", errors.phone)} type="tel" className="field" autoComplete="tel" value={req.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <fieldset>
          <legend className="label">Preferred contact</legend>
          <div className="flex gap-2">
            {(["email", "phone"] as const).map((c) => (
              <label key={c} className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm capitalize transition ${req.contactPref === c ? "border-forest bg-forest text-ivory" : "border-charcoal/15"}`}>
                <input type="radio" name="contactPref" className="sr-only" checked={req.contactPref === c} onChange={() => set("contactPref", c)} />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        {/* Honeypot – hidden from people and assistive tech */}
        <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" tabIndex={-1} autoComplete="off" value={req.website} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-charcoal/75">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-forest"
              checked={req.consent}
              onChange={(e) => set("consent", e.target.checked)}
              aria-invalid={!!errors.consent}
              aria-describedby={errors.consent ? "consent-err" : undefined}
            />
            <span>
              I agree to {SITE.legalName} contacting me about this enquiry. My details won&apos;t be used for marketing without my permission. See our{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-forest underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.consent && (
            <p id="consent-err" className="mt-1.5 text-sm text-red-700">
              {errors.consent}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
