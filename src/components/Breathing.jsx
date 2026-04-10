import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { easeCalm, motionTiming } from "../lib/motion";

const breathCycle = {
  duration: motionTiming.breathCycle,
  ease: "easeInOut",
  repeat: Infinity,
};

export default function Breathing() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  return (
    <section
      id="breathing"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-20 md:px-10"
    >
      <div className="section-blend section-blend-top absolute left-0 right-0 top-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(248,242,231,0.5),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(209,191,163,0.35),transparent_40%),linear-gradient(180deg,#f8f2e7_0%,#d1bfa3_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <motion.p
          className="mb-4 text-xs uppercase tracking-[0.22em] text-aura-text"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: motionTiming.sectionReveal, ease: easeCalm }}
        >
          Breathing Exercise
        </motion.p>

        <motion.h2
          className="temple-heading text-3xl font-medium sm:text-4xl md:text-5xl"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: motionTiming.sectionReveal, delay: 0.1, ease: easeCalm }}
        >
          Follow The Rhythm
        </motion.h2>

        <div className="relative mt-12 flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
          <motion.div
            className="absolute h-full w-full rounded-full bg-gradient-to-b from-aura-bg/40 via-aura-bgSoft/20 to-transparent blur-3xl"
            animate={
              shouldReduceMotion
                ? { scale: 1, opacity: 0.3 }
                : { scale: [0.9, 1.1, 0.9], opacity: [0.15, 0.35, 0.15] }
            }
            transition={shouldReduceMotion ? { duration: 0 } : breathCycle}
          />

          <motion.button
            type="button"
            className="pointer-glow breathing-circle relative flex h-52 w-52 cursor-pointer items-center justify-center rounded-full border border-aura-gold/45 bg-gradient-to-b from-aura-bg/80 via-aura-bgSoft/60 to-transparent shadow-[0_0_56px_rgba(28,18,8,0.14),0_0_34px_rgba(28,18,8,0.08)] transition-transform duration-300 hover:scale-[1.02] sm:h-56 sm:w-56"
            animate={shouldReduceMotion ? { scale: 1 } : { scale: [0.92, 1.08, 0.92] }}
            transition={shouldReduceMotion ? { duration: 0 } : breathCycle}
            onClick={() => navigate("/breathing-exercise")}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
              event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
            }}
            aria-label="Open guided breathing exercise"
          >
            <motion.span
              className="text-sm uppercase tracking-[0.28em] text-aura-gold"
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0.6, 1, 0.6] }}
              transition={shouldReduceMotion ? { duration: 0 } : breathCycle}
            >
              Inhale Exhale
            </motion.span>
          </motion.button>
        </div>

        <motion.p
          className="aura-copy mt-10 max-w-xl text-sm leading-relaxed sm:text-base"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: motionTiming.textReveal, delay: 0.2, ease: easeCalm }}
        >
          Tap the circle to start breathing exercise.
        </motion.p>
      </div>

      <div className="section-blend section-blend-bottom absolute bottom-0 left-0 right-0" />
    </section>
  );
}
