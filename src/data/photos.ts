/**
 * Photography used on the home page.
 *
 * These are free stock photos from Unsplash (Unsplash License: free for
 * commercial use, no attribution required). They're stand-ins – replace them
 * with the business's own job photos when available. Real before/after pairs
 * can be added later by giving a photo a `before` id.
 */

export interface Photo {
  /** Unsplash photo id; the image files live in public/assets/photos. */
  id: string;
  alt: string;
  /** CSS object-position: keeps the subject in frame when the photo is cropped. */
  position?: string;
}

/**
 * Photos are self-hosted (public/assets/photos/{id}-{width}.webp) so visitors'
 * browsers never contact a third-party image server.
 */
export const photoUrl = (id: string, w: number) => `/assets/photos/${id}-${w}.webp`;

export const photoSrcSet = (id: string, widths = [640, 960, 1400, 1920, 2560]) => widths.map((w) => `${photoUrl(id, w)} ${w}w`).join(", ");

export const PHOTOS = {
  hero: { id: "auckland-home-clean", alt: "A cleaner wiping a large window with the Auckland harbour, skyline and Sky Tower beyond", position: "50% 50%" },
  exterior: { id: "1783125127341-81112b795c23", alt: "A white modern house with garage doors and a wide concrete driveway", position: "55% 60%" },
  windows: { id: "1656122381069-9ec666d95cf1", alt: "A bright living room with tall windows looking onto greenery", position: "50% 35%" },
  curtains: { id: "1691036562132-56a310d4b789", alt: "Cream curtains beside a tall black-framed window", position: "55% 40%" },
  carpet: { id: "1560448204-603b3fc33ddc", alt: "A living room with a large soft rug, sofa and coffee table", position: "50% 65%" },
  sofa: { id: "1583847268964-b28dc8f51f92", alt: "A light grey sofa with cushions and a knitted throw", position: "50% 62%" },
  floor: { id: "1560184897-1ee3713708ee", alt: "A living room with polished timber floors and large windows", position: "50% 70%" },
  kitchen: { id: "1639173925921-5d5fd027713c", alt: "A white kitchen with a marble island and bar stools", position: "50% 55%" },
  tiles: { id: "1782805153014-403499df9207", alt: "A tiled bathroom with a floating vanity and towel rail", position: "45% 55%" },
  paint: { id: "1615800001718-73ba40557cb3", alt: "A bedroom with a deep green feature wall", position: "50% 45%" },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;

export type Stain = "dust" | "grease" | "haze" | "scuff" | "grout" | "residue" | "flood" | "clean";

/**
 * A service card photo shown half cleaned (see SplitPhoto). area outlines the
 * surface being cleaned, as polygon points in % of the 4:3 card; split is
 * where clean meets dirty, across that surface.
 */
export interface ServicePhoto {
  id: string;
  position?: string;
  stain: Stain;
  area: string;
  split: number;
}

/** Home-page service cards. Stored at 640 and 960 wide only. */
export const cardSrcSet = (id: string) => photoSrcSet(id, [640, 960]);

export const SERVICE_PHOTOS: Record<string, ServicePhoto> = {
  "carpet-deep-refresh": { id: "1560448204-603b3fc33ddc", stain: "dust", area: "0% 60%, 100% 57%, 100% 100%, 0% 100%", split: 50 },
  "curtain-care": { id: "1691036562132-56a310d4b789", position: "35% 50%", stain: "dust", area: "18% 0%, 56% 0%, 56% 88%, 18% 88%", split: 37 },
  "blind-care": { id: "1581578731548-c64695cc6952", position: "50% 35%", stain: "dust", area: "76% 0%, 100% 0%, 100% 100%, 76% 100%", split: 87 },
  "sofa-upholstery-refresh": { id: "1686178827149-6d55c72d81df", stain: "dust", area: "0% 72%, 25% 63%, 52% 66%, 52% 100%, 0% 100%", split: 26 },
  "home-refresh": { id: "1758273238415-01ec03d9ef27", stain: "scuff", area: "0% 83%, 56% 83%, 52% 100%, 0% 100%", split: 26 },
  "move-out-detail": { id: "1758272421751-963195322eaa", position: "70% 50%", stain: "dust", area: "33% 86%, 100% 80%, 100% 100%, 33% 100%", split: 62 },
  "office-care-programme": { id: "1781637590564-01c65dbf2039", position: "60% 40%", stain: "dust", area: "0% 68%, 76% 68%, 90% 100%, 0% 100%", split: 45 },
  "post-build-detail": { id: "1581578949510-fa7315c4c350", position: "60% 45%", stain: "dust", area: "18% 86%, 90% 86%, 94% 100%, 14% 100%", split: 50 },
  "glass-care": { id: "1721620780493-e905708eba0b", stain: "haze", area: "53% 10%, 85% 2%, 88% 90%, 56% 96%", split: 70 },
  "oven-revive": { id: "1677727852911-74e9d5269003", stain: "grease", area: "0% 36%, 88% 36%, 100% 52%, 100% 100%, 0% 100%", split: 50 },
  "water-damage-recovery": { id: "1560184897-1ee3713708ee", stain: "flood", area: "0% 66%, 44% 62%, 100% 58%, 100% 100%, 0% 100%", split: 50 },
  "mould-removal-treatment": { id: "1708895140733-8873a8b8ee0f", stain: "clean", area: "0% 0%, 100% 0%, 100% 100%, 0% 100%", split: 50 },
  "meth-residue-screening": { id: "1742483359033-13315b247c74", position: "50% 30%", stain: "residue", area: "0% 0%, 100% 0%, 100% 62%, 72% 62%, 72% 100%, 0% 100%", split: 34 },
  "tile-grout-revive": { id: "1718152421680-d1580e843cc9", position: "50% 40%", stain: "grout", area: "15% 86%, 100% 70%, 100% 100%, 12% 100%", split: 70 },
  "vinyl-floor-refresh": { id: "1669101602124-f5b78895d91c", position: "70% 60%", stain: "scuff", area: "0% 73%, 100% 70%, 100% 100%, 0% 100%", split: 50 },
  "construction-cleaning": { id: "1772209415876-76ea6cbc2f0c", stain: "dust", area: "0% 62%, 100% 52%, 100% 100%, 0% 100%", split: 50 },
  "medical-cleaning": { id: "1669101602108-fa5ba89507ee", position: "60% 60%", stain: "scuff", area: "0% 64%, 100% 62%, 100% 100%, 0% 100%", split: 50 },
  "office-cleaning": { id: "1627905646269-7f034dcc5738", stain: "grease", area: "0% 38%, 32% 38%, 32% 100%, 0% 100%", split: 30 },
};

/** Used for services added in /admin, which have no photo of their own. */
export const FALLBACK_SERVICE_PHOTO: ServicePhoto = SERVICE_PHOTOS["office-cleaning"];
