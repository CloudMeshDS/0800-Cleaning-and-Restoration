/** Contact numbers – each takes calls and WhatsApp. The first is the primary line. */
export const PHONES = [
  { display: "+64 22 455 1700", tel: "tel:+64224551700", whatsapp: "https://wa.me/64224551700" },
  { display: "+64 22 321 0362", tel: "tel:+64223210362", whatsapp: "https://wa.me/64223210362" },
] as const;

/**
 * Business details. The email is still a placeholder – replace
 * it before launch.
 */
export const SITE = {
  name: "0800 Cleaning & Restoration",
  legalName: "0800 Cleaning & Restoration",
  tagline: "Clean Spaces. Extraordinary Living.",
  description:
    "Professional cleaning and property care for homes and businesses across New Zealand – carpets, curtains, upholstery, windows, floors and restoration.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.0800cleaningandrestoration.co.nz",
  phone: PHONES[0].display,
  phoneHref: PHONES[0].tel,
  whatsappHref: PHONES[0].whatsapp,
  // TODO: replace with the real inbox before launch.
  email: "hello@example.co.nz",
  hours: "Mon–Fri 7:30am–6pm · Sat 8am–2pm",
} as const;

/**
 * Regions offered in the enquiry form. Availability varies by service and is
 * confirmed per enquiry – the site never promises coverage.
 */
export const SERVICE_REGIONS = [
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Wellington",
  "Canterbury",
  "Otago",
  "Somewhere else in NZ",
] as const;

export type ServiceRegion = (typeof SERVICE_REGIONS)[number];
