import "./MagicRings.css";

const ringDefaults = {
  color: "#fc42ff",
  colorTwo: "#42fcff",
  ringCount: 5,
  speed: 1,
  attenuation: 10,
  lineThickness: 2,
  baseRadius: 0.35,
  radiusStep: 0.1,
  scaleRate: 0.1,
  opacity: 1,
  blur: 0,
  noiseAmount: 0.1,
  rotation: 0,
  ringGap: 1.5,
  fadeIn: 0.7,
  fadeOut: 0.5,
  followMouse: false,
  mouseInfluence: 0.2,
  hoverScale: 1.2,
  parallax: 0.05,
  clickBurst: false,
};

export default function MagicRings(props) {
  const settings = { ...ringDefaults, ...props };
  const rings = Array.from({ length: settings.ringCount }, (_, index) => {
    const radius = settings.baseRadius + index * settings.radiusStep;
    const size = Math.max(18, radius * 100);
    const ringOpacity = Math.max(0.26, settings.opacity * (1 - index / (settings.ringCount * 1.05)));
    const delay = index * 0.68;
    const duration = Math.max(8.5, 19 / Math.max(settings.speed, 0.1) + index * 0.92);
    const segment = Math.max(18, 110 - index * 5);

    return {
      id: index,
      size,
      ringOpacity,
      delay,
      duration,
      segment,
      angle: settings.rotation + index * settings.ringGap * 8,
    };
  });

  return (
    <div
      className="magic-rings-root"
      data-follow-mouse={settings.followMouse}
      data-click-burst={settings.clickBurst}
      style={{
        ["--magic-ring-color"]: settings.color,
        ["--magic-ring-color-two"]: settings.colorTwo,
        ["--magic-ring-thickness"]: `${settings.lineThickness}px`,
        ["--magic-ring-blur"]: `${settings.blur}px`,
        ["--magic-ring-scale-rate"]: settings.scaleRate,
        ["--magic-ring-noise"]: settings.noiseAmount,
        ["--magic-ring-fade-in"]: settings.fadeIn,
        ["--magic-ring-fade-out"]: settings.fadeOut,
        ["--magic-ring-parallax"]: settings.parallax,
        ["--magic-ring-attenuation"]: settings.attenuation,
        ["--magic-ring-mouse-influence"]: settings.mouseInfluence,
        ["--magic-ring-hover-scale"]: settings.hoverScale,
      }}
    >
      <svg className="magic-rings-svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="magic-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={settings.color} />
            <stop offset="100%" stopColor={settings.colorTwo} />
          </linearGradient>
          <filter id="magic-ring-soften">
            <feGaussianBlur stdDeviation={Math.max(0, settings.blur)} />
          </filter>
        </defs>

        {rings.map((ring) => (
          <g
            key={ring.id}
            className="magic-ring-group"
            style={{
              animationDuration: `${ring.duration}s`,
              animationDelay: `${ring.delay}s`,
              opacity: ring.ringOpacity,
            }}
          >
            <circle
              cx="300"
              cy="200"
              r={ring.size}
              fill="none"
              stroke="url(#magic-ring-gradient)"
              strokeWidth={settings.lineThickness}
              strokeDasharray={`${ring.segment} ${ring.segment * 1.6}`}
              strokeLinecap="round"
              filter={settings.blur > 0 ? "url(#magic-ring-soften)" : undefined}
              style={{
                transformOrigin: "300px 200px",
                animationDuration: `${ring.duration}s`,
                animationDelay: `${ring.delay}s`,
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}