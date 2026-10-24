/**
 * The view through a window: soft sky, layered hills and harbour.
 * Pure SVG so it scales to any viewport with zero network cost.
 */
export function WindowView({ id = "wv", className = "" }: { id?: string; className?: string }) {
  return (
    <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfdfe3" />
          <stop offset=".55" stopColor="#eef1ea" />
          <stop offset="1" stopColor="#f7efe0" />
        </linearGradient>
        <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9c2c4" />
          <stop offset="1" stopColor="#c9d7d2" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx=".78" cy=".22" r=".5">
          <stop offset="0" stopColor="#fff8e6" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff8e6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill={`url(#${id}-sky)`} />
      <rect width="400" height="600" fill={`url(#${id}-sun)`} />
      <path d="M0 330 Q60 290 120 305 T250 285 T400 300 V600 H0Z" fill="#b8c7bd" opacity=".75" />
      <rect y="350" width="400" height="60" fill={`url(#${id}-sea)`} />
      <path d="M0 380 Q80 350 160 368 T300 360 T400 372 V600 H0Z" fill="#8fa696" />
      <path d="M0 430 Q90 395 200 418 T400 410 V600 H0Z" fill="#6f8a77" />
      <path d="M0 490 Q120 455 240 478 T400 470 V600 H0Z" fill="#4f6b5b" />
    </svg>
  );
}

/** Window frame overlay: slim mullions and a sill, drawn on top of the view. */
export function WindowFrame({ panes = 2 }: { panes?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 border-[6px] border-[#efece4] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06),inset_0_0_40px_rgb(0_0_0/0.06)]" />
      {Array.from({ length: panes - 1 }).map((_, i) => (
        <div key={i} className="absolute inset-y-0 w-[5px] -translate-x-1/2 bg-[#efece4] shadow-[0_0_0_1px_rgb(0_0_0/0.05)]" style={{ left: `${((i + 1) / panes) * 100}%` }} />
      ))}
      <div className="absolute inset-x-0 top-[38%] h-[5px] bg-[#efece4] shadow-[0_0_0_1px_rgb(0_0_0/0.05)]" />
      <div className="absolute -inset-x-3 -bottom-3 h-3 rounded-sm bg-[#e9e5da] shadow-[0_6px_14px_-6px_rgb(0_0_0/0.25)]" />
    </div>
  );
}
