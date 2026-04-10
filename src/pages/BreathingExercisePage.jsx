import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import SplitText from "../components/SplitText";

const phaseSequence = [
  { label: "Inhale", durationMs: 6000, scale: 1.12 },
  { label: "Hold", durationMs: 3000, scale: 1.12 },
  { label: "Exhale", durationMs: 6000, scale: 0.9 },
  { label: "Hold", durationMs: 3000, scale: 0.9 },
];

const breathingQuotes = [
  "Breathe in slowly… feel the calm enter. Breathe out gently… let the stress leave.",
  "With every inhale, you bring in peace. With every exhale, you release tension.",
  "Your breath is your anchor — return to it whenever your mind drifts.",
  "Inhale deeply through the nose… hold… exhale softly through the mouth.",
  "Let your breath be natural, slow, and steady — like waves on a calm shore.",
];

export default function BreathingExercisePage() {
  const shouldReduceMotion = useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteReady, setQuoteReady] = useState(false);

  const phase = useMemo(() => phaseSequence[phaseIndex], [phaseIndex]);
  const quote = useMemo(() => breathingQuotes[quoteIndex], [quoteIndex]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhaseIndex((current) => (current + 1) % phaseSequence.length);
    }, phase.durationMs);

    return () => window.clearTimeout(timer);
  }, [phase.durationMs, phaseIndex]);

  useEffect(() => {
    setQuoteReady(false);
  }, [quoteIndex]);

  useEffect(() => {
    if (!quoteReady) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setQuoteIndex((current) => (current + 1) % breathingQuotes.length);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [quoteReady]);

  const handleAnimationComplete = () => {
    setQuoteReady(true);
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16 md:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(248,242,231,0.6),transparent_42%),radial-gradient(circle_at_75%_85%,rgba(209,191,163,0.42),transparent_40%),linear-gradient(180deg,#f8f2e7_0%,#d1bfa3_100%)]" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <Link
          to="/"
          className="mb-8 rounded-full border border-aura-gold/50 bg-aura-card/75 px-4 py-2 text-xs uppercase tracking-[0.18em] text-aura-gold transition hover:bg-aura-card"
        >
          Back To Home
        </Link>

        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-aura-text">Guided Breathing</p>
        <h1 className="temple-heading text-3xl font-medium sm:text-4xl md:text-5xl">Follow The Circle</h1>

        <div className="relative mt-12 flex h-80 w-80 items-center justify-center sm:h-[22rem] sm:w-[22rem]">
          <motion.div
            className="absolute h-full w-full rounded-full bg-gradient-to-b from-aura-bg/45 via-aura-bgSoft/25 to-transparent blur-3xl"
            animate={
              shouldReduceMotion
                ? { scale: 1, opacity: 0.25 }
                : { scale: phase.scale * 1.02, opacity: phase.label === "Hold" ? 0.26 : 0.34 }
            }
            transition={{ duration: shouldReduceMotion ? 0 : phase.durationMs / 1000, ease: "easeInOut" }}
          />

          <motion.div
            className="pointer-glow breathing-circle relative z-10 flex h-56 w-56 items-center justify-center rounded-full border border-aura-gold/45 bg-gradient-to-b from-aura-bg/85 via-aura-bgSoft/65 to-transparent shadow-[0_0_56px_rgba(28,18,8,0.14),0_0_34px_rgba(28,18,8,0.08)] sm:h-64 sm:w-64"
            animate={shouldReduceMotion ? { scale: 1 } : { scale: phase.scale }}
            transition={{ duration: shouldReduceMotion ? 0 : phase.durationMs / 1000, ease: "easeInOut" }}
          >
            <motion.span
              key={phase.label + phaseIndex}
              className="text-base uppercase tracking-[0.26em] text-aura-gold sm:text-lg"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
            >
              {phase.label}
            </motion.span>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            className="aura-copy mt-10 max-w-xl text-sm leading-relaxed sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75 }}
          >
            <SplitText
              text={quote}
              className="text-base font-medium leading-relaxed text-center sm:text-lg"
              delay={50}
              duration={1.25}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
              showCallback
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}