import { motion } from "framer-motion";
import Aurora from "../effects/Aurora";
import LiquidEther from "./LiquidEther";
import { easeCalm, motionTiming } from "../lib/motion";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16 md:px-10"
    >
      <div className="absolute inset-0 cosmic-bg" />
      <Aurora
        className="absolute inset-0"
        colorStops={["#f8f2e7", "#d1bfa3", "#1c1208"]}
        blend={1.05}
        amplitude={1.28}
        speed={0.45}
      />
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-100">
        <LiquidEther
          mouseForce={24}
          cursorSize={120}
          isViscous
          viscous={34}
          colors={["#f8f2e7", "#d1bfa3", "#1c1208"]}
          autoDemo
          autoSpeed={0.62}
          autoIntensity={2.8}
          isBounce={false}
          resolution={0.65}
        />
      </div>
      <div className="grain-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,242,231,0.08)_0%,rgba(209,191,163,0.18)_68%,rgba(248,242,231,0.32)_100%)]" />

      <motion.div
        className="pointer-glow glass-surface relative z-10 mx-auto mt-12 max-w-4xl px-7 py-12 text-center md:mt-[11rem] md:px-12 md:py-14"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTiming.heroReveal, ease: easeCalm }}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
        }}
      >
            <motion.p
              className="mb-6 inline-flex items-center rounded-full border border-aura-gold/35 bg-aura-card/80 px-4 py-2 text-xs uppercase tracking-[0.22em] text-aura-text backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: motionTiming.sectionReveal }}
            >
              Guided Meditation Experience
            </motion.p>

        <motion.h1
          className="aura-title text-5xl leading-tight sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: motionTiming.heroReveal, ease: easeCalm }}
        >
          Enter Inner Peace
        </motion.h1>

        <motion.p
          className="aura-copy mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: motionTiming.textReveal, ease: easeCalm }}
        >
          Breathe. Relax. Be Present.
        </motion.p>

        <motion.div
          className="mx-auto mt-10 h-px w-40 bg-gradient-to-r from-transparent via-aura-gold/70 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.9, duration: motionTiming.heroReveal, ease: "easeInOut" }}
        />

        <motion.a
          href="#breathing"
          className="aura-button hero-cta mt-9 inline-flex"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: motionTiming.sectionReveal }}
        >
          Begin Breathing
        </motion.a>
      </motion.div>

      <div className="section-blend section-blend-bottom absolute bottom-0 left-0 right-0" />
    </section>
  );
}
