/**
 * Enquiry delivery: every quote/booking request is saved to Supabase (table
 * `enquiries`, see supabase/002_enquiries.sql) for the admin area, and emailed
 * to the business via Resend. Each channel is optional and independent.
 *
 * Env (Cloudflare → Worker → Settings → Variables and Secrets):
 *   SUPABASE_SECRET_KEY  – already set; enables saving + the admin list
 *
 *   Notification email via EmailJS (sent from the server, keys never reach the browser):
 *   EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY
 *   (EmailJS → Account → Security: enable "Allow EmailJS API for non-browser applications")
 *
 *   …or via Resend:
 *   RESEND_API_KEY       – enables the notification email
 *   NOTIFY_EMAIL         – where notifications go (comma-separate for several)
 *   NOTIFY_FROM          – optional sender, e.g. "0800 Cleaning <quotes@yourdomain.co.nz>"
 *                          (defaults to Resend's test sender, which can only
 *                          email the address you signed up to Resend with)
 */

const URL = process.env.SUPABASE_URL ?? "https://xmiojutokjwizlhsoret.supabase.co";

export type EnquiryStatus = "new" | "contacted" | "booked" | "closed";
export const STATUSES: EnquiryStatus[] = ["new", "contacted", "booked", "closed"];

export interface Enquiry {
  reference: string;
  receivedAt: string;
  type: "quote" | "booking";
  services: string[];
  lines: { service?: string; item: string; qty: number; unitPrice: number | null }[];
  indicativeEstimate: string;
  quoteOnly: string[];
  location: { region: string; suburb: string };
  propertyType: string;
  preferred: { date: string | null; time: string };
  details: string;
  contact: { name: string; email: string; phone: string; preference: string };
}

export interface StoredEnquiry {
  reference: string;
  created_at: string;
  status: EnquiryStatus;
  data: Enquiry;
}

const db = (path: string, init: RequestInit = {}) => {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
};

export const enquiryStorageOn = () => Boolean(process.env.SUPABASE_SECRET_KEY);
const emailJsOn = () => Boolean(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY);
export const enquiryEmailOn = () => emailJsOn() || Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL);

export async function saveEnquiry(e: Enquiry) {
  const res = db("enquiries", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      reference: e.reference,
      type: e.type,
      name: e.contact.name,
      email: e.contact.email,
      phone: e.contact.phone,
      region: e.location.region,
      suburb: e.location.suburb,
      data: e,
    }),
  });
  if (!res) return;
  const r = await res;
  if (r.status === 404) {
    throw new Error("enquiries table missing – run supabase/002_enquiries.sql");
  }
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

export async function listEnquiries(limit = 200): Promise<StoredEnquiry[] | { error: string }> {
  const res = db(`enquiries?select=reference,created_at,status,data&order=created_at.desc&limit=${limit}`);
  if (!res) return [];
  const r = await res;
  if (!r.ok) {
    const text = await r.text();
    return { error: /enquiries/.test(text) && r.status === 404 ? "The enquiries table hasn't been created yet – run supabase/002_enquiries.sql in Supabase." : `Couldn't load enquiries (${r.status}).` };
  }
  return r.json();
}

export async function setEnquiryStatus(reference: string, status: EnquiryStatus) {
  const res = db(`enquiries?reference=eq.${encodeURIComponent(reference)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status }) });
  if (!res) throw new Error("Storage isn't connected.");
  const r = await res;
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
}

/* ─────────────────────────── Email ─────────────────────────── */

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function emailEnquiry(e: Enquiry) {
  if (emailJsOn()) return emailViaEmailJs(e);
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL?.split(",").map((s) => s.trim()).filter(Boolean);
  if (!key || !to?.length) return;

  const kind = e.type === "booking" ? "Booking request" : "Quote request";
  const rows: [string, string][] = [
    ["Reference", e.reference],
    ["Name", e.contact.name],
    ["Email", e.contact.email],
    ["Phone", e.contact.phone || "–"],
    ["Prefers", e.contact.preference],
    ["Location", [e.location.suburb, e.location.region].filter(Boolean).join(", ")],
    ["Property", e.propertyType || "–"],
    ["Services", e.services.join(", ")],
    ["Estimate", e.indicativeEstimate],
    ["Preferred time", [e.preferred.date, e.preferred.time].filter(Boolean).join(", ") || "–"],
  ];
  const items = e.lines.map((l) => `${l.qty} × ${l.item}${l.service ? ` (${l.service})` : ""}`);
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#1c1c1a">
  <h2 style="color:#1f3b33;margin:0 0 12px">${esc(kind)} – ${esc(e.contact.name)}</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:6px 10px 6px 0;color:#666;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join("")}</table>
  ${items.length ? `<p style="margin:16px 0 4px;color:#666;font-size:13px">Items</p><ul style="margin:0;padding-left:18px;font-size:14px">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}
  ${e.quoteOnly.length ? `<p style="font-size:14px">Needs a site quote: ${esc(e.quoteOnly.join(", "))}</p>` : ""}
  ${e.details ? `<p style="margin:16px 0 4px;color:#666;font-size:13px">Details</p><p style="white-space:pre-wrap;font-size:14px;margin:0">${esc(e.details)}</p>` : ""}
  <p style="margin-top:20px;font-size:13px;color:#666">Reply to this email to answer ${esc(e.contact.name)} directly.</p></div>`;
  const text = [`${kind} – ${e.contact.name}`, "", ...rows.map(([k, v]) => `${k}: ${v}`), ...(items.length ? ["", "Items:", ...items.map((i) => `- ${i}`)] : []), ...(e.details ? ["", "Details:", e.details] : [])].join("\n");

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || "0800 Cleaning & Restoration <onboarding@resend.dev>",
      to,
      reply_to: e.contact.email,
      subject: `${kind}: ${e.contact.name}${e.location.suburb ? `, ${e.location.suburb}` : ""} (${e.reference})`,
      html,
      text,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

/**
 * EmailJS template variables (use any of these in your EmailJS template):
 *   {{subject}} {{message}} {{reference}} {{type}} {{name}} {{email}} {{phone}}
 *   {{contact_preference}} {{location}} {{property}} {{services}} {{estimate}}
 *   {{preferred_time}} {{items}} {{quote_only}} {{details}} {{reply_to}}
 * {{message}} is a complete plain-text summary, so a template with just
 * Subject: {{subject}} and Content: {{message}} works.
 */
async function emailViaEmailJs(e: Enquiry) {
  const kind = e.type === "booking" ? "Booking request" : "Quote request";
  const location = [e.location.suburb, e.location.region].filter(Boolean).join(", ");
  const items = e.lines.map((l) => `${l.qty} × ${l.item}${l.service ? ` (${l.service})` : ""}`).join("\n");
  const params = {
    subject: `${kind}: ${e.contact.name}${e.location.suburb ? `, ${e.location.suburb}` : ""} (${e.reference})`,
    reference: e.reference,
    type: kind,
    name: e.contact.name,
    email: e.contact.email,
    phone: e.contact.phone || "–",
    contact_preference: e.contact.preference,
    location,
    property: e.propertyType || "–",
    services: e.services.join(", "),
    estimate: e.indicativeEstimate,
    preferred_time: [e.preferred.date, e.preferred.time].filter(Boolean).join(", ") || "–",
    items: items || "–",
    quote_only: e.quoteOnly.join(", ") || "–",
    details: e.details || "–",
    reply_to: e.contact.email,
    message: [
      `${kind} – ${e.contact.name}`,
      "",
      `Reference: ${e.reference}`,
      `Name: ${e.contact.name}`,
      `Email: ${e.contact.email}`,
      `Phone: ${e.contact.phone || "–"}`,
      `Prefers: ${e.contact.preference}`,
      `Location: ${location}`,
      `Property: ${e.propertyType || "–"}`,
      `Services: ${e.services.join(", ")}`,
      `Estimate: ${e.indicativeEstimate}`,
      `Preferred time: ${[e.preferred.date, e.preferred.time].filter(Boolean).join(", ") || "–"}`,
      ...(items ? ["", "Items:", items] : []),
      ...(e.quoteOnly.length ? ["", `Needs a site quote: ${e.quoteOnly.join(", ")}`] : []),
      ...(e.details ? ["", "Details:", e.details] : []),
    ].join("\n"),
  };
  const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: params,
    }),
  });
  if (!r.ok) throw new Error(`EmailJS ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
