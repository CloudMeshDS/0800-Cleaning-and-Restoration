"use client";

import { cardSrcSet, photoUrl, type ServicePhoto } from "@/data/photos";
import { FILTER, OVERLAY } from "./DirtyPhoto";

/**
 * Service-card photo shown half "before", half "after": the left half is the
 * same photo dulled with the service's grime, split by a fine line. Hovering
 * the card (a `group`) sweeps the grime away.
 */
export function SplitPhoto({ photo }: { photo: ServicePhoto }) {
  const img = (style?: React.CSSProperties) => (
    // eslint-disable-next-line @next/next/no-img-element -- self-hosted images with a responsive srcset
    <img
      src={photoUrl(photo.id, 640)}
      srcSet={cardSrcSet(photo.id)}
      sizes="(min-width: 1024px) 25vw, 50vw"
      alt=""
      loading="lazy"
      decoding="async"
      className="absolute inset-0 size-full object-cover"
      style={{ objectPosition: photo.position ?? "50% 50%", ...style }}
    />
  );
  return (
    <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-soft) group-hover:scale-105" aria-hidden>
      {img()}
      <span className="absolute inset-0 transition-[clip-path] duration-700 ease-(--ease-soft) [clip-path:inset(0_50%_0_0)] group-hover:[clip-path:inset(0_100%_0_0)]">
        {img({ filter: FILTER[photo.grime] })}
        <span className="absolute inset-0" style={OVERLAY[photo.grime]} />
      </span>
      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/85 shadow-[0_0_10px_rgb(255_255_255/0.6)] transition-[left,opacity] duration-700 ease-(--ease-soft) group-hover:left-0 group-hover:opacity-0" />
    </span>
  );
}
