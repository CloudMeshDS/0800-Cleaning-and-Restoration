import type { PriceId } from "./pricing";

/** Category slug. The built-in ones are listed below; more can be added in /admin. */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  /** Hidden in the admin area: not shown anywhere on the public site. */
  hidden?: boolean;
}

/** Built-in categories. The live list (edited in /admin) is `CATEGORIES`. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "textiles", name: "Soft Furnishings", blurb: "Fabric-first care for carpets, curtains, blinds and upholstery." },
  { id: "residential", name: "Home Care", blurb: "Regular cleans, move-out detailing, post-build cleans, windows and ovens." },
  { id: "commercial", name: "Workplace Care", blurb: "Scheduled cleaning for offices and business premises, plus post-build handovers." },
  { id: "restoration", name: "Recovery & Specialist", blurb: "Flood and water damage, mould, and meth testing and decontamination." },
];

export interface Service {
  slug: string;
  name: string;
  categories: CategoryId[];
  /** One sentence for cards and meta descriptions. */
  summary: string;
  /** Detail-page introduction. */
  description: string;
  includes: string[];
  /** Honest scope notes: what affects price, what isn't suitable, etc. */
  considerations: string[];
  /** References into PRICES – the only way a service gets a price. */
  priceIds: PriceId[];
  keywords: string[];
  /** Shown in the home-page catalogue preview. */
  featured?: boolean;
  /** Hidden in the admin area: its page and listings are removed from the site. */
  hidden?: boolean;
}

/** Shared copy blocks so similar services stay consistent. */
const HOURLY: PriceId[] = ["hourly1", "hourly2", "hourly3", "hourly4", "callOut"];
const WINDOW: PriceId[] = ["window12", "window34", "window56", "window78"];

/** Built-in services. The live list (edited in /admin) is `SERVICES`. */
export const DEFAULT_SERVICES: Service[] = [
  {
    slug: "carpet-deep-refresh",
    name: "Carpet Deep Refresh",
    categories: ["textiles"],
    summary: "Hot-water extraction that lifts embedded soil from deep in the pile.",
    description:
      "Carpet is pre-vacuumed, pre-treated for traffic lanes, then cleaned with truck-mounted or portable hot-water extraction. We tune heat, chemistry and drying to the fibre – wool and synthetic carpets are treated differently.",
    includes: ["Pre-vacuum and traffic-lane pre-treatment", "Hot-water extraction", "Spot treatment of common stains", "Furniture moved where safe", "Grooming for even drying"],
    considerations: ["Some stains (dyes, bleach) are permanent", "Drying typically takes several hours depending on ventilation", "Wool carpets are cleaned with wool-safe products"],
    priceIds: ["carpetResidential"],
    keywords: ["carpet cleaner", "steam clean"],
    featured: true,
  },
  {
    slug: "curtain-care",
    name: "Curtain Care & Rehang",
    categories: ["textiles"],
    summary: "Curtains taken down, cleaned to suit the fabric and rehung with care.",
    description:
      "Every pair is assessed before cleaning: fabric, lining, care label, weight and condition. Depending on what we find, curtains are cleaned on-site or taken away, using a dry, wet or low-moisture method. We take down, clean, press where appropriate and rehang – so they hang the way they should.",
    includes: ["Fabric and care-label assessment", "Take-down and rehanging", "Method matched to fabric", "Optional mould treatment", "Pressing where suitable"],
    considerations: [
      "Not every curtain can be washed – some fabrics, linings and blockout coatings need dry or low-moisture methods",
      "Older fabrics may show shrinkage or sun damage that cleaning can't reverse",
      "Lined curtains and mould treatment are add-ons",
    ],
    priceIds: ["curtainSmall", "curtainMedium", "curtainLarge", "curtainXL", "curtainLining", "curtainMould"],
    keywords: ["curtain cleaner", "drapes", "curtains"],
    featured: true,
  },
  {
    slug: "blind-care",
    name: "Blind Care",
    categories: ["textiles"],
    summary: "Roller, venetian and vertical blinds cleaned to suit their material.",
    description: "We assess the blind type and fabric, then clean on-site or off-site.",
    includes: ["Material check", "Slats or fabric cleaned", "Rehung and tested"],
    considerations: ["Brittle or sun-damaged blinds may not be suitable"],
    priceIds: ["blind"],
    keywords: ["blinds"],
  },
  {
    slug: "sofa-upholstery-refresh",
    name: "Sofa & Upholstery Refresh",
    categories: ["textiles"],
    summary: "Fabric-safe cleaning that refreshes sofas, lounge suites and dining chairs.",
    description:
      "Every fabric is checked for its cleaning code before we start. Water-safe fabrics are extracted; delicate fibres are cleaned with low-moisture methods to protect texture and colour.",
    includes: ["Fabric and care-code check", "Pre-treatment of soiled areas", "Extraction or low-moisture clean", "Grooming of pile"],
    considerations: ["Leather, silk and 'dry clean only' fabrics need specialist assessment", "Previous water marks may not fully lift"],
    priceIds: ["upholsterySeat", "sofaFiveSeats"],
    keywords: ["couch cleaning", "sofa cleaner", "lounge suite"],
    featured: true,
  },
  {
    slug: "home-refresh",
    name: "Home Refresh",
    categories: ["residential"],
    summary: "A consistent, detailed clean on a schedule that suits your household.",
    description:
      "Kitchens, bathrooms, floors and living areas cleaned to the same standard every visit. We agree a checklist with you up front, so you know exactly what gets done and can adjust it as your needs change.",
    includes: ["Kitchen benches, splashbacks and exterior of appliances", "Bathrooms, toilets, showers and vanities", "Vacuuming and mopping of hard floors", "Dusting of reachable surfaces and skirting", "Rubbish removal to your bins"],
    considerations: ["Charged at the hourly team rate; a call-out fee may apply", "Inside ovens, fridges and windows are available as add-ons", "Visit length is agreed after an initial walkthrough"],
    priceIds: HOURLY,
    keywords: ["house cleaner", "home cleaning", "fortnightly"],
    featured: true,
  },
  {
    slug: "move-out-detail",
    name: "Move-Out Detail",
    categories: ["residential"],
    summary: "A thorough move-out clean built around a typical NZ property inspection checklist.",
    description:
      "When a bond is on the line, details matter. We work room by room through the areas property managers check most closely – inside cupboards, appliances, fittings and floors – and can coordinate carpet and window cleaning on the same day.",
    includes: ["Inside cupboards, drawers and wardrobes", "Oven, rangehood and cooktop", "Bathrooms descaled and detailed", "Light switches, doors and skirting", "Floors vacuumed and mopped"],
    considerations: ["Price depends on property size and condition", "Carpet and window cleaning quoted as add-ons", "We can't guarantee bond outcomes – inspections are the landlord's decision"],
    priceIds: ["endOfTenancy"],
    keywords: ["bond clean", "move out clean", "vacate clean"],
    featured: true,
  },
  {
    slug: "office-care-programme",
    name: "Commercial Care Programme",
    categories: ["commercial"],
    summary: "Scheduled cleaning that keeps offices and business premises presentable and hygienic.",
    description: "Daily, weekly or custom schedules, with a site-specific scope and a consistent point of contact.",
    includes: ["Desks and touchpoints", "Kitchens and bathrooms", "Floors", "Rubbish and recycling"],
    considerations: ["Scope and frequency agreed after a site visit"],
    priceIds: ["commercial"],
    keywords: ["office cleaner", "commercial cleaning"],
  },
  {
    slug: "post-build-detail",
    name: "Post-Build Detail",
    categories: ["residential", "commercial"],
    summary: "Post-construction dust and residue removed so the finished space can shine.",
    description:
      "Fine construction dust settles everywhere. We remove it from surfaces, fittings, joinery and floors, and clean off labels, paint flecks and adhesive residue ready for handover.",
    includes: ["Fine dust removal throughout", "Window glass, frames and tracks", "Sticker and residue removal", "Bathrooms and kitchens detailed", "Hard floors cleaned"],
    considerations: ["Site must be safe to access and trades finished in the area", "Heavy residue (concrete, plaster) may need specialist treatment"],
    priceIds: ["builders"],
    keywords: ["post construction", "after builders", "renovation clean"],
  },
  {
    slug: "glass-care",
    name: "Glass & Window Care",
    categories: ["residential"],
    summary: "Streak-free glass inside and out, with frames and sills wiped down.",
    description:
      "We use purified water and professional squeegee technique for clear, streak-free glass. Pricing is banded by home size, with access and storeys confirmed before we book.",
    includes: ["Exterior glass", "Interior glass on request", "Frames and sills wiped", "Fly screens brushed"],
    considerations: ["Multi-storey or difficult access may change the price", "Interior glass may be priced separately"],
    priceIds: WINDOW,
    keywords: ["window cleaner", "glass"],
    featured: true,
  },
  {
    slug: "oven-revive",
    name: "Oven Revive",
    categories: ["residential"],
    summary: "Baked-on grease removed from racks, trays, glass and interior.",
    description: "Racks and trays are soaked and scrubbed, the interior and door glass degreased, and the exterior polished. Methods are matched to your oven type.",
    includes: ["Interior, racks and trays", "Door glass – inner and outer", "Exterior and controls wiped"],
    considerations: ["Self-cleaning and enamel linings are treated with suitable products", "Rangehoods quoted separately"],
    priceIds: ["oven"],
    keywords: ["oven clean"],
  },
  {
    slug: "water-damage-recovery",
    name: "Flood & Water Damage Recovery",
    categories: ["restoration"],
    summary: "Water extraction, drying and monitoring after leaks and flooding.",
    description:
      "Fast extraction and structured drying help limit secondary damage. We monitor moisture levels and keep records that can support your insurance claim. Outcomes depend on materials and how long water has been present.",
    includes: ["Water extraction", "Drying equipment set-up", "Moisture monitoring", "Documentation for insurers"],
    considerations: ["Contaminated water requires additional safety steps", "Some materials may need replacement rather than drying"],
    priceIds: ["flood", "drying"],
    keywords: ["flood", "water damage"],
  },
  {
    slug: "mould-removal-treatment",
    name: "Mould Removal & Treatment",
    categories: ["restoration"],
    summary: "Containment, removal and treatment of mould on affected surfaces.",
    description: "We identify affected areas, contain them where needed, and clean or remove contaminated materials. Underlying moisture issues must be resolved to prevent regrowth.",
    includes: ["Inspection", "Containment", "Treatment and removal", "Advice on moisture sources"],
    considerations: ["Quoted after inspection", "Regrowth can occur if moisture persists"],
    priceIds: [],
    keywords: ["mould", "mold"],
  },
  {
    slug: "meth-residue-screening",
    name: "Meth Testing & Decontamination",
    categories: ["restoration"],
    summary: "Meth residue testing, then decontamination and clearance where it's needed.",
    description: "Samples are collected following recognised NZ guidance and analysed by an accredited laboratory. If results are over the guideline level, we decontaminate affected areas and arrange clearance testing. Testing is priced by number of rooms.",
    includes: ["Room-by-room sampling", "Accredited laboratory analysis", "Written report", "Decontamination of affected areas", "Clearance testing"],
    considerations: ["Two-day turnaround available for an extra fee", "Decontamination is quoted after testing, based on results and property size"],
    priceIds: ["meth13", "meth46", "meth79", "meth1012", "methExpress"],
    keywords: ["meth test", "meth cleanup", "methamphetamine", "decontamination"],
  },
];

/* ─────────────────────────── Live catalogue ───────────────────────────
 * The site reads CATEGORIES and SERVICES. They start as the defaults and are
 * replaced (in place) with the catalogue saved in /admin, minus anything hidden.
 */

export interface Catalogue {
  categories: Category[];
  services: Service[];
}

export const DEFAULT_CATALOGUE: Catalogue = { categories: DEFAULT_CATEGORIES, services: DEFAULT_SERVICES };

export const CATEGORIES: Category[] = [...DEFAULT_CATEGORIES];
export const SERVICES: Service[] = [...DEFAULT_SERVICES];

/** What visitors see: hidden categories and services removed; services left with no visible category are hidden too. */
export function visibleCatalogue(c: Catalogue): Catalogue {
  const categories = c.categories.filter((x) => !x.hidden);
  const ids = new Set(categories.map((x) => x.id));
  const services = c.services
    .filter((s) => !s.hidden)
    .map((s) => ({ ...s, categories: s.categories.filter((id) => ids.has(id)) }))
    .filter((s) => s.categories.length > 0);
  return { categories, services };
}

export function setCatalogue(c: Catalogue) {
  const v = visibleCatalogue(c);
  CATEGORIES.splice(0, CATEGORIES.length, ...v.categories);
  SERVICES.splice(0, SERVICES.length, ...v.services);
}

export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const getCategory = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
export const servicesIn = (id: CategoryId) => SERVICES.filter((s) => s.categories.includes(id));

export function relatedServices(service: Service, limit = 3): Service[] {
  return SERVICES.filter((s) => s.slug !== service.slug && s.categories.some((c) => service.categories.includes(c))).slice(0, limit);
}

/* ─────────────────────────── Scroll animations ─────────────────────────── */

export type MotionKind =
  | "curtain"
  | "residential"
  | "carpet"
  | "upholstery"
  | "window"
  | "floor"
  | "tile"
  | "house"
  | "restoration"
  | "commercial"
  | "painting";

/** Which animated scene each major service's detail page shows. */
const MOTION_BY_SLUG: Record<string, MotionKind> = {
  "carpet-deep-refresh": "carpet",
  "curtain-care": "curtain",
  "blind-care": "window",
  "sofa-upholstery-refresh": "upholstery",
  "home-refresh": "residential",
  "move-out-detail": "residential",
  "office-care-programme": "commercial",
  "post-build-detail": "residential",
  "glass-care": "window",
  "oven-revive": "residential",
  "water-damage-recovery": "restoration",
  "mould-removal-treatment": "restoration",
  "meth-residue-screening": "restoration",
};

export const motionFor = (slug: string): MotionKind | undefined => MOTION_BY_SLUG[slug];
