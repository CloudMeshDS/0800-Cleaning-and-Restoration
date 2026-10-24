/**
 * Quote request model, estimator and validation – shared by the form (client)
 * and the API route (server) so both apply identical rules. The server always
 * recomputes the estimate; it never trusts a total sent by the browser.
 */
import { getService, type Service } from "@/data/services";
import { getPrice, hasPrice, type PriceId, type PriceItem } from "@/data/pricing";
import { SERVICE_REGIONS } from "@/data/site";

export const PROPERTY_TYPES = ["House", "Apartment / unit", "Townhouse", "Commercial premises", "Other"] as const;
export const TIME_PREFS = ["Morning", "Afternoon", "Flexible"] as const;

export interface QuoteLine {
  service: string;
  priceId: PriceId;
  qty: number;
}

export interface QuoteRequest {
  type: "quote" | "booking";
  services: string[];
  lines: QuoteLine[];
  region: string;
  suburb: string;
  propertyType: string;
  preferredDate: string;
  preferredTime: string;
  details: string;
  name: string;
  email: string;
  phone: string;
  contactPref: "email" | "phone";
  consent: boolean;
  /** Honeypot – must stay empty. */
  website: string;
}

export const emptyRequest = (type: "quote" | "booking" = "quote", services: string[] = []): QuoteRequest => ({
  type,
  services,
  lines: [],
  region: "",
  suburb: "",
  propertyType: "",
  preferredDate: "",
  preferredTime: "Flexible",
  details: "",
  name: "",
  email: "",
  phone: "",
  contactPref: "email",
  consent: false,
  website: "",
});

/* ───────────────────────────── Estimator ───────────────────────────── */

export type ControlKind = "stepper" | "size" | "toggle";

export interface EstimatorControl {
  kind: ControlKind;
  items: PriceItem[];
  /** Toggles that should start switched on (e.g. a call-out fee). */
  defaultOn?: boolean;
}

/** Decide how each of a service's price lines is presented in the estimator. */
export function estimatorControls(service: Service): EstimatorControl[] {
  const items = service.priceIds.map(getPrice).filter((p) => p.amount !== null);
  const steppers = items.filter((p) => p.quantifiable);
  const addons = items.filter((p) => !p.quantifiable && p.basis === "addon");
  const bands = items.filter((p) => !p.quantifiable && p.basis !== "addon");
  const controls: EstimatorControl[] = [];
  if (bands.length > 1) controls.push({ kind: "size", items: bands });
  else if (bands.length === 1) controls.push({ kind: "toggle", items: bands, defaultOn: true });
  if (steppers.length) controls.push({ kind: "stepper", items: steppers });
  if (addons.length) controls.push({ kind: "toggle", items: addons });
  return controls;
}

export function defaultLines(service: Service): QuoteLine[] {
  return estimatorControls(service)
    .filter((c) => c.kind === "toggle" && c.defaultOn)
    .flatMap((c) => c.items.map((i) => ({ service: service.slug, priceId: i.id as PriceId, qty: 1 })));
}

export interface Estimate {
  total: number;
  /** True when any line is a "from" price, so the total is a minimum. */
  isMinimum: boolean;
  /** Selected services with no published price. */
  quoteOnly: string[];
}

export function estimate(services: string[], lines: QuoteLine[]): Estimate {
  let total = 0;
  let isMinimum = false;
  for (const l of lines) {
    const p = getPrice(l.priceId);
    if (!p || p.amount === null || l.qty <= 0) continue;
    total += p.amount * l.qty;
    if (p.basis === "from") isMinimum = true;
  }
  const quoteOnly = services.filter((slug) => {
    const s = getService(slug);
    return s && !s.priceIds.some((id) => getPrice(id).amount !== null);
  });
  return { total, isMinimum, quoteOnly };
}

/* ───────────────────────────── Validation ───────────────────────────── */

export type Errors = Partial<Record<keyof QuoteRequest, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NZ_PHONE = /^(\+?64|0)[\d\s-]{7,13}$/;

export function validateStep(step: number, r: QuoteRequest): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!r.services.length) e.services = "Choose at least one service.";
  }
  if (step === 1) {
    if (!SERVICE_REGIONS.includes(r.region as (typeof SERVICE_REGIONS)[number])) e.region = "Select your region.";
    if (r.suburb.trim().length < 2) e.suburb = "Enter your suburb or town.";
    if (!PROPERTY_TYPES.includes(r.propertyType as (typeof PROPERTY_TYPES)[number])) e.propertyType = "Select a property type.";
    if (r.type === "booking" && !r.preferredDate) e.preferredDate = "Choose a preferred date.";
    if (r.preferredDate && r.preferredDate < new Date().toISOString().slice(0, 10)) e.preferredDate = "Choose a date from today onwards.";
    if (r.details.length > 2000) e.details = "Please keep details under 2,000 characters.";
  }
  if (step === 2) {
    if (r.name.trim().length < 2) e.name = "Enter your name.";
    if (!EMAIL.test(r.email.trim())) e.email = "Enter a valid email address.";
    if (r.contactPref === "phone" && !NZ_PHONE.test(r.phone.replace(/[()]/g, "").trim())) e.phone = "Enter a valid NZ phone number.";
    if (r.phone && !NZ_PHONE.test(r.phone.replace(/[()]/g, "").trim())) e.phone = "Enter a valid NZ phone number.";
    if (!r.consent) e.consent = "Please confirm we can contact you about this enquiry.";
  }
  return e;
}

export function validateAll(r: QuoteRequest): Errors {
  return { ...validateStep(0, r), ...validateStep(1, r), ...validateStep(2, r) };
}

/** Coerce untrusted JSON into a QuoteRequest, dropping anything unknown. */
export function sanitize(input: unknown): QuoteRequest {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
  const services = Array.isArray(o.services) ? o.services.filter((s): s is string => typeof s === "string" && !!getService(s)).slice(0, 20) : [];
  const lines = Array.isArray(o.lines)
    ? (o.lines as unknown[])
        .map((l) => l as Partial<QuoteLine>)
        .filter((l) => typeof l.priceId === "string" && hasPrice(l.priceId) && typeof l.service === "string" && services.includes(l.service))
        .map((l) => ({ service: l.service!, priceId: l.priceId as PriceId, qty: Math.max(0, Math.min(500, Math.floor(Number(l.qty) || 0))) }))
        .slice(0, 100)
    : [];
  return {
    type: o.type === "booking" ? "booking" : "quote",
    services,
    lines,
    region: str(o.region),
    suburb: str(o.suburb, 100),
    propertyType: str(o.propertyType),
    preferredDate: str(o.preferredDate, 10),
    preferredTime: str(o.preferredTime, 20),
    details: str(o.details, 2000),
    name: str(o.name, 100),
    email: str(o.email, 200),
    phone: str(o.phone, 30),
    contactPref: o.contactPref === "phone" ? "phone" : "email",
    consent: o.consent === true,
    website: str(o.website),
  };
}
