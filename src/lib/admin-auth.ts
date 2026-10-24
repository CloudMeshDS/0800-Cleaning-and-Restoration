import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Single shared admin password, set as ADMIN_PASSWORD in the Vercel project's
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
