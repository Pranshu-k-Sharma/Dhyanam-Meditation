import "./LaserFlowDrop.css";

const drops = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: 4 + index * 5.3,
  delay: (index % 6) * 0.45,
  duration: 3.4 + (index % 5) * 0.55,
  height: 95 + (index % 4) * 32,
  opacity: 0.34 + (index % 3) * 0.12,
}));

export default function LaserFlowDrop() {
  return (
    <div className="laser-drop-layer" aria-hidden="true">
      <div className="laser-drop-glow" />
      {drops.map((drop) => (
        <span
          key={drop.id}
          className="laser-drop-line"
          style={{
            left: `${drop.left}%`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
            height: `${drop.height}px`,
            opacity: drop.opacity,
          }}
        />
      ))}
    </div>
  );
}
