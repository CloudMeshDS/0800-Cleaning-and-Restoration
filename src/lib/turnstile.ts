/**
 * Server-side check of a Cloudflare Turnstile token from the quote form.
 * Env (Cloudflare → Worker → Settings → Variables and Secrets):
 *   TURNSTILE_SECRET_KEY  – secret from Cloudflare → Turnstile → "Quote form"
 * Without the secret the check is skipped (local dev), with a warning.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set – bot check skipped");
    return true;
  }
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") form.set("remoteip", ip);
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: form });
    const json = (await res.json()) as { success?: boolean; action?: string };
    return json.success === true && (!json.action || json.action === "quote");
  } catch (err) {
    console.error(`[turnstile] verification request failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
