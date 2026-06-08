// Curio brand mark — a blue folded "C" + wordmark, rebuilt as an inline SVG so
// it stays crisp at any size and needs no image asset. If you'd rather use the
// exact PNG, drop it in /public and swap LogoMark for a next/image.

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Curio"
    >
      <defs>
        <linearGradient id="curio-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        {/* Carves the C opening on the right as transparency (works on any bg). */}
        <mask id="curio-cut">
          <rect x="8" y="8" width="48" height="48" rx="16" fill="white" />
          <rect x="26" y="22" width="42" height="20" rx="10" fill="black" />
        </mask>
        {/* Keeps the folded corner inside the rounded square. */}
        <clipPath id="curio-clip">
          <rect x="8" y="8" width="48" height="48" rx="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#curio-clip)">
        <rect
          x="8"
          y="8"
          width="48"
          height="48"
          rx="16"
          fill="url(#curio-c)"
          mask="url(#curio-cut)"
        />
        {/* Page-fold accent, top-left */}
        <path d="M8 26 L26 8 L26 26 Z" fill="#93c5fd" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  markClassName = "h-7 w-7",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className={markClassName} />
      <span className="text-xl font-semibold tracking-tight text-[#1e3a8a]">
        Curio
      </span>
    </span>
  );
}
