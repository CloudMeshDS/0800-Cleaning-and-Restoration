/**
 * Shared rate limiting backed by the Worker's KV namespace, so limits hold
 * across every Cloudflare location (in-memory counters only see one server).
 * Outside Cloudflare (local dev, other hosts) KV is unavailable and callers
 * fall back to their own behaviour.
 */

type KV = { get(k: string): Promise<string | null>; put(k: string, v: string, o?: { expirationTtl?: number }): Promise<void>; delete(k: string): Promise<void> };

export async function kv(): Promise<KV | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return ((getCloudflareContext().env as Record<string, unknown>).NEXT_INC_CACHE_KV as KV) ?? null;
  } catch {
    return null;
  }
}

/**
 * Counts one hit for `key`; returns true when the limit is exceeded within
 * the window. Returns null when KV isn't available.
 */
export async function hitLimit(key: string, max: number, windowSeconds: number): Promise<boolean | null> {
  const store = await kv();
  if (!store) return null;
  const k = `rl:${key}`;
  const n = (Number(await store.get(k)) || 0) + 1;
  await store.put(k, String(n), { expirationTtl: Math.max(60, windowSeconds) });
  return n > max;
}

/** The visitor's IP as seen by Cloudflare. */
export const clientIp = (h: Headers) => h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
