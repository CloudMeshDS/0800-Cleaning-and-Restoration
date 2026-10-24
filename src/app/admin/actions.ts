"use server";

import { redirect } from "next/navigation";
import { DEFAULT_PRICES, PER_UNITS_QTY, PRICE_UNITS, type GstTreatment, type PriceBasis, type PriceItem, type PriceOverride, type PriceUnit } from "@/data/pricing";
import type { Category, Service } from "@/data/services";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/admin-auth";
import { saveAll, type Overrides, type StoredCatalogue } from "@/lib/live-data";

export type LoginState = { error?: string };

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const attempt = String(form.get("password") ?? "");
  if (!checkPassword(attempt)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "That password isn't right." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

const BASES: PriceBasis[] = ["fixed", "from", "addon", "quote"];
const GST: GstTreatment[] = ["excl", "unconfirmed"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const lines = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, n) : []);

export type SaveResult = { ok: boolean; message: string };
export type SavePayload = { catalogue: StoredCatalogue; edits: Record<string, PriceOverride> };

function invalid(message: string): never {
  throw Object.assign(new Error(message), { invalid: true });
}

function cleanPrice(id: string, p: Partial<PriceItem>): PriceItem {
  const label = str(p.label, 80);
  if (!label) invalid(`A price line (${id}) has no label.`);
  const basis = BASES.includes(p.basis as PriceBasis) ? (p.basis as PriceBasis) : "fixed";
  const unit = PRICE_UNITS.includes(p.unit as PriceUnit) ? (p.unit as PriceUnit) : "job";
  let amount: number | null = p.amount === null || p.amount === undefined || (p.amount as unknown) === "" ? null : Number(p.amount);
  if (basis === "quote") amount = null;
  else if (amount === null || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000) invalid(`"${label}" needs a price between $0 and $1,000,000 (or set it to "Quote only").`);
  return {
    id,
    label,
    amount: amount === null ? null : Math.round(amount * 100) / 100,
    unit,
    basis,
    gst: GST.includes(p.gst as GstTreatment) ? (p.gst as GstTreatment) : "unconfirmed",
    quantifiable: PER_UNITS_QTY.includes(unit),
    ...(str(p.note, 120) ? { note: str(p.note, 120) } : {}),
  };
}

/** Validates the whole catalogue and price edits, then saves them. */
export async function saveSite({ catalogue, edits }: SavePayload): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, message: "Your session has expired. Please sign in again." };
  try {
    // Categories
    const catIds = new Set<string>();
    const categories: Category[] = (catalogue.categories ?? []).slice(0, 40).map((c) => {
      const id = str(c.id, 40);
      const name = str(c.name, 40);
      if (!SLUG.test(id) || catIds.has(id)) invalid(`Category "${name || id}" needs a unique ID (lowercase letters, numbers and dashes).`);
      if (!name) invalid("Every category needs a name.");
      catIds.add(id);
      return { id, name, blurb: str(c.blurb, 160), ...(c.hidden ? { hidden: true } : {}) };
    });
    if (!categories.length) invalid("Keep at least one category.");

    // Services
    const slugs = new Set<string>();
    const services: Service[] = (catalogue.services ?? []).slice(0, 200).map((s) => {
      const name = str(s.name, 60);
      const slug = str(s.slug, 60);
      if (!name) invalid("Every service needs a name.");
      if (!SLUG.test(slug) || slugs.has(slug)) invalid(`"${name}" needs a unique web address (lowercase letters, numbers and dashes).`);
      slugs.add(slug);
      const cats = (s.categories ?? []).filter((c) => catIds.has(c));
      if (!cats.length) invalid(`"${name}" needs at least one category.`);
      return {
        slug,
        name,
        categories: [...new Set(cats)],
        summary: str(s.summary, 220),
        description: str(s.description, 1500),
        includes: lines(s.includes, 15, 160),
        considerations: lines(s.considerations, 15, 200),
        priceIds: [...new Set((s.priceIds ?? []).map(String))].slice(0, 20),
        keywords: lines(s.keywords, 12, 40),
        ...(s.featured ? { featured: true } : {}),
        ...(s.hidden ? { hidden: true } : {}),
      };
    });

    // Custom price lines (only those still used by a service)
    const used = new Set(services.flatMap((s) => s.priceIds));
    const prices: Record<string, PriceItem> = {};
    for (const [id, p] of Object.entries(catalogue.prices ?? {})) {
      if (!used.has(id) || id in DEFAULT_PRICES) continue;
      if (!SLUG.test(id) || id.length > 70) invalid(`Price line ID "${id}" is not valid.`);
      prices[id] = cleanPrice(id, p);
    }
    for (const s of services) s.priceIds = s.priceIds.filter((id) => id in DEFAULT_PRICES || id in prices);

    // Price edits, stored only where they differ from the base line
    const overrides: Overrides = {};
    for (const [id, e] of Object.entries(edits ?? {})) {
      const base = prices[id] ?? DEFAULT_PRICES[id];
      if (!base || !used.has(id)) continue;
      const next = cleanPrice(id, { ...base, ...e, unit: base.unit });
      const diff: PriceOverride = {};
      if (next.label !== base.label) diff.label = next.label;
      if (next.amount !== base.amount) diff.amount = next.amount;
      if (next.basis !== base.basis) diff.basis = next.basis;
      if (next.gst !== base.gst) diff.gst = next.gst;
      if ((next.note ?? "") !== (base.note ?? "")) diff.note = next.note ?? ""; // "" clears a default note
      if (Object.keys(diff).length) overrides[id] = diff;
    }

    await saveAll(overrides, { categories, services, prices });
    const hidden = services.filter((s) => s.hidden).length;
    return { ok: true, message: `Saved: ${services.length - hidden} services live${hidden ? `, ${hidden} hidden` : ""}, ${categories.length} categories. The website updates within a few seconds.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not save." };
  }
}

/** Updates an enquiry's status (new / contacted / booked / closed). Saved immediately. */
export async function updateEnquiryStatus(reference: string, status: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { STATUSES, setEnquiryStatus } = await import("@/lib/enquiries");
  if (!STATUSES.includes(status as (typeof STATUSES)[number]) || !/^CR-[A-Z0-9]{1,12}$/.test(reference)) return { ok: false, message: "Invalid update." };
  try {
    await setEnquiryStatus(reference, status as (typeof STATUSES)[number]);
    return { ok: true, message: "Status updated." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not update." };
  }
}
