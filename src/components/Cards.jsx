import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BorderGlow from "./BorderGlow";
import { easeCalm, motionTiming } from "../lib/motion";

const categories = [
  {
    title: "Stress Relief",
    description: "Soften tension with grounding breath and gentle body scans.",
    glow: "from-aura-bg/80 to-aura-bgSoft/40",
    path: "/stress-relief",
  },
  {
    title: "Focus",
    description: "Train attention with single-point concentration sessions.",
    glow: "from-aura-bg/78 to-aura-bgSoft/42",
    path: "/focus",
  },
  {
    title: "Sleep",
    description: "Wind down with slow-paced reflections and restorative calm.",
    glow: "from-aura-bg/76 to-aura-bgSoft/38",
    path: "/sleep",
  },
  {
    title: "Spiritual",
    description: "Deepen inner awareness through mantra and silent presence.",
    glow: "from-aura-bg/74 to-aura-bgSoft/36",
    path: "/spiritual",
  },
];

export default function Cards() {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <section
      id="categories"
      className="relative overflow-hidden px-6 pb-28 pt-20 md:px-10 md:pb-36"
    >
      <div className="section-blend section-blend-top absolute left-0 right-0 top-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f2e7_0%,#d1bfa3_100%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: motionTiming.sectionReveal, ease: easeCalm }}
        >
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-aura-text">
            Meditation Paths
          </p>
          <h2 className="temple-heading text-3xl font-medium sm:text-4xl md:text-5xl">
            Choose Your Practice
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {categories.map((category, index) => (
            <BorderGlow
              key={category.title}
              className="group cursor-pointer"
              borderRadius={28}
              glowColor="28 18 8"
              backgroundColor="rgba(248,242,231,0.86)"
              glowRadius={30}
              glowIntensity={0.75}
              coneSpread={28}
              colors={category.glow.includes("bg") ? ["rgba(248,242,231,0.18)", "rgba(209,191,163,0.12)"] : []}
            >
              <motion.article
                className="pointer-glow relative overflow-hidden rounded-3xl border border-aura-gold/20 bg-aura-card/85 p-6 [transform-style:preserve-3d] md:p-7"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.015, rotateX: -2, rotateY: 2 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: easeCalm }}
                onMouseMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
                  event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
                }}
                onClick={() => handleCardClick(category.path)}
              >
                <div
                  className={[
                    "pointer-events-none absolute inset-0 opacity-70 transition duration-500",
                    "bg-gradient-to-br",
                    category.glow,
                  ].join(" ")}
                />

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(248,242,231,0.24)_0%,rgba(209,191,163,0.12)_35%,rgba(248,242,231,0)_60%)] opacity-40" />

                <motion.div
                  className="pointer-events-none absolute -inset-1 rounded-3xl border border-aura-gold/0"
                  whileHover={{ borderColor: "rgba(28,18,8,0.22)" }}
                  transition={{ duration: 0.45 }}
                />

                <h3 className="relative text-xl font-medium text-aura-text md:text-2xl">
                  {category.title}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-aura-textSoft md:text-base">
                  {category.description}
                </p>
              </motion.article>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
}
