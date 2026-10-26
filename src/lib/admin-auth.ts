import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { kv } from "./rate-limit";

/**
 * Single shared admin password, set as the ADMIN_PASSWORD secret in the Cloudflare Worker's
 * environment variables (at least 10 characters). Sessions are a signed,
 * HTTP-only cookie valid for 12 hours; changing the password signs everyone out.
 */

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 12;

const password = () => process.env.ADMIN_PASSWORD ?? "";
export const adminConfigured = () => password().length >= 10;

const digest = (s: string) => createHash("sha256").update(s).digest();
const sign = (exp: string) => createHmac("sha256", `0800-admin:${password()}`).update(exp).digest("hex");

export function checkPassword(attempt: string) {
  return adminConfigured() && timingSafeEqual(digest(attempt), digest(password()));
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  const [exp, sig] = value?.split(".") ?? [];
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

/* ─────────────── Brute-force protection (Cloudflare KV) ───────────────
 * After MAX_FAILS wrong passwords from one IP, sign-in is locked for
 * LOCK_SECONDS. Counts live in the Worker's KV namespace so every Cloudflare
 * location shares them. Outside Cloudflare this is skipped.
 */
const MAX_FAILS = 8;
const LOCK_SECONDS = 15 * 60;

const failKey = (ip: string) => `admin-login-fails:${ip}`;

export async function loginLocked(ip: string) {
  const store = await kv();
  return store ? (Number(await store.get(failKey(ip))) || 0) >= MAX_FAILS : false;
}

export async function recordLoginFailure(ip: string) {
  const store = await kv();
  if (!store) return;
  const n = (Number(await store.get(failKey(ip))) || 0) + 1;
  await store.put(failKey(ip), String(n), { expirationTtl: LOCK_SECONDS });
}

export async function clearLoginFailures(ip: string) {
  await (await kv())?.delete(failKey(ip));
}
