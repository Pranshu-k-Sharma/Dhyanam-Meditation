import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MagicRings from "./MagicRings";

const meditationQuotes = [
  "Yoga is the stilling of the fluctuations of the mind. — Yoga Sutras of Patanjali.",
  "The soul is calm and steady, like a flame in a windless place. — Bhagavad Gita",
  "From stillness comes clarity, from breath comes life. — inspired by Upanishads",
  "The quality of your life depends on the quality of your inner experience. — Sadhguru",
  "The mind is everything. What you think, you become. — Swami Vivekananda",
];

const quotePositions = [
  { side: "left", className: "left-4 top-1/2 -translate-y-1/2" },
  { side: "right", className: "right-4 top-1/2 -translate-y-1/2" },
  { side: "top", className: "top-4 left-1/2 -translate-x-1/2" },
  { side: "bottom", className: "bottom-4 left-1/2 -translate-x-1/2" },
  { side: "top-left", className: "top-4 left-4" },
  { side: "top-right", className: "top-4 right-4" },
  { side: "bottom-left", className: "bottom-4 left-4" },
  { side: "bottom-right", className: "bottom-4 right-4" },
];

export default function ReflectionSection() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(quotePositions[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % meditationQuotes.length);
      setCurrentPosition(quotePositions[Math.floor(Math.random() * quotePositions.length)]);
    }, 6000 + Math.random() * 3000); // 6-9 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="reflection" className="relative overflow-hidden px-6 py-20 md:px-10">
      <div className="flex justify-center">
        <div className="relative w-[min(650px,100%)]" style={{ width: '650px', height: '430px', position: 'relative' }}>
          <MagicRings
            color="#fc42ff"
            colorTwo="#42fcff"
            ringCount={7}
            speed={1.18}
            attenuation={10}
            lineThickness={2.4}
            baseRadius={0.35}
            radiusStep={0.115}
            scaleRate={0.1}
            opacity={1}
            blur={0}
            noiseAmount={0.1}
            rotation={0}
            ringGap={1.7}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            mouseInfluence={0.2}
            hoverScale={1.2}
            parallax={0.05}
            clickBurst={false}
          />
          <img
            src="/images/meditation.png"
            alt="Person sitting in meditation pose"
            className="absolute inset-0 z-10 h-full w-full object-contain object-center"
            loading="lazy"
          />

          <AnimatePresence>
            <motion.div
              key={`${currentQuoteIndex}-${currentPosition.side}`}
              className={`absolute z-20 w-64 rounded-lg border border-aura-gold/20 bg-aura-card/70 p-4 text-center text-sm text-aura-textSoft backdrop-blur-sm ${currentPosition.className}`}
              initial={{
                opacity: 0,
                x: currentPosition.side.includes("left") ? -50 : currentPosition.side.includes("right") ? 50 : 0,
                y: currentPosition.side.includes("top") ? -50 : currentPosition.side.includes("bottom") ? 50 : 0,
              }}
              animate={{
                opacity: 0.75,
                x: 0,
                y: 0,
                transition: {
                  opacity: { duration: 2, ease: "easeInOut" },
                  x: { duration: 1.5, ease: "easeOut" },
                  y: { duration: 1.5, ease: "easeOut" },
                },
              }}
              exit={{
                opacity: 0,
                x: currentPosition.side.includes("left") ? -30 : currentPosition.side.includes("right") ? 30 : 0,
                y: currentPosition.side.includes("top") ? -30 : currentPosition.side.includes("bottom") ? 30 : 0,
                transition: { duration: 2, ease: "easeInOut" },
              }}
              style={{
                filter: "blur(0.5px)",
                boxShadow: "0 0 20px rgba(245, 193, 108, 0.15)",
              }}
            >
              {meditationQuotes[currentQuoteIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
