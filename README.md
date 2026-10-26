# 0800 Cleaning & Restoration

A premium cleaning and property-care website for New Zealand, built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4 and GSAP ScrollTrigger.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## What's here

| Route | Purpose |
| --- | --- |
| `/` | Hero, the 3D home tour (every service performed room by room as you scroll), catalogue index, pricing highlights, process, CTA |
| `/services` | Searchable, filterable catalogue (`?category=floor-care` deep-links) |
| `/services/[slug]` | 15 statically generated service pages with pricing, scope notes, JSON-LD |
| `/pricing` | Every indicative price, grouped by category |
| `/quote` | 3-step quote / booking flow with live indicative estimate (`?service=curtain-cleaning&type=booking`) |
| `/api/quote` | Validates, recomputes the estimate server-side, delivers the enquiry |

## Editing prices and services

- **All prices** live in [`src/data/pricing.ts`](src/data/pricing.ts). Nothing else hardcodes a figure.
- **All services** live in [`src/data/services.ts`](src/data/services.ts) and reference prices by ID.
- **Business details** live in [`src/data/site.ts`](src/data/site.ts). The two phone numbers (`PHONES`) take calls and WhatsApp and feed the header, footer, quote page and floating contact button. The contact email is 0800cleaningandrestoration@gmail.com and the site address is https://www.0800cleaningandrestoration.co.nz.

### Before launch – pricing to confirm

Figures are our own indicative rates: informed by NZ market research, then each adjusted individually. Search `uncertain:` in `pricing.ts`:

1. **Minimum visit vs. "from" prices:** the $272 + GST Home Refresh minimum sits above Move-Out Detail ($189) and Top-to-Bottom Reset ($184). Decide which minimum applies where.
2. **Team rates:** $124 / $184 / $245 aren't exact multiples of the $63 single-specialist rate. Confirm the intended team pricing.
3. **Lounge suite package:** $196 for up to 5 seats vs 5 × $41 per seat. They're shown as separate lines and the estimator doesn't combine them.
4. **Timber Floor Restore ($74/m²):** confirm whether finish coats and minimums are included.
5. **GST:** only the minimum visit is marked "+ GST". Every other item is `gst: "unconfirmed"`.

Quote-only services have `priceIds: []` (or a `basis: "quote"` item) and never show an invented figure.

## Admin area (/admin)

Services, categories and prices can be managed without touching code at **/admin** (not linked from the site, hidden from search engines). Three tabs:

- **Services:** add a service (name, web address, categories, summary, description, what's included, good-to-know notes, keywords, featured flag and its own price lines), edit any service, **Hide/Show** it, or delete it. Hidden services disappear from every page, the quote form and the sitemap, and their page returns 404.
- **Categories:** add, rename, reorder, hide/show or delete categories. A service needs at least one visible category to appear.
- **Prices:** edit every price line (label, amount, type, GST, note) with a live preview and reset-to-default.

- **Sign in:** one shared password, set as `ADMIN_PASSWORD` (10+ characters) in the Vercel project's environment variables. Sessions last 12 hours; changing the password signs everyone out.
- **Storage:** edits are saved in Supabase, table `site_settings` (rows `catalogue` and `pricing_overrides`) (create it once with `supabase/001_site_settings.sql` in the SQL Editor). The site reads with the public publishable key (row-level security allows read only); saving uses `SUPABASE_SECRET_KEY`, set only as a Cloudflare Worker secret. Only differences from the defaults in `src/data/pricing.ts` are stored, so "Reset to default" always works.
- **How it reaches the site:** `src/lib/live-data.ts` loads the saved catalogue and lays price edits over the defaults. Pages stay static and fast; saving clears the cache so every page, the quote estimator and the server-side quote check use the new prices within seconds.
- Without the table, secret key or password the site simply uses the defaults and the admin page explains what to set up.

## Enquiry delivery

Every quote and booking request goes to each channel that is switched on (`src/lib/enquiries.ts`):

- **Admin → Enquiries tab:** saved in Supabase (table `enquiries`, create it once with `supabase/002_enquiries.sql`). Lists each request with contact buttons (call, WhatsApp, email) and a status: New, Contacted, Booked, Closed. Customer details can only be read by the server; the table has no public access.
- **Email:** sent instantly from the server via [EmailJS](https://www.emailjs.com) when `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY` and `EMAILJS_PRIVATE_KEY` are set (enable "Allow EmailJS API for non-browser applications" under EmailJS → Account → Security). Template variables are listed in `src/lib/enquiries.ts`; a template with Subject `{{subject}}`, Reply-To `{{reply_to}}` and Content `{{message}}` is enough. Alternatively via [Resend](https://resend.com) when `RESEND_API_KEY` and `NOTIFY_EMAIL` are set. Replying to the email goes straight to the customer. Without `NOTIFY_FROM` it uses Resend's test sender, which can only email the address you signed up with; verify your own domain in Resend to send from it.
- **Webhook (optional):** `QUOTE_WEBHOOK_URL` also POSTs each enquiry as JSON (Zapier, Make, a CRM).

The visitor sees success if at least one channel worked; with none configured, enquiries are only written to the server log.

## Animation architecture

- The visuals are all CSS/SVG (no 3D model or image downloads), so the page works as soon as it loads.
- **Everything runs on the GPU compositor.** Animations only change `transform` and `opacity`:
  - Tools move with x/y transforms measured from their container (`pos()` in `components/stories/motion.tsx`).
  - Dirt is removed by `<Wipe>` layers: an outer box slides away while its content slides back the same distance, so nothing repaints.
  - No blend modes are used on animated layers.
- **Scrub smoothing** (`SCRUB` in `StoryScene.tsx`, 1.2s) turns stepped mouse-wheel input into one continuous motion. Positions are re-measured on resize.
- **Curtain sequence** (`components/home/CurtainSequence.tsx`): pinned and scrubbed through five scenes. Shown on the curtain service pages.
- **Service detail pages:** about 40 pages show a scroll scene via `<ServiceMotion>`. The service-to-scene mapping is `MOTION_BY_SLUG` in `src/data/services.ts`; add a slug there to give another service a scene. A tile & grout scene is used on the tile, sealing and block-honing pages.
- **Reduced motion:** the curtain section becomes a static before/after pair, and every other scene renders in its finished state at normal height.

## Smoothness and finish

- **Inertial scrolling:** [Lenis](https://github.com/darkroomengineering/lenis) is driven by GSAP's ticker (`components/SmoothScroll.tsx`), so scroll and scroll-scenes update on the same frame. Touch devices and reduced-motion users keep native scrolling.
- **No frosted-glass blur over moving content:** it forces a re-blur every frame, so those surfaces use near-opaque fills instead.
- **Luxury details:**
  - Muted brass accent (`--color-brass`) with hairline details on labels.
  - Button hovers where the fill sweeps in.
  - Scroll reveals (`[data-reveal]`, `components/Reveals.tsx`).
  - A brass cursor ring on desktop.
  - A once-per-session logo intro.
  - A values marquee and a large footer wordmark.
- **Production preview:** `npm run preview` builds and serves production. Dev mode is noticeably slower, so judge smoothness on the production build.

## Home page 3D walkthrough

- **What it is:** `components/walkthrough/` is a real-time 3D home (three.js) driven by scroll. The camera starts on the street, the gate swings open, it walks up the path and through the front door, then stops in each room while the job is done: the entry floor is mopped, the kitchen splashback scrubbed, the curtains steamed, the rug and sofa extracted, and the glass doors squeegeed. It ends on the finished lounge with the quote call-to-action.
- **Files:**
  - `timeline.ts`: the script. Camera moves (`MOVES`), gate and door timing, and when each job runs (`TASKS`). Captions and the checklist read the same numbers.
  - `house.ts`: the house and garden, plus the surfaces that get cleaned.
  - `dirt.ts`: grime layers. Each job's tool follows a stroke pattern and erases the grime exactly where it has passed, so scrolling back brings the dirt back.
  - `tools.ts`: mop, grout brush, steamer, carpet extractor, upholstery tool and squeegee.
  - `assets.ts` + `public/assets/`: photo-scanned materials (oak floor, plaster, stone, pavers, lawn, timber, fabric weave), furniture models (plants, armchair, side tables, dining set) and a real sky that lights the scene. All CC0 from [Poly Haven](https://polyhaven.com); `node scripts/fetch-assets.js` re-downloads and compresses them (about 8 MB, loaded only as the visitor nears the tour).
  - `skyline.ts`: Auckland's Sky Tower and a hazy city skyline about 1.6 km away, seen above the roof from the street and through the lounge's glass doors.
  - `textures.ts`: the splashback tiles, rug, linen and all the grime are painted on a canvas so they line up with the cleaning paths.
  - `engine.ts`: renderer, lighting, camera, steam and sparkles. It only draws when the scroll position changes.
- **Weight:** three.js and the assets load only as the visitor nears the tour, so they never delay the first paint.
- **Hero:** a real house photo (`src/data/photos.ts`, Unsplash License) with a slow cinematic push-in.

## Hosting on Cloudflare (Workers, via GitHub)

The site runs as a Cloudflare Worker using the [OpenNext adapter](https://opennext.js.org/cloudflare) (`open-next.config.ts`, `wrangler.jsonc`).

- **Builds:** Cloudflare Workers Builds deploys every push to `main`. Build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`.
- **Page cache:** pre-built pages and cache tags are stored in one Workers KV namespace (bindings `NEXT_INC_CACHE_KV` and `NEXT_TAG_CACHE_KV` in `wrangler.jsonc`), so saving in /admin refreshes pages instantly.
- **Admin access:** `/admin` sits behind Cloudflare Access (Zero Trust → Access controls → Applications → "Website admin"): only the emails in its policy get a one-time login code, then the admin password is still required.
- **Settings:** public values are in `wrangler.jsonc` → `vars`. Secrets go in Cloudflare → Workers & Pages → the Worker → Settings → Variables and Secrets: `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, `TURNSTILE_SECRET_KEY` (from Cloudflare → Turnstile → "Quote form"; the quote form checks for bots with it). Also add `SUPABASE_SECRET_KEY` under Build → Variables and secrets so pages are pre-built with your saved services and prices.
- **Manual deploy:** `npm run deploy:cf` (needs `npx wrangler login`). Building on Windows works but OpenNext recommends WSL or CI.
