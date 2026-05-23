function HeroNoiseOverlay() {
  return (
    <svg
      className="hero-noise h-full w-full"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="analyze-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#analyze-noise)" />
    </svg>
  );
}

export { HeroNoiseOverlay };
