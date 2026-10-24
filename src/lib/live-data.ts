import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { mergePrices, setPriceTable, type PriceItem, type PriceOverride, type PriceTable } from "@/data/pricing";
import { DEFAULT_CATALOGUE, setCatalogue, visibleCatalogue, type Catalogue } from "@/data/services";

/**
 * Live site data edited in /admin, stored in Supabase (table `site_settings`,
 * see supabase/001_site_settings.sql):
 *
 *   pricing_overrides – edits to price lines, on top of src/data/pricing.ts
 *   catalogue         – the full category + service list (with hidden flags)
 *                       and any custom price lines for added services
 *
 * Pages stay static and fast; saving in /admin clears the cache so every page
 * re-renders. If Supabase can't be reached the built-in defaults are used.
 *
 * Env: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (public) and SUPABASE_SECRET_KEY
 * (server only; needed to save, and to read the catalogue row).
 */

const URL = process.env.SUPABASE_URL ?? "https://xmiojutokjwizlhsoret.supabase.co";
const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_C4-lMZJxabTIsV-vt1gVPw_phwUpjNP";
const TAG = "site-data";

export type Overrides = Partial<Record<string, PriceOverride>>;
export interface StoredCatalogue extends Catalogue {
  /** Price lines created for added services. */
  prices: Record<string, PriceItem>;
}

export const storageConnected = () => Boolean(process.env.SUPABASE_SECRET_KEY);

async function readRow<T>(key: string): Promise<T | null> {
  const res = await fetch(`${URL}/rest/v1/site_settings?key=eq.${key}&select=value`, {
    headers: { apikey: process.env.SUPABASE_SECRET_KEY ?? PUBLISHABLE, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as { value: T }[];
  return rows[0]?.value ?? null;
}

const readAll = unstable_cache(
  async (): Promise<{ overrides: Overrides; catalogue: StoredCatalogue | null }> => {
    try {
      const [overrides, catalogue] = await Promise.all([readRow<Overrides>("pricing_overrides"), readRow<StoredCatalogue>("catalogue")]);
      const valid = catalogue && Array.isArray(catalogue.categories) && Array.isArray(catalogue.services) && catalogue.categories.length > 0;
      return { overrides: overrides ?? {}, catalogue: valid ? { ...catalogue, prices: catalogue.prices ?? {} } : null };
    } catch (e) {
      console.error("[site-data] could not read from Supabase, using defaults", e);
      return { overrides: {}, catalogue: null };
    }
  },
  ["site-data-v1"],
  { tags: [TAG], revalidate: 300 },
);

/** Everything the admin area edits: price overrides plus the full catalogue (including hidden items). */
export async function getAdminData() {
  const { overrides, catalogue } = await readAll();
  return { overrides, catalogue: catalogue ?? { ...DEFAULT_CATALOGUE, prices: {} } };
}

/**
 * Loads the live catalogue and price table and installs them for this render.
 * Call at the top of any server page, layout or route that shows services or prices.
 */
export async function syncLive(): Promise<{ table: PriceTable; catalogue: Catalogue }> {
  const { overrides, catalogue } = await readAll();
  const cat = catalogue ?? { ...DEFAULT_CATALOGUE, prices: {} };
  setCatalogue(cat);
  const table = mergePrices(overrides, cat.prices);
  setPriceTable(table);
  return { table, catalogue: visibleCatalogue(cat) };
}

async function writeRow(key: string, value: unknown) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Saving isn't switched on (SUPABASE_SECRET_KEY is missing).");
  const res = await fetch(`${URL}/rest/v1/site_settings?on_conflict=key`, {
    method: "POST",
    headers: { apikey: secret, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Could not save to Supabase (${res.status}). ${(await res.text()).slice(0, 200)}`);
}

export async function saveAll(overrides: Overrides, catalogue: StoredCatalogue) {
  await writeRow("catalogue", catalogue);
  await writeRow("pricing_overrides", overrides);
  revalidateTag(TAG);
  revalidatePath("/", "layout");
}
