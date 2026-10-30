/**
 * SINGLE SOURCE OF TRUTH FOR ALL PRICES.
 *
 * Every page, the estimator and structured data read prices through
 * `getPrice()`. Never hardcode a price anywhere else.
 *
 * `PRICES` below are the built-in defaults. Edits made in the admin area
 * (/admin) are stored in Supabase and laid over these defaults at request time
 * (see src/lib/live-data.ts), so the live site can differ from this file.
 *
 * Figures are 0800 Cleaning & Restoration's own indicative rates, informed by
 * NZ market research (Oct 2026) and individually adjusted. They are NOT
 * verified offers – every figure must be confirmed by the business before launch.
 *
 * `uncertain` marks figures whose structure still needs a business decision.
 * They are shown publicly with the same "indicative" label as everything else,
 * but must be resolved before go-live (search this file for `uncertain:`).
 */

export const CURRENCY = "NZD" as const;

/** Date the reference figures were collected. Shown in the pricing disclaimer. */
export const PRICES_REVIEWED = "2026-10-20";

export type PriceUnit =
  | "visit"
  | "hour"
  | "job"
  | "item"
  | "seat"
  | "pair"
  | "blind"
  | "m2"
  | "step"
  | "night"
  | "property";

/**
 * fixed  – a set indicative price for the stated unit
 * from   – a starting price; final price depends on scope
 * addon  – charged on top of a base service
 * quote  – no published price; always quoted after assessment
 */
export type PriceBasis = "fixed" | "from" | "addon" | "quote";

/**
 * excl        – the source explicitly stated "plus GST"
 * unconfirmed – the source did not state GST treatment; confirm before launch
 */
export type GstTreatment = "excl" | "unconfirmed";

export interface PriceItem {
  id: string;
  label: string;
  /** NZD. `null` only when basis is "quote" – never invent a figure. */
  amount: number | null;
  unit: PriceUnit;
  basis: PriceBasis;
  gst: GstTreatment;
  /** Can a visitor enter a quantity for this line in the estimator? */
  quantifiable?: boolean;
  /** Short public-facing qualifier, e.g. "Up to 50 m²". */
  note?: string;
  /** Internal: why this figure needs confirming. Never rendered. */
  uncertain?: string;
}

const p = (item: PriceItem) => item;

export const PRICES = {
  /* ───────────────────────── GENERAL CLEANING ───────────────────────── */
  generalMinimum: p({
    id: "generalMinimum",
    label: "Home Refresh – minimum visit",
    amount: 272,
    unit: "visit",
    basis: "from",
    gst: "excl",
    uncertain: "The minimum visit sits above the 'from' prices for Move-Out Detail and Top-to-Bottom Reset. Confirm which minimum applies to which service.",
  }),
  hourly1: p({ id: "hourly1", label: "One specialist", amount: 63, unit: "hour", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  hourly2: p({
    id: "hourly2",
    label: "Team of two",
    amount: 124,
    unit: "hour",
    basis: "fixed",
    gst: "unconfirmed",
    quantifiable: true,
    uncertain: "Team rates are not exact multiples of the single-specialist rate. Confirm intended team pricing.",
  }),
  hourly3: p({
    id: "hourly3",
    label: "Team of three",
    amount: 184,
    unit: "hour",
    basis: "fixed",
    gst: "unconfirmed",
    quantifiable: true,
    uncertain: "See hourly2.",
  }),
  hourly4: p({
    id: "hourly4",
    label: "Team of four",
    amount: 245,
    unit: "hour",
    basis: "fixed",
    gst: "unconfirmed",
    quantifiable: true,
    uncertain: "See hourly2.",
  }),
  callOut: p({ id: "callOut", label: "Visit fee", amount: 86, unit: "job", basis: "fixed", gst: "unconfirmed" }),
  endOfTenancy: p({ id: "endOfTenancy", label: "Move-Out Detail", amount: 189, unit: "job", basis: "from", gst: "unconfirmed", uncertain: "See generalMinimum." }),
  deepClean: p({ id: "deepClean", label: "Top-to-Bottom Reset", amount: 184, unit: "job", basis: "from", gst: "unconfirmed", uncertain: "See generalMinimum." }),
  builders: p({ id: "builders", label: "Post-Build Detail", amount: 309, unit: "job", basis: "from", gst: "unconfirmed" }),
  oven: p({ id: "oven", label: "Oven Revive", amount: 107, unit: "item", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  commercial: p({ id: "commercial", label: "Workplace visit", amount: 168, unit: "visit", basis: "from", gst: "unconfirmed" }),

  /* ─────────────────────── CARPET & UPHOLSTERY ─────────────────────── */
  carpetResidential: p({ id: "carpetResidential", label: "Carpet Deep Refresh", amount: 195, unit: "job", basis: "from", gst: "unconfirmed" }),
  carpetCommercialStd: p({ id: "carpetCommercialStd", label: "Workplace carpet – maintenance", amount: 4, unit: "m2", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  carpetCommercialHeavy: p({ id: "carpetCommercialHeavy", label: "Workplace carpet – restorative", amount: 7, unit: "m2", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  upholsterySeat: p({ id: "upholsterySeat", label: "Per seat", amount: 41, unit: "seat", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  sofaFiveSeats: p({
    id: "sofaFiveSeats",
    label: "Lounge suite – up to 5 seats",
    amount: 196,
    unit: "item",
    basis: "fixed",
    gst: "unconfirmed",
    quantifiable: true,
    uncertain: "Package price is slightly below 5 × per-seat. Shown as separate lines; don't combine with the per-seat rate.",
  }),
  armchair: p({ id: "armchair", label: "Armchair", amount: 35, unit: "item", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  mattress: p({ id: "mattress", label: "Mattress", amount: 97, unit: "item", basis: "from", gst: "unconfirmed", quantifiable: true }),
  cushion: p({ id: "cushion", label: "Cushion", amount: 18, unit: "item", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  rug: p({ id: "rug", label: "Rug", amount: 68, unit: "item", basis: "from", gst: "unconfirmed", quantifiable: true }),

  /* ───────────────────────── CURTAINS & BLINDS ───────────────────────── */
  curtainSmall: p({ id: "curtainSmall", label: "Petite pair", amount: 46, unit: "pair", basis: "from", gst: "unconfirmed", quantifiable: true }),
  curtainMedium: p({ id: "curtainMedium", label: "Classic pair", amount: 64, unit: "pair", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  curtainLarge: p({ id: "curtainLarge", label: "Generous pair", amount: 91, unit: "pair", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  curtainXL: p({ id: "curtainXL", label: "Grand pair", amount: 134, unit: "pair", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  curtainLining: p({ id: "curtainLining", label: "Lined fabric", amount: 24, unit: "pair", basis: "addon", gst: "unconfirmed", quantifiable: true }),
  curtainMould: p({ id: "curtainMould", label: "Mould Defence", amount: 19, unit: "pair", basis: "addon", gst: "unconfirmed", quantifiable: true }),
  blind: p({ id: "blind", label: "Per blind", amount: 35, unit: "blind", basis: "from", gst: "unconfirmed", quantifiable: true }),

  /* ───────────────────────────── FLOOR CARE ───────────────────────────── */
  floorSanding: p({
    id: "floorSanding",
    label: "Timber Floor Restore",
    amount: 74,
    unit: "m2",
    basis: "fixed",
    gst: "unconfirmed",
    quantifiable: true,
    uncertain: "Confirm whether this rate includes the finish coats and any minimum charge.",
  }),
  stairSanding: p({ id: "stairSanding", label: "Per stair", amount: 135, unit: "step", basis: "fixed", gst: "unconfirmed", quantifiable: true }),

  /* ───────────────────────── EXTERIOR & WINDOWS ───────────────────────── */
  houseWash1br: p({ id: "houseWash1br", label: "Studio / 1-bed", amount: 218, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  houseWashSmall: p({ id: "houseWashSmall", label: "Compact home", amount: 327, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  houseWashMedium: p({ id: "houseWashMedium", label: "Family home", amount: 497, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  houseWashLarge: p({ id: "houseWashLarge", label: "Large home", amount: 656, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  window12: p({ id: "window12", label: "Up to 2 bedrooms", amount: 166, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  window34: p({ id: "window34", label: "3–4 bedrooms", amount: 277, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  window56: p({ id: "window56", label: "5–6 bedrooms", amount: 436, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  window78: p({ id: "window78", label: "7–8 bedrooms", amount: 607, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  solar: p({ id: "solar", label: "Solar panel cleaning", amount: null, unit: "job", basis: "quote", gst: "unconfirmed" }),

  /* ──────────────────────────── METH TESTING ──────────────────────────── */
  meth13: p({ id: "meth13", label: "Up to 3 rooms", amount: 221, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  meth46: p({ id: "meth46", label: "4–6 rooms", amount: 349, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  meth79: p({ id: "meth79", label: "7–9 rooms", amount: 486, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  meth1012: p({ id: "meth1012", label: "10–12 rooms", amount: 618, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  methExpress: p({ id: "methExpress", label: "Priority 2-day results", amount: 68, unit: "job", basis: "addon", gst: "unconfirmed" }),

  /* ──────────────────────────── RESTORATION ──────────────────────────── */
  flood: p({ id: "flood", label: "Water Damage Recovery", amount: 333, unit: "job", basis: "from", gst: "unconfirmed" }),
  fire: p({ id: "fire", label: "Fire & Smoke Recovery", amount: 855, unit: "job", basis: "from", gst: "unconfirmed" }),
  drying: p({ id: "drying", label: "Dryer or dehumidifier", amount: 45, unit: "night", basis: "from", gst: "unconfirmed", quantifiable: true }),
  disinfection: p({ id: "disinfection", label: "Sanitise & Disinfect", amount: 167, unit: "job", basis: "fixed", gst: "unconfirmed", note: "Up to 50 m²" }),

  /* ────────────────────────────── PAINTING ────────────────────────────── */
  paintInterior: p({ id: "paintInterior", label: "Interior Repaint – two coats", amount: 37, unit: "m2", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  paintUndercoat: p({ id: "paintUndercoat", label: "Prime & Undercoat", amount: 19, unit: "m2", basis: "fixed", gst: "unconfirmed", quantifiable: true }),
  paintExt1br: p({ id: "paintExt1br", label: "Studio / 1-bed", amount: 2452, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  paintExtSmall: p({ id: "paintExtSmall", label: "Compact home", amount: 3497, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  paintExtMedium: p({ id: "paintExtMedium", label: "Family home", amount: 4853, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  paintExtLarge: p({ id: "paintExtLarge", label: "Large home", amount: 7148, unit: "property", basis: "fixed", gst: "unconfirmed" }),
  paintExtXL: p({ id: "paintExtXL", label: "Estate home", amount: 7997, unit: "property", basis: "fixed", gst: "unconfirmed" }),
} as const satisfies Record<string, PriceItem>;

/** Built-in price IDs. Custom price lines added in /admin use other string IDs. */
export type DefaultPriceId = keyof typeof PRICES;
export type PriceId = string;

export const DEFAULT_PRICES: Record<string, PriceItem> = PRICES;

/** Fields the admin area may change. Units and IDs stay fixed in code. */
export type PriceOverride = Partial<Pick<PriceItem, "label" | "amount" | "basis" | "gst" | "note">>;
export type PriceTable = Record<PriceId, PriceItem>;

let current: PriceTable = { ...PRICES };

/** Applies admin overrides on top of the defaults plus any custom price lines. */
export function mergePrices(overrides: Partial<Record<string, PriceOverride>>, custom: Record<string, PriceItem> = {}): PriceTable {
  const out: PriceTable = { ...DEFAULT_PRICES, ...custom };
  for (const [id, o] of Object.entries(overrides)) {
    if (o && out[id]) out[id] = { ...out[id], ...o } as PriceItem;
  }
  return out;
}

export const hasPrice = (id: string) => Boolean(current[id]);

/** Installs the live price table (server: per render; browser: from the layout). */
export function setPriceTable(table: PriceTable) {
  current = table;
}

const MISSING: PriceItem = { id: "missing", label: "Price on request", amount: null, unit: "job", basis: "quote", gst: "unconfirmed" };
export const getPrice = (id: PriceId): PriceItem => current[id] ?? { ...MISSING, id };

const UNIT_LABEL: Record<PriceUnit, string> = {
  visit: "visit",
  hour: "hour",
  job: "job",
  item: "item",
  seat: "seat",
  pair: "pair",
  blind: "blind",
  m2: "m²",
  step: "step",
  night: "night",
  property: "property",
};

/** Units that read naturally as "per …" after the price. */
const PER_UNITS: PriceUnit[] = ["hour", "seat", "pair", "blind", "m2", "step", "night"];

export const unitLabel = (u: PriceUnit) => UNIT_LABEL[u];
export const PRICE_UNITS = Object.keys(UNIT_LABEL) as PriceUnit[];
/** Units a visitor can enter a quantity for in the estimator. */
export const PER_UNITS_QTY: PriceUnit[] = ["hour", "item", "seat", "pair", "blind", "m2", "step", "night"];

const nzd = new Intl.NumberFormat("en-NZ", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });
export const formatNZD = (n: number) => nzd.format(n);

/** e.g. "From $44 / pair", "+$22 / pair", "$215", "Quote required" */
export function formatPrice(item: PriceItem): string {
  if (item.basis === "quote" || item.amount === null) return "Quote required";
  const amount = formatNZD(item.amount);
  const per = PER_UNITS.includes(item.unit) ? ` / ${UNIT_LABEL[item.unit]}` : "";
  const gst = item.gst === "excl" ? " + GST" : "";
  if (item.basis === "from") return `From ${amount}${per}${gst}`;
  if (item.basis === "addon") return `+${amount}${per}${gst}`;
  return `${amount}${per}${gst}`;
}

/** Lowest published amount among a set of price IDs, for "from" badges. */
export function startingPrice(ids: readonly PriceId[]): PriceItem | null {
  const priced = ids.map(getPrice).filter((i) => i.amount !== null && i.basis !== "addon");
  if (!priced.length) return null;
  return priced.reduce((a, b) => ((a.amount ?? Infinity) <= (b.amount ?? Infinity) ? a : b));
}

export const PRICING_DISCLAIMER =
  "All prices are indicative, in New Zealand dollars, and subject to confirmation after we understand your property, access, condition and location. GST treatment is shown where confirmed. Quote-only services are priced after assessment.";
