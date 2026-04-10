import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BorderGlow from "../components/BorderGlow";
import { easeCalm, motionTiming } from "../lib/motion";

export default function SleepPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-aura-bg via-aura-bgSoft to-aura-bg">
      <div className="container mx-auto px-6 py-16 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTiming.sectionReveal, ease: easeCalm }}
          className="mx-auto max-w-4xl"
        >
          <motion.button
            onClick={() => navigate("/")}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
            className="mb-6 flex items-center gap-2 rounded-full border border-aura-gold/30 bg-aura-card/60 px-4 py-2 text-sm text-aura-textSoft hover:bg-aura-card/80 hover:text-aura-text transition-all backdrop-blur"
          >
            ← Home
          </motion.button>

          <BorderGlow
            className="mb-8"
            borderRadius={24}
            glowColor="28 18 8"
            backgroundColor="rgba(248,242,231,0.9)"
            glowRadius={25}
            glowIntensity={0.6}
            coneSpread={25}
          >
            <motion.div
              className="rounded-2xl border border-aura-gold/20 bg-aura-card/90 p-8 md:p-12"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: motionTiming.textReveal }}
            >
              <h1 className="temple-heading mb-8 text-4xl font-medium md:text-5xl">
                Sleep
              </h1>

              <div className="prose prose-lg max-w-none text-aura-text leading-relaxed">
                <p className="text-lg font-medium text-aura-textSoft mb-6">
                  Wind down with slow-paced reflections and restorative calm
                </p>

                <p>
                  Sleep is essential for both physical health and mental well-being. However, many people struggle to fall asleep due to overthinking and stress. Meditation for sleep helps calm the mind and prepare the body for rest.
                </p>

                <p>
                  At night, the mind often replays events from the day or worries about the future. This mental activity keeps the body alert, making it difficult to relax.
                </p>

                <p>
                  Sleep meditation focuses on slowing down both the mind and the body. Start by lying down comfortably. Close your eyes and take slow, deep breaths. With each inhale, feel your body gently rise. With each exhale, allow it to sink deeper into the bed.
                </p>

                <p>
                  Gradually, bring awareness to different parts of your body. Relax your forehead, your eyes, your jaw, your shoulders, and so on. This process signals to your body that it is safe to rest.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "Sleep is the best meditation."
                  <br />
                  <span className="text-sm">— Dalai Lama</span>
                </blockquote>

                <p>
                  This quote reflects how deeply connected rest and meditation are.
                </p>

                <p>
                  You can also use visualization. Imagine a peaceful place — a quiet beach, a calm forest, or a starry night sky. Let your mind gently drift there.
                </p>

                <p>
                  Another helpful method is letting go of control. Instead of trying to force sleep, allow it to come naturally. Meditation creates the right conditions, and sleep follows.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "Be — don't try to become."
                  <br />
                  <span className="text-sm">— Osho</span>
                </blockquote>

                <p>
                  This idea applies perfectly to sleep. The more you try to force it, the harder it becomes.
                </p>

                <p>
                  Over time, sleep meditation reduces insomnia, improves sleep quality, and helps you wake up feeling refreshed.
                </p>

                <p>
                  It also creates a calming nighttime routine, signaling your mind that the day is complete.
                </p>
              </div>
            </motion.div>
          </BorderGlow>
        </motion.div>
      </div>
    </div>
  );
}