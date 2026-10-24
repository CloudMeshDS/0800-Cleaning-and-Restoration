import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import kvNextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * OpenNext adapter config for Cloudflare Workers.
 * Pre-built pages and cached data live in Workers KV (binding NEXT_INC_CACHE_KV),
 * and cache tags in KV too (NEXT_TAG_CACHE_KV), so saving in /admin refreshes
 * pages instantly. Both bindings point at the same namespace (wrangler.jsonc).
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: kvNextTagCache,
  queue: memoryQueue,
});
