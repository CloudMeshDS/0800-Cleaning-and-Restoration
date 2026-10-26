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
  hero: { id: "1780444628240-5ff29bf93f7f", alt: "A modern two-storey home with a sunny lawn and concrete driveway", position: "60% 55%" },
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
