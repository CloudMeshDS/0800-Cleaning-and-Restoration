/** Wordmark: a window arch with a single light beam, then "0800" over a tracked "Cleaning & Restoration". */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 28 32" className="h-8 w-auto" aria-hidden>
        <path d="M2 31V13a12 12 0 0 1 24 0v18" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M14 1v30M2 18h24" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
        <path d="M17 31 26 22v9z" fill="currentColor" opacity=".25" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.45rem] font-normal tracking-[-0.01em]">0800</span>
        <span className="mt-[3px] text-[0.52rem] font-semibold uppercase tracking-[0.24em] opacity-80">Cleaning &amp; Restoration</span>
      </span>
    </span>
  );
}
