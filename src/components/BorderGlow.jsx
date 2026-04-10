function normalizeRadius(value) {
  if (typeof value === "number") {
    return `${value}px`;
  }

  return value ?? "28px";
}

export default function BorderGlow({
  children,
  className = "",
  style,
  edgeSensitivity = 30,
  glowColor = "28 18 8",
  backgroundColor = "transparent",
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = [],
}) {
  const radius = normalizeRadius(borderRadius);
  const borderGlow = `0 0 0 1px rgb(${glowColor} / 0.18), 0 0 ${glowRadius}px rgb(${glowColor} / ${Math.min(
    0.28 * glowIntensity,
    0.5
  )})`;
  const innerGlow = `inset 0 0 0 1px rgb(255 255 255 / 0.26)`;
  const accentGlow = colors.length
    ? `radial-gradient(circle at 20% 18%, ${colors[0]} 0%, transparent ${coneSpread}%), radial-gradient(circle at 82% 78%, ${colors[1] ?? colors[0]} 0%, transparent ${coneSpread + 8}%)`
    : `radial-gradient(circle at 50% 50%, rgb(${glowColor} / ${Math.min(0.14 * glowIntensity, 0.2)}), transparent ${coneSpread}%)`;

  return (
    <div
      className={["relative overflow-hidden", className].join(" ")}
      style={{
        ...style,
        borderRadius: radius,
        backgroundColor,
        boxShadow: borderGlow,
      }}
      data-edge-sensitivity={edgeSensitivity}
    >
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0",
          animated ? "animate-pulse" : "",
        ].join(" ")}
        style={{
          borderRadius: radius,
          boxShadow: `${innerGlow}, ${borderGlow}`,
          background: accentGlow,
          opacity: animated ? 0.92 : 1,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1px]"
        style={{
          borderRadius: radius,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32)",
          opacity: 0.85,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}