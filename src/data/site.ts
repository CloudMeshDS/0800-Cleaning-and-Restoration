/** Contact numbers. The first is the primary line (calls and WhatsApp); the landline takes calls only. */
const PRIMARY = { display: "+64 22 633 2500", tel: "tel:+64226332500", whatsapp: "https://wa.me/64226332500" };

export const PHONES: readonly { display: string; tel: string; whatsapp?: string }[] = [PRIMARY, { display: "09 951 1836", tel: "tel:+6499511836" }];

/** Business details shown across the site (header, footer, structured data). */
export const SITE = {
  name: "0800 Cleaning & Restoration",
  legalName: "0800 Cleaning & Restoration",
  tagline: "Clean Spaces. Extraordinary Living.",
  description:
    "Professional cleaning and property care for homes and businesses across New Zealand – carpets, curtains, upholstery, windows, floors and restoration.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.0800cleaningandrestoration.co.nz",
  phone: PRIMARY.display,
  phoneHref: PRIMARY.tel,
  whatsappHref: PRIMARY.whatsapp,
  email: "sales@0800cleaningandrestoration.co.nz",
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
