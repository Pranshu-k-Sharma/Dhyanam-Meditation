import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BorderGlow from "./BorderGlow";
import { easeCalm, motionTiming } from "../lib/motion";

const mantras = [
  "Hare Krishna Hare Krishna, Krishna Krishna Hare Hare, Hare Rama Hare Rama, Rama Rama Hare Hare",
  "Om Tryambakam Yajamahe Sugandhim Pushtivardhanam Urvarukamiva Bandhanan Mrityor Mukshiya Maamritat",
  "Om Dyauh Shanti Antariksham Shanti Prithvi Shanti Apah Shanti Oshadhayah Shanti Vanaspatayah Shanti Vishvedevah Shanti Brahma Shanti Sarvam Shanti Shanti Reva Shanti Sa Ma Shanti Om Shanti Shanti Shanti",
  "Om Bhur Bhuvah Swaha Tat Savitur Varenyam Bhargo Devasya Dheemahi Dhiyo Yo Nah Prachodayat",
  "Ya Devi Sarva Bhuteshu Shakti Rupena Samsthita Namastasyai Namastasyai Namastasyai Namo Namah",
];

export default function Mantra() {
  const [currentMantraIndex, setCurrentMantraIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const currentMantra = mantras[currentMantraIndex];

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleText(currentMantra);
      return undefined;
    }

    if (!isTyping) {
      return undefined;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(currentMantra.slice(0, index));

      if (index >= currentMantra.length) {
        window.clearInterval(timer);
        setIsTyping(false);

        // Start the hold timer for 7-8 seconds
        const holdTimer = window.setTimeout(() => {
          setCurrentMantraIndex((prev) => (prev + 1) % mantras.length);
          setVisibleText("");
          setIsTyping(true);
        }, 7500 + Math.random() * 1000); // 7.5-8.5 seconds

        return () => window.clearTimeout(holdTimer);
      }
    }, 38);

    return () => window.clearInterval(timer);
  }, [currentMantra, isTyping, shouldReduceMotion]);

  return (
    <section
      id="mantra"
      className="relative overflow-hidden px-6 py-28 md:px-10 md:py-36"
    >
      <div className="section-blend section-blend-top absolute left-0 right-0 top-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,242,231,0.52),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(209,191,163,0.34),transparent_48%),linear-gradient(180deg,#f8f2e7_0%,#d1bfa3_100%)]" />

      <motion.div
        className="relative z-10 mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: motionTiming.textReveal, ease: easeCalm }}
      >
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-aura-text">
          Sacred Mantra
        </p>

        <h2 className="temple-heading text-3xl font-medium sm:text-4xl md:text-5xl">
          Let Sound Guide Stillness
        </h2>

        <BorderGlow
          className="relative mx-auto mt-10 max-w-3xl rounded-3xl"
          borderRadius={28}
          glowColor="28 18 8"
          backgroundColor="rgba(248,242,231,0.88)"
          glowRadius={34}
          glowIntensity={0.8}
          coneSpread={28}
        >
          <div className="px-6 py-8 md:px-10 md:py-10">
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-aura-gold/12 to-transparent"
            animate={shouldReduceMotion ? { opacity: 0.14 } : { x: ["-110%", "120%"] }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: motionTiming.shimmerLoop, repeat: Infinity, ease: "easeInOut" }
            }
          />

          <p className="relative z-10 text-base leading-relaxed text-aura-text sm:text-lg md:text-xl">
            <span className="text-aura-text">
              {visibleText}
            </span>
            <motion.span
              className="ml-1 inline-block h-5 w-[2px] bg-aura-gold/70 align-middle"
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0, 1, 0] }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </p>
          </div>
        </BorderGlow>
      </motion.div>

      <div className="section-blend section-blend-bottom absolute bottom-0 left-0 right-0" />
    </section>
  );
}
