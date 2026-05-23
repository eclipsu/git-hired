function HeroNoiseOverlay() {
  return (
    <svg
      className="app-noise pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="app-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#app-noise)" />
    </svg>
  );
}

export default function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-aurora relative min-h-screen">
      <HeroNoiseOverlay />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
