"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { formatPrice, PRICE_UNITS, unitLabel, type GstTreatment, type PriceBasis, type PriceItem, type PriceOverride, type PriceUnit } from "@/data/pricing";
import type { Category, Service } from "@/data/services";
import type { StoredCatalogue } from "@/lib/live-data";
import type { StoredEnquiry } from "@/lib/enquiries";
import { saveSite, type SaveResult } from "./actions";
import { Enquiries } from "./Enquiries";

/* ─────────────────────────── State ─────────────────────────── */

type Row = { label: string; amount: string; basis: PriceBasis; gst: GstTreatment; note: string };
/** _home: the list section a service is shown under while editing (only updated on save, so rows don't jump). */
type EditService = Service & { _key: string; _home: string; _new?: boolean; _slugTouched?: boolean };
type State = { categories: Category[]; services: EditService[]; prices: Record<string, PriceItem>; rows: Record<string, Row> };

const BASIS_LABEL: Record<PriceBasis, string> = { fixed: "Fixed", from: "From", addon: "Add-on", quote: "Quote only" };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
const toRow = (p: PriceItem): Row => ({ label: p.label, amount: p.amount === null ? "" : String(p.amount), basis: p.basis, gst: p.gst, note: p.note ?? "" });
const rowToOverride = (r: Row): PriceOverride => ({ label: r.label, amount: r.basis === "quote" || r.amount === "" ? null : Number(r.amount), basis: r.basis, gst: r.gst, note: r.note });
const uid = () => Math.random().toString(36).slice(2, 7);

const input = "w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-forest";
const lbl = "block text-xs font-semibold text-charcoal/60";

export function AdminApp({
  defaults,
  overrides,
  catalogue,
  canSave,
  enquiries,
  enquiryError,
}: {
  defaults: Record<string, PriceItem>;
  overrides: Partial<Record<string, PriceOverride>>;
  catalogue: StoredCatalogue;
  canSave: boolean;
  enquiries: StoredEnquiry[];
  enquiryError?: string;
}) {
  const initial = useMemo<State>(() => {
    const prices = catalogue.prices ?? {};
    const all = { ...defaults, ...prices };
    const rows = Object.fromEntries(Object.entries(all).map(([id, p]) => [id, toRow({ ...p, ...overrides[id] } as PriceItem)]));
    return {
      categories: catalogue.categories,
      services: catalogue.services.map((s) => ({ ...s, _key: s.slug, _home: s.categories[0] ?? "" })),
      prices,
      rows,
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [state, setState] = useState<State>(initial);
  const [saved, setSaved] = useState<State>(initial);
  const [tab, setTab] = useState<"enquiries" | "services" | "categories" | "prices">("enquiries");
  const newCount = enquiries.filter((e) => e.status === "new").length;
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(state) !== JSON.stringify(saved);
  const update = (fn: (s: State) => State) => {
    setResult(null);
    setState(fn);
  };
  const priceOf = (id: string): PriceItem | undefined => state.prices[id] ?? defaults[id];

  /* ── services ── */
  const setService = (key: string, patch: Partial<EditService>) => update((s) => ({ ...s, services: s.services.map((x) => (x._key === key ? { ...x, ...patch } : x)) }));
  const addService = () => {
    const key = `new-${uid()}`;
    const first = state.categories.find((c) => !c.hidden) ?? state.categories[0];
    update((s) => ({
      ...s,
      services: [{ _key: key, _home: "__new", _new: true, slug: "", name: "", categories: first ? [first.id] : [], summary: "", description: "", includes: [], considerations: [], priceIds: [], keywords: [] }, ...s.services],
    }));
    setTab("services");
    setOpen(key);
  };
  const deleteService = (sv: EditService) => {
    if (!confirm(`Delete "${sv.name || "this service"}"? Its page and listings will be removed when you save. (Tip: use Hide if you might want it back.)`)) return;
    update((s) => ({ ...s, services: s.services.filter((x) => x._key !== sv._key) }));
  };
  const addPriceLine = (sv: EditService, line: { label: string; amount: string; unit: PriceUnit; basis: PriceBasis }) => {
    const base = slugify(sv.slug || sv.name) || "service";
    let id = `${base}-${uid()}`;
    while (priceOf(id)) id = `${base}-${uid()}`;
    const item: PriceItem = { id, label: line.label.trim(), amount: line.basis === "quote" || line.amount === "" ? null : Number(line.amount), unit: line.unit, basis: line.basis, gst: "unconfirmed" };
    update((s) => ({
      ...s,
      prices: { ...s.prices, [id]: item },
      rows: { ...s.rows, [id]: toRow(item) },
      services: s.services.map((x) => (x._key === sv._key ? { ...x, priceIds: [...x.priceIds, id] } : x)),
    }));
  };

  /* ── categories ── */
  const setCategory = (id: string, patch: Partial<Category>) => update((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const moveCategory = (i: number, d: -1 | 1) =>
    update((s) => {
      const c = [...s.categories];
      const j = i + d;
      if (j < 0 || j >= c.length) return s;
      [c[i], c[j]] = [c[j], c[i]];
      return { ...s, categories: c };
    });
  const addCategory = (name: string, blurb: string) => {
    let id = slugify(name) || `category-${uid()}`;
    while (state.categories.some((c) => c.id === id)) id = `${slugify(name)}-${uid()}`;
    update((s) => ({ ...s, categories: [...s.categories, { id, name: name.trim(), blurb: blurb.trim() }] }));
  };
  const deleteCategory = (cat: Category) => {
    const only = state.services.filter((x) => x.categories.length === 1 && x.categories[0] === cat.id).length;
    if (state.categories.length <= 1) return alert("Keep at least one category.");
    if (!confirm(`Delete the "${cat.name}" category?${only ? ` ${only} service${only > 1 ? "s are" : " is"} only in this category and will need a new category before you can save.` : ""}`)) return;
    update((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== cat.id), services: s.services.map((x) => ({ ...x, categories: x.categories.filter((id) => id !== cat.id) })) }));
  };

  /* ── save ── */
  const problems = useMemo(() => {
    const out: string[] = [];
    const slugs = new Set<string>();
    for (const s of state.services) {
      if (!s.name.trim()) out.push("A service has no name.");
      else if (!SLUG.test(s.slug)) out.push(`"${s.name}" needs a web address (lowercase letters, numbers and dashes).`);
      else if (slugs.has(s.slug)) out.push(`Two services use the web address "${s.slug}".`);
      if (!s.categories.length) out.push(`"${s.name || "A service"}" needs a category.`);
      slugs.add(s.slug);
    }
    for (const c of state.categories) if (!c.name.trim()) out.push("A category has no name.");
    return out;
  }, [state]);

  const save = () => {
    if (problems.length) return setResult({ ok: false, message: problems[0] });
    start(async () => {
      const services = state.services.map(({ _key, _home, _new, _slugTouched, ...s }) => s); // eslint-disable-line @typescript-eslint/no-unused-vars
      const edits = Object.fromEntries(Object.entries(state.rows).map(([id, r]) => [id, rowToOverride(r)]));
      const res = await saveSite({ catalogue: { categories: state.categories, services, prices: state.prices }, edits });
      setResult(res);
      if (res.ok) {
        const next = { ...state, services: state.services.map((s) => ({ ...s, _new: false, _home: s.categories[0] ?? "" })) };
        setState(next);
        setSaved(next);
      }
    });
  };

  const catName = (id: string) => state.categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="mt-8">
      {/* Save bar */}
      <div className="sticky top-20 z-20 -mx-2 mb-6 rounded-2xl bg-ivory/95 px-4 py-3 shadow-sm ring-1 ring-charcoal/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-charcoal/10" role="tablist">
            {(["enquiries", "services", "categories", "prices"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${tab === t ? "bg-forest text-ivory" : "text-forest/70 hover:text-forest"}`}>
                {t}
                {t === "enquiries" && newCount > 0 && <span className="ml-1.5 rounded-full bg-brass px-1.5 py-0.5 text-[0.7rem] text-white">{newCount}</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-charcoal/70" aria-live="polite">
              {result ? <span className={result.ok ? "text-forest" : "text-red-700"}>{result.message}</span> : dirty ? "Unsaved changes" : "All changes saved"}
            </p>
            <button type="button" className="btn-ghost !py-2.5 text-sm" disabled={!dirty || pending} onClick={() => (setState(saved), setResult(null))}>
              Discard
            </button>
            <button type="button" className="btn-primary !py-2.5 text-sm disabled:opacity-50" disabled={!dirty || pending || !canSave} onClick={save}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {tab === "enquiries" && <Enquiries items={enquiries} error={enquiryError} />}

      {tab === "services" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-charcoal/60">
              {state.services.length} services · {state.services.filter((s) => s.hidden).length} hidden
            </p>
            <button type="button" className="btn-primary !py-2.5 text-sm" onClick={addService}>
              <Plus className="size-4" aria-hidden /> Add service
            </button>
          </div>
          <div className="space-y-6">
            {[{ id: "__new", name: "New services (not saved yet)" }, ...state.categories.map((c) => ({ id: c.id, name: c.name }))].map((c) => {
              const known = new Set(["__new", ...state.categories.map((x) => x.id)]);
              const list = state.services.filter((s) => s._home === c.id || (c.id === "__new" && !known.has(s._home)));
              if (!list.length) return null;
              return (
                <section key={c.id || "none"}>
                  <p className="eyebrow mb-2">{c.name}</p>
                  <div className="divide-y divide-charcoal/10 rounded-[18px] bg-white ring-1 ring-charcoal/5">
                    {list.map((sv) => (
                      <div key={sv._key} className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold ${sv.hidden ? "text-charcoal/40 line-through" : "text-forest"}`}>{sv.name || "New service"}</p>
                            <p className="text-xs text-charcoal/50">/services/{sv.slug || "…"}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sv.hidden ? "bg-charcoal/10 text-charcoal/60" : "bg-forest/10 text-forest"}`}>{sv.hidden ? "Hidden" : "Visible"}</span>
                          <button type="button" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-forest ring-1 ring-forest/20 hover:bg-forest/5" onClick={() => setService(sv._key, { hidden: !sv.hidden })}>
                            {sv.hidden ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />} {sv.hidden ? "Show" : "Hide"}
                          </button>
                          <button type="button" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-forest ring-1 ring-forest/20 hover:bg-forest/5" onClick={() => setOpen(open === sv._key ? null : sv._key)}>
                            <Pencil className="size-4" aria-hidden /> {open === sv._key ? "Close" : "Edit"}
                          </button>
                          <button type="button" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-red-700 ring-1 ring-red-700/20 hover:bg-red-50" onClick={() => deleteService(sv)}>
                            <Trash2 className="size-4" aria-hidden /> Delete
                          </button>
                        </div>
                        {open === sv._key && <ServiceForm sv={sv} state={state} setService={setService} addPriceLine={addPriceLine} priceOf={priceOf} catName={catName} />}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {tab === "categories" && <Categories state={state} setCategory={setCategory} moveCategory={moveCategory} addCategory={addCategory} deleteCategory={deleteCategory} />}

      {tab === "prices" && <Prices state={state} update={update} priceOf={priceOf} defaults={defaults} />}
    </div>
  );
}

/* ─────────────────────────── Service editor ─────────────────────────── */

function ServiceForm({
  sv,
  state,
  setService,
  addPriceLine,
  priceOf,
  catName,
}: {
  sv: EditService;
  state: State;
  setService: (key: string, patch: Partial<EditService>) => void;
  addPriceLine: (sv: EditService, line: { label: string; amount: string; unit: PriceUnit; basis: PriceBasis }) => void;
  priceOf: (id: string) => PriceItem | undefined;
  catName: (id: string) => string;
}) {
  const [line, setLine] = useState({ label: "", amount: "", unit: "job" as PriceUnit, basis: "from" as PriceBasis });
  const [link, setLink] = useState("");
  const set = (patch: Partial<EditService>) => setService(sv._key, patch);
  const linkable = Object.keys(state.rows).filter((id) => !sv.priceIds.includes(id) && state.services.some((s) => s.priceIds.includes(id)));

  return (
    <div className="mt-4 grid gap-4 rounded-xl bg-ivory/60 p-4 md:grid-cols-2">
      <label className={lbl}>
        Name
        <input className={input} value={sv.name} maxLength={60} onChange={(e) => set({ name: e.target.value, ...(sv._new && !sv._slugTouched ? { slug: slugify(e.target.value) } : {}) })} />
      </label>
      <label className={lbl}>
        Web address {sv._new ? "" : "(fixed for existing services)"}
        <div className="flex items-center gap-1 text-sm text-charcoal/50">
          /services/
          <input className={input} value={sv.slug} maxLength={60} disabled={!sv._new} onChange={(e) => set({ slug: slugify(e.target.value), _slugTouched: true })} />
        </div>
      </label>
      <fieldset className="md:col-span-2">
        <legend className={lbl}>Categories</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {state.categories.map((c) => {
            const on = sv.categories.includes(c.id);
            return (
              <label key={c.id} className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ${on ? "bg-forest text-ivory ring-forest" : "bg-white text-charcoal/70 ring-charcoal/15"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => set({ categories: on ? sv.categories.filter((x) => x !== c.id) : [...sv.categories, c.id] })} />
                {catName(c.id)}
                {c.hidden ? " (hidden)" : ""}
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className={`${lbl} md:col-span-2`}>
        Summary (one sentence, shown on cards)
        <input className={input} value={sv.summary} maxLength={220} onChange={(e) => set({ summary: e.target.value })} />
      </label>
      <label className={`${lbl} md:col-span-2`}>
        Description
        <textarea className={`${input} min-h-[90px]`} value={sv.description} maxLength={1500} onChange={(e) => set({ description: e.target.value })} />
      </label>
      <label className={lbl}>
        What&apos;s included (one per line)
        <textarea className={`${input} min-h-[110px]`} value={sv.includes.join("\n")} onChange={(e) => set({ includes: e.target.value.split("\n") })} />
      </label>
      <label className={lbl}>
        Good to know (one per line)
        <textarea className={`${input} min-h-[110px]`} value={sv.considerations.join("\n")} onChange={(e) => set({ considerations: e.target.value.split("\n") })} />
      </label>
      <label className={lbl}>
        Search keywords (comma separated)
        <input className={input} value={sv.keywords.join(", ")} onChange={(e) => set({ keywords: e.target.value.split(",").map((x) => x.trim()) })} />
      </label>
      <label className="flex items-center gap-2 self-end text-sm text-charcoal/80">
        <input type="checkbox" checked={Boolean(sv.featured)} onChange={(e) => set({ featured: e.target.checked })} /> Featured on the home page
      </label>

      <div className="md:col-span-2">
        <p className={lbl}>Prices for this service</p>
        <ul className="mt-2 space-y-1.5">
          {sv.priceIds.length === 0 && <li className="text-sm text-charcoal/50">No prices yet – the service shows &quot;Quote required&quot;.</li>}
          {sv.priceIds.map((id) => {
            const p = priceOf(id);
            const r = state.rows[id];
            return (
              <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-charcoal/10">
                <span>
                  {r?.label ?? p?.label ?? id} · <strong className="text-forest">{p && r ? formatPrice({ ...p, basis: r.basis, gst: r.gst, amount: r.basis === "quote" || r.amount === "" ? null : Number(r.amount) }) : "—"}</strong>
                </span>
                <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => set({ priceIds: sv.priceIds.filter((x) => x !== id) })}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-charcoal/50">Change amounts any time in the Prices tab.</p>

        <div className="mt-3 grid gap-2 rounded-lg bg-white p-3 ring-1 ring-charcoal/10 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
          <label className={lbl}>
            New price line
            <input className={input} placeholder="e.g. Up to 3 rooms" value={line.label} onChange={(e) => setLine({ ...line, label: e.target.value })} />
          </label>
          <label className={lbl}>
            Price (NZD)
            <input className={input} type="number" min={0} disabled={line.basis === "quote"} value={line.amount} onChange={(e) => setLine({ ...line, amount: e.target.value })} />
          </label>
          <label className={lbl}>
            Per
            <select className={input} value={line.unit} onChange={(e) => setLine({ ...line, unit: e.target.value as PriceUnit })}>
              {PRICE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {unitLabel(u)}
                </option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Type
            <select className={input} value={line.basis} onChange={(e) => setLine({ ...line, basis: e.target.value as PriceBasis })}>
              {Object.entries(BASIS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-primary !py-2 text-sm disabled:opacity-50"
            disabled={!line.label.trim() || (line.basis !== "quote" && line.amount === "")}
            onClick={() => {
              addPriceLine(sv, line);
              setLine({ label: "", amount: "", unit: line.unit, basis: line.basis });
            }}
          >
            Add
          </button>
        </div>
        {linkable.length > 0 && (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className={`${lbl} min-w-[240px] flex-1`}>
              Or reuse a price from another service
              <select className={input} value={link} onChange={(e) => setLink(e.target.value)}>
                <option value="">Choose…</option>
                {linkable.map((id) => (
                  <option key={id} value={id}>
                    {state.rows[id].label} – {state.services.find((s) => s.priceIds.includes(id))?.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn-ghost !py-2 text-sm" disabled={!link} onClick={() => (set({ priceIds: [...sv.priceIds, link] }), setLink(""))}>
              Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Categories ─────────────────────────── */

function Categories({
  state,
  setCategory,
  moveCategory,
  addCategory,
  deleteCategory,
}: {
  state: State;
  setCategory: (id: string, patch: Partial<Category>) => void;
  moveCategory: (i: number, d: -1 | 1) => void;
  addCategory: (name: string, blurb: string) => void;
  deleteCategory: (c: Category) => void;
}) {
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  return (
    <div className="space-y-3">
      {state.categories.map((c, i) => {
        const count = state.services.filter((s) => s.categories.includes(c.id)).length;
        return (
          <div key={c.id} className="grid gap-3 rounded-[18px] bg-white p-4 ring-1 ring-charcoal/5 md:grid-cols-[auto_1fr_2fr_auto] md:items-end">
            <div className="flex gap-1 md:flex-col">
              <button type="button" aria-label="Move up" className="rounded-md p-1 text-forest/60 hover:bg-forest/5 disabled:opacity-30" disabled={i === 0} onClick={() => moveCategory(i, -1)}>
                <ChevronUp className="size-4" />
              </button>
              <button type="button" aria-label="Move down" className="rounded-md p-1 text-forest/60 hover:bg-forest/5 disabled:opacity-30" disabled={i === state.categories.length - 1} onClick={() => moveCategory(i, 1)}>
                <ChevronDown className="size-4" />
              </button>
            </div>
            <label className={lbl}>
              Name <span className="font-normal text-charcoal/40">· {count} services</span>
              <input className={input} value={c.name} maxLength={40} onChange={(e) => setCategory(c.id, { name: e.target.value })} />
            </label>
            <label className={lbl}>
              Short description
              <input className={input} value={c.blurb} maxLength={160} onChange={(e) => setCategory(c.id, { blurb: e.target.value })} />
            </label>
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-forest ring-1 ring-forest/20 hover:bg-forest/5" onClick={() => setCategory(c.id, { hidden: !c.hidden })}>
                {c.hidden ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />} {c.hidden ? "Show" : "Hide"}
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-red-700 ring-1 ring-red-700/20 hover:bg-red-50" onClick={() => deleteCategory(c)}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </button>
            </div>
            {c.hidden && <p className="text-xs text-charcoal/50 md:col-span-4">Hidden: this category and services only in it are not shown on the website.</p>}
          </div>
        );
      })}
      <div className="grid gap-3 rounded-[18px] bg-forest/5 p-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
        <label className={lbl}>
          New category name
          <input className={input} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={lbl}>
          Short description
          <input className={input} value={blurb} maxLength={160} onChange={(e) => setBlurb(e.target.value)} />
        </label>
        <button type="button" className="btn-primary !py-2.5 text-sm disabled:opacity-50" disabled={!name.trim()} onClick={() => (addCategory(name, blurb), setName(""), setBlurb(""))}>
          <Plus className="size-4" aria-hidden /> Add category
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Prices ─────────────────────────── */

function Prices({ state, update, priceOf, defaults }: { state: State; update: (fn: (s: State) => State) => void; priceOf: (id: string) => PriceItem | undefined; defaults: Record<string, PriceItem> }) {
  const set = (id: string, patch: Partial<Row>) => update((s) => ({ ...s, rows: { ...s.rows, [id]: { ...s.rows[id], ...patch } } }));
  const seen = new Set<string>();
  const groups = state.categories.flatMap((c) =>
    state.services
      .filter((s) => s.categories[0] === c.id)
      .map((s) => {
        const ids = s.priceIds.filter((id) => !seen.has(id) && state.rows[id]);
        ids.forEach((id) => seen.add(id));
        return { s, c, ids };
      })
      .filter((g) => g.ids.length),
  );

  return (
    <div className="space-y-6">
      {groups.map(({ s, c, ids }) => (
        <section key={s._key} className="rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-charcoal/5 md:p-6">
          <p className="eyebrow">{c.name}</p>
          <h2 className={`mt-1 font-serif text-2xl ${s.hidden ? "text-charcoal/40" : "text-forest"}`}>
            {s.name} {s.hidden && <span className="text-sm font-sans">(hidden)</span>}
          </h2>
          <div className="mt-4 space-y-3">
            {ids.map((id) => {
              const r = state.rows[id];
              const base = priceOf(id)!;
              const original = defaults[id] ? toRow(defaults[id]) : null;
              const amount = r.basis === "quote" || r.amount === "" ? null : Number(r.amount);
              return (
                <div key={id} className="grid gap-3 rounded-xl bg-ivory/60 p-3 md:grid-cols-[2fr_1fr_1fr_1fr_2fr] md:items-end">
                  <label className={lbl}>
                    Label
                    <input className={input} value={r.label} maxLength={80} onChange={(e) => set(id, { label: e.target.value })} />
                  </label>
                  <label className={lbl}>
                    Price (NZD) / {unitLabel(base.unit)}
                    <input className={input} type="number" min={0} step="1" disabled={r.basis === "quote"} value={r.basis === "quote" ? "" : r.amount} onChange={(e) => set(id, { amount: e.target.value })} />
                  </label>
                  <label className={lbl}>
                    Type
                    <select className={input} value={r.basis} onChange={(e) => set(id, { basis: e.target.value as PriceBasis })}>
                      {Object.entries(BASIS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={lbl}>
                    GST
                    <select className={input} value={r.gst} onChange={(e) => set(id, { gst: e.target.value as GstTreatment })}>
                      <option value="unconfirmed">Not stated</option>
                      <option value="excl">+ GST</option>
                    </select>
                  </label>
                  <label className={lbl}>
                    Note (optional)
                    <input className={input} value={r.note} maxLength={120} placeholder="e.g. Up to 50 m²" onChange={(e) => set(id, { note: e.target.value })} />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-5">
                    <p className="text-xs text-charcoal/55">
                      Shows as <strong className="text-forest">{formatPrice({ ...base, basis: r.basis, gst: r.gst, amount: Number.isFinite(amount) ? amount : null })}</strong>
                    </p>
                    {original && JSON.stringify(original) !== JSON.stringify(r) && (
                      <button type="button" className="text-xs font-semibold text-forest/70 underline-offset-2 hover:underline" onClick={() => set(id, original)}>
                        Reset to default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
