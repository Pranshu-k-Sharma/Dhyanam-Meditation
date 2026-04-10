import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BorderGlow from "../components/BorderGlow";
import { easeCalm, motionTiming } from "../lib/motion";

export default function FocusPage() {
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
                Focus
              </h1>

              <div className="prose prose-lg max-w-none text-aura-text leading-relaxed">
                <p className="text-lg font-medium text-aura-textSoft mb-6">
                  Train attention with single-point concentration sessions
                </p>

                <p>
                  In a world full of distractions, maintaining focus has become increasingly difficult. Notifications, multitasking, and constant stimulation make it hard for the mind to stay in one place. Meditation for focus helps train the mind to develop clarity and sustained attention.
                </p>

                <p>
                  Focus meditation is built on a simple idea: choosing one point of attention and staying with it. This point can be your breath, a sound, a word (mantra), or even a visual object.
                </p>

                <p>
                  Begin by sitting comfortably. Bring your attention to your breath — notice the air entering and leaving your body. Try to stay with this sensation. Inevitably, your mind will wander. You may start thinking about tasks, memories, or plans. This is completely normal.
                </p>

                <p>
                  The key is not to fight these thoughts but to gently return your attention to your chosen focus.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "Yoga is the stilling of the fluctuations of the mind."
                  <br />
                  <span className="text-sm">— Patanjali, Yoga Sutras</span>
                </blockquote>

                <p>
                  This does not mean stopping thoughts completely, but rather reducing their constant movement so the mind becomes steady.
                </p>

                <p>
                  With regular practice, your ability to concentrate improves. Tasks that once felt difficult become easier to manage. You begin to notice details more clearly and think more effectively.
                </p>

                <p>
                  Modern neuroscience also supports this. Studies show that meditation strengthens areas of the brain related to attention and memory. It also reduces mental fatigue.
                </p>

                <p>
                  Another important aspect of focus meditation is patience. Progress may feel slow at first, but consistency is more important than perfection.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "The power of attention, when properly directed, can accomplish anything."
                  <br />
                  <span className="text-sm">— Swami Vivekananda</span>
                </blockquote>

                <p>
                  This highlights the importance of training the mind, just like we train the body.
                </p>

                <p>
                  You can also use mantras to improve focus. Repeating a word like "Om" or "So Hum" helps anchor the mind and reduce distractions.
                </p>

                <p>
                  Over time, focus meditation brings a sense of clarity and control. Instead of being pulled in many directions, your mind learns to stay steady and present.
                </p>

                <p>
                  In daily life, this translates into better productivity, improved learning, and a deeper sense of awareness.
                </p>
              </div>
            </motion.div>
          </BorderGlow>
        </motion.div>
      </div>
    </div>
  );
}