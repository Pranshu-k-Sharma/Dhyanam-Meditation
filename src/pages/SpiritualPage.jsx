import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BorderGlow from "../components/BorderGlow";
import { easeCalm, motionTiming } from "../lib/motion";

export default function SpiritualPage() {
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
                Spiritual
              </h1>

              <div className="prose prose-lg max-w-none text-aura-text leading-relaxed">
                <p className="text-lg font-medium text-aura-textSoft mb-6">
                  Deepen inner awareness through mantra and silent presence
                </p>

                <p>
                  Spiritual meditation goes beyond relaxation. It is about exploring the deeper layers of your being and connecting with your inner self.
                </p>

                <p>
                  Unlike other forms of meditation that focus on specific goals, spiritual meditation is about awareness and presence.
                </p>

                <p>
                  You can begin by sitting quietly and observing your breath. Let thoughts come and go without attachment. Instead of reacting, simply watch them.
                </p>

                <p>
                  You may also use a mantra like "Om" or "So Hum". Repeating these sounds helps quiet the mind and bring your attention inward.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "The self is the friend of the self for him who has conquered himself."
                  <br />
                  <span className="text-sm">— Bhagavad Gita</span>
                </blockquote>

                <p>
                  This highlights the idea that true peace comes from within.
                </p>

                <p>
                  Spiritual meditation is not about escaping reality, but about understanding it more deeply. It helps you see beyond temporary thoughts and emotions.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "Your own self-realization is the greatest service you can render the world."
                  <br />
                  <span className="text-sm">— Ramana Maharshi</span>
                </blockquote>

                <p>
                  Through this practice, you begin to experience stillness — a state where the mind becomes quiet and awareness expands.
                </p>

                <p>
                  This stillness brings clarity, peace, and a sense of connection with something greater than oneself.
                </p>

                <p>
                  Spiritual meditation is a journey, not a destination. With patience and consistency, it leads to deeper understanding and inner freedom.
                </p>
              </div>
            </motion.div>
          </BorderGlow>
        </motion.div>
      </div>
    </div>
  );
}