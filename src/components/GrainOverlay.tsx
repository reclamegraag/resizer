export function GrainOverlay() {
  return (
    <svg
      className="grain-overlay fixed inset-0 w-full h-full pointer-events-none z-[9999] mix-blend-overlay opacity-60"
      aria-hidden="true"
    >
      <filter id="grain-filter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          stitchTiles="stitch"
        />
        <feColorMatrix
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  );
}
