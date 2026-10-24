"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import type { EnquiryStatus, StoredEnquiry } from "@/lib/enquiries";
import { updateEnquiryStatus } from "./actions";

const STATUS: { id: EnquiryStatus; label: string; tone: string }[] = [
  { id: "new", label: "New", tone: "bg-brass/20 text-[#7a5b2c]" },
  { id: "contacted", label: "Contacted", tone: "bg-sky-100 text-sky-800" },
  { id: "booked", label: "Booked", tone: "bg-forest/10 text-forest" },
  { id: "closed", label: "Closed", tone: "bg-charcoal/10 text-charcoal/60" },
];

const when = (iso: string) => new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
/** NZ mobile → international format for WhatsApp links. */
const waNumber = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("64") ? d : d.startsWith("0") ? `64${d.slice(1)}` : d;
};

export function Enquiries({ items, error }: { items: StoredEnquiry[]; error?: string }) {
  const [list, setList] = useState(items);
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [, start] = useTransition();

  if (error) return <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">{error}</p>;

  const setStatus = (ref: string, status: EnquiryStatus) => {
    const prev = list;
    setList((l) => l.map((e) => (e.reference === ref ? { ...e, status } : e)));
    start(async () => {
      const r = await updateEnquiryStatus(ref, status);
      if (!r.ok) {
        setList(prev);
        setMsg(r.message);
      } else setMsg(null);
    });
  };

  const shown = list.filter((e) => filter === "all" || e.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ id: "all" as const, label: "All" }, ...STATUS].map((s) => {
          const n = s.id === "all" ? list.length : list.filter((e) => e.status === s.id).length;
          return (
            <button key={s.id} type="button" onClick={() => setFilter(s.id)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${filter === s.id ? "bg-forest text-ivory ring-forest" : "bg-white text-forest/70 ring-charcoal/15"}`}>
              {s.label} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
        {msg && <span className="text-sm text-red-700">{msg}</span>}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-charcoal/60 ring-1 ring-charcoal/5">{list.length ? "Nothing with this status." : "No enquiries yet. New quote and booking requests from the website will appear here."}</p>
      ) : (
        <div className="divide-y divide-charcoal/10 rounded-[18px] bg-white ring-1 ring-charcoal/5">
          {shown.map((e) => {
            const d = e.data;
            const st = STATUS.find((s) => s.id === e.status) ?? STATUS[0];
            const isOpen = open === e.reference;
            return (
              <div key={e.reference} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(isOpen ? null : e.reference)}>
                    <p className="font-semibold text-forest">
                      {d.contact.name} <span className="font-normal text-charcoal/50">· {d.type === "booking" ? "Booking" : "Quote"} · {[d.location.suburb, d.location.region].filter(Boolean).join(", ")}</span>
                    </p>
                    <p className="truncate text-sm text-charcoal/60">
                      {d.services.join(", ")} · {d.indicativeEstimate}
                    </p>
                    <p className="text-xs text-charcoal/45">
                      {when(e.created_at)} · {e.reference}
                    </p>
                  </button>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.tone}`}>{st.label}</span>
                  <select aria-label="Status" className="rounded-lg border border-charcoal/15 bg-white px-2 py-1.5 text-sm" value={e.status} onChange={(ev) => setStatus(e.reference, ev.target.value as EnquiryStatus)}>
                    {STATUS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {d.contact.phone && (
                    <>
                      <a href={`tel:${d.contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-forest ring-1 ring-forest/20 hover:bg-forest/5">
                        <Phone className="size-4" aria-hidden /> {d.contact.phone}
                      </a>
                      <a href={`https://wa.me/${waNumber(d.contact.phone)}?text=${encodeURIComponent(`Hi ${d.contact.name}, it's 0800 Cleaning & Restoration about your request ${e.reference}.`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-forest ring-1 ring-forest/20 hover:bg-forest/5">
                        <MessageCircle className="size-4" aria-hidden /> WhatsApp
                      </a>
                    </>
                  )}
                  <a href={`mailto:${d.contact.email}?subject=${encodeURIComponent(`Your ${d.type} request ${e.reference}`)}`} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-forest ring-1 ring-forest/20 hover:bg-forest/5">
                    <Mail className="size-4" aria-hidden /> {d.contact.email}
                  </a>
                </div>

                {isOpen && (
                  <dl className="mt-4 grid gap-x-8 gap-y-2 rounded-xl bg-ivory/60 p-4 text-sm sm:grid-cols-2">
                    {[
                      ["Prefers contact by", d.contact.preference],
                      ["Property", d.propertyType || "–"],
                      ["Preferred time", [d.preferred.date, d.preferred.time].filter(Boolean).join(", ") || "–"],
                      ["Needs a site quote", d.quoteOnly.join(", ") || "–"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs font-semibold text-charcoal/50">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                    {d.lines.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold text-charcoal/50">Items</dt>
                        <dd>
                          <ul className="list-disc pl-5">
                            {d.lines.map((l, i) => (
                              <li key={i}>
                                {l.qty} × {l.item}
                                {l.service ? ` (${l.service})` : ""}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                    {d.details && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold text-charcoal/50">Details</dt>
                        <dd className="whitespace-pre-wrap">{d.details}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
