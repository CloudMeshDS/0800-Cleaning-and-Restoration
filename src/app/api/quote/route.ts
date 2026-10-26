import { NextResponse } from "next/server";
import { clientIp, hitLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { estimate, sanitize, validateAll } from "@/lib/quote";
import { getService } from "@/data/services";
import { syncLive } from "@/lib/live-data";
import { formatNZD, getPrice } from "@/data/pricing";
import { emailEnquiry, enquiryEmailOn, enquiryStorageOn, saveEnquiry, type Enquiry } from "@/lib/enquiries";

/**
 * Receives quote / booking enquiries and delivers them to every configured
 * channel (see src/lib/enquiries.ts):
 *   - saved in Supabase → listed in /admin → Enquiries   (SUPABASE_SECRET_KEY)
 *   - emailed to the business via Resend                 (RESEND_API_KEY + NOTIFY_EMAIL)
 *   - POSTed as JSON to a webhook (Zapier, Make, a CRM)   (QUOTE_WEBHOOK_URL)
 * The visitor sees success if at least one channel worked. With none
 * configured, nothing is stored. Customer details are never written to logs.
 */

// Rate limits: per visitor, plus a site-wide cap that protects the email quota
// from spam waves. Shared via Cloudflare KV; in-memory fallback elsewhere.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  await syncLive();
  const ip = clientIp(req.headers);
  const perVisitor = await hitLimit(`quote:${ip}`, MAX_PER_WINDOW, WINDOW_MS / 1000);
  const siteWide = await hitLimit("quote:all", 60, 60 * 60);
  if (perVisitor ?? limited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again shortly or call us." }, { status: 429 });
  }
  if (siteWide) {
    return NextResponse.json({ ok: false, error: "We're receiving a lot of requests right now. Please call or WhatsApp us instead." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const data = sanitize(body);
  const reference = `CR-${Date.now().toString(36).toUpperCase().slice(-5)}${crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase()}`;

  // Honeypot: pretend success so bots learn nothing.
  if (data.website) return NextResponse.json({ ok: true, reference });

  if (!(await verifyTurnstile((body as { turnstileToken?: unknown } | null)?.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: "The security check didn't complete. Please try again, or call us." }, { status: 403 });
  }

  const errors = validateAll(data);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields.", errors }, { status: 422 });
  }

  const est = estimate(data.services, data.lines);
  const enquiry: Enquiry = {
    reference,
    receivedAt: new Date().toISOString(),
    type: data.type,
    services: data.services.map((s) => getService(s)?.name ?? s),
    lines: data.lines
      .filter((l) => l.qty > 0)
      .map((l) => ({ service: getService(l.service)?.name, item: getPrice(l.priceId).label, qty: l.qty, unitPrice: getPrice(l.priceId).amount })),
    indicativeEstimate: est.total ? `${est.isMinimum ? "from " : ""}${formatNZD(est.total)} (indicative)` : "n/a",
    quoteOnly: est.quoteOnly.map((s) => getService(s)?.name ?? s),
    location: { region: data.region, suburb: data.suburb },
    propertyType: data.propertyType,
    preferred: { date: data.preferredDate || null, time: data.preferredTime },
    details: data.details,
    contact: { name: data.name, email: data.email, phone: data.phone, preference: data.contactPref },
  };

  const webhook = process.env.QUOTE_WEBHOOK_URL;
  const channels: [string, () => Promise<unknown>][] = [];
  if (enquiryStorageOn()) channels.push(["database", () => saveEnquiry(enquiry)]);
  if (enquiryEmailOn()) channels.push(["email", () => emailEnquiry(enquiry)]);
  if (webhook)
    channels.push([
      "webhook",
      async () => {
        const res = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enquiry) });
        if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      },
    ]);

  if (!channels.length) {
    console.warn(`[quote] No delivery channel configured – enquiry ${reference} was not stored`);
  } else {
    const results = await Promise.allSettled(channels.map(([, run]) => run()));
    results.forEach((r, i) => r.status === "rejected" && console.error(`[quote] ${channels[i][0]} delivery failed for ${reference}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`));
    if (results.every((r) => r.status === "rejected")) {
      console.error(`[quote] Enquiry ${reference} could not be delivered to any channel`);
      return NextResponse.json({ ok: false, error: "We couldn't send your enquiry just now. Please try again or call us." }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, reference });
}
