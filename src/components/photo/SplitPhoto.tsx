import type { CSSProperties } from "react";
import { cardSrcSet, photoUrl, type ServicePhoto, type Stain } from "@/data/photos";
import { noise } from "@/lib/textures";

/**
 * Service-card photo showing the job half done. Only the surface being
 * cleaned (`area`, a polygon in % of the card) is dirtied, on one side of
 * `split`; everything else in the photo is untouched. Static: no animation.
 */

const STAIN: Record<Stain, { filter: string; overlay: CSSProperties }> = {
  dust: {
    filter: "sepia(0.55) saturate(0.7) brightness(0.74) contrast(0.92)",
    overlay: {
      backgroundColor: "rgb(120 92 55 / 0.32)",
      backgroundImage: `${noise({ freq: 0.03, octaves: 4, alpha: 0.6, rgb: "90 68 38", size: 400, seed: 11 })}, ${noise({ freq: 1.2, alpha: 0.4, rgb: "70 55 35", seed: 12 })}`,
      backgroundSize: "400px 400px, 160px 160px",
    },
  },
  grease: {
    filter: "sepia(0.65) saturate(0.9) brightness(0.72) contrast(0.95)",
    overlay: {
      backgroundColor: "rgb(150 108 40 / 0.3)",
      backgroundImage: `${noise({ freq: 0.022, octaves: 4, alpha: 0.65, rgb: "110 75 25", size: 400, seed: 13 })}, ${noise({ freq: 0.9, alpha: 0.35, rgb: "90 60 20", seed: 14 })}`,
      backgroundSize: "400px 400px, 160px 160px",
    },
  },
  haze: {
    filter: "brightness(1.05) contrast(0.7) saturate(0.6) blur(0.8px)",
    overlay: {
      backgroundColor: "rgb(230 226 214 / 0.35)",
      backgroundImage: `repeating-linear-gradient(100deg, rgb(255 255 255 / 0.16) 0 2px, transparent 2px 14px), ${noise({ freq: 0.025, octaves: 3, alpha: 0.55, rgb: "200 195 180", size: 400, seed: 15 })}`,
      backgroundSize: "auto, 400px 400px",
    },
  },
  scuff: {
    filter: "saturate(0.6) brightness(0.8) contrast(0.9) sepia(0.3)",
    overlay: {
      backgroundColor: "rgb(110 100 85 / 0.3)",
      backgroundImage: `repeating-linear-gradient(118deg, rgb(60 50 40 / 0.07) 0 2px, transparent 2px 37px), repeating-linear-gradient(64deg, rgb(60 50 40 / 0.05) 0 1px, transparent 1px 53px), ${noise({ freq: 0.03, octaves: 4, alpha: 0.55, rgb: "80 70 55", size: 400, seed: 16 })}`,
      backgroundSize: "auto, auto, 400px 400px",
    },
  },
  grout: {
    filter: "saturate(0.5) brightness(0.7) contrast(0.95) sepia(0.35)",
    overlay: {
      backgroundColor: "rgb(80 66 45 / 0.35)",
      backgroundImage: noise({ freq: 0.04, octaves: 4, alpha: 0.65, rgb: "60 48 30", size: 400, seed: 17 }),
      backgroundSize: "400px 400px",
    },
  },
  residue: {
    filter: "sepia(0.8) saturate(1.3) brightness(0.86) contrast(0.92)",
    overlay: {
      backgroundColor: "rgb(175 140 60 / 0.3)",
      backgroundImage: noise({ freq: 0.02, octaves: 3, alpha: 0.5, rgb: "140 110 40", size: 400, seed: 18 }),
      backgroundSize: "400px 400px",
    },
  },
  flood: {
    filter: "sepia(0.7) saturate(0.8) brightness(0.68) contrast(0.95)",
    overlay: {
      backgroundColor: "rgb(105 78 42 / 0.42)",
      backgroundImage: `linear-gradient(180deg, rgb(70 50 25 / 0.5), transparent 18%), ${noise({ freq: 0.018, octaves: 4, alpha: 0.6, rgb: "80 58 30", size: 400, seed: 19 })}`,
      backgroundSize: "100% 100%, 400px 400px",
    },
  },
  /** The photo is already dirty: this cleans its `after` side instead. */
  clean: {
    filter: "grayscale(1) brightness(1.35) contrast(0.55)",
    overlay: { backgroundColor: "rgb(244 242 236 / 0.82)" },
  },
};

export function SplitPhoto({ photo }: { photo: ServicePhoto }) {
  const img = (style?: CSSProperties) => (
    // eslint-disable-next-line @next/next/no-img-element -- self-hosted images with a responsive srcset
    <img
      src={photoUrl(photo.id, 640)}
      srcSet={cardSrcSet(photo.id)}
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      alt=""
      loading="lazy"
      decoding="async"
      className="absolute inset-0 size-full object-cover"
      style={{ objectPosition: photo.position ?? "50% 50%", ...style }}
    />
  );
  const stain = STAIN[photo.stain];
  // Dirt sits left of the split; a "clean" photo is cleaned right of it.
  const side = photo.stain === "clean" ? `inset(0 0 0 ${photo.split}%)` : `inset(0 ${100 - photo.split}% 0 0)`;
  return (
    <span className="absolute inset-0" aria-hidden>
      {img()}
      <span className="absolute inset-0" style={{ clipPath: `polygon(${photo.area})` }}>
        <span className="absolute inset-0" style={{ clipPath: side }}>
          {img({ filter: stain.filter })}
          <span className="absolute inset-0" style={stain.overlay} />
        </span>
        <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white/90 shadow-[0_0_8px_rgb(255_255_255/0.7)]" style={{ left: `${photo.split}%` }} />
      </span>
    </span>
  );
}
