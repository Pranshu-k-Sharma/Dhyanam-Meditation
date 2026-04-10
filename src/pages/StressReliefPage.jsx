import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BorderGlow from "../components/BorderGlow";
import { easeCalm, motionTiming } from "../lib/motion";

export default function StressReliefPage() {
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
                Stress Relief
              </h1>

              <div className="prose prose-lg max-w-none text-aura-text leading-relaxed">
                <p className="text-lg font-medium text-aura-textSoft mb-6">
                  Soften tension with grounding breath and gentle body scans
                </p>

                <p>
                  In today's fast-paced world, stress has quietly become a constant companion for many people. Whether it comes from work, studies, relationships, or daily responsibilities, stress affects both the mind and body. Meditation for stress relief is a simple yet powerful way to return to balance.
                </p>

                <p>
                  At its core, stress is a response — your body reacting to pressure or uncertainty. But through mindful breathing and awareness, you can gently guide your system back to calm.
                </p>

                <p>
                  A good starting point is the breath. Sit comfortably, close your eyes, and take a slow inhale through your nose. Let the air fill your lungs completely. Then exhale gently, releasing any tightness or tension. As you continue, bring your attention to your body. Notice areas where you feel stress — perhaps in your shoulders, neck, or forehead. With each exhale, imagine that tension melting away.
                </p>

                <p>
                  This practice is often called a body scan. It helps you reconnect with physical sensations and release stored stress. Over time, it trains your body to relax more quickly.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor."
                  <br />
                  <span className="text-sm">— Thich Nhat Hanh</span>
                </blockquote>

                <p>
                  This idea is simple but powerful — your breath is always with you, acting as a steady anchor in moments of chaos.
                </p>

                <p>
                  Stress meditation is not about forcing the mind to be silent. Thoughts will come, and that is natural. The goal is to observe them without getting caught up in them. When your mind wanders, gently bring your focus back to your breath.
                </p>

                <p>
                  Scientifically, slow breathing activates the parasympathetic nervous system — the part responsible for relaxation. This lowers heart rate, reduces anxiety, and creates a sense of calm.
                </p>

                <p>
                  Another helpful approach is grounding. Focus on your surroundings — the feeling of your feet on the ground, the sound of your breath, or the weight of your body. This brings your awareness into the present moment, where stress has less power.
                </p>

                <blockquote className="border-l-4 border-aura-gold/50 pl-6 italic text-aura-textSoft my-6">
                  "You have power over your mind—not outside events. Realize this, and you will find strength."
                  <br />
                  <span className="text-sm">— Marcus Aurelius</span>
                </blockquote>

                <p>
                  This quote reminds us that while we cannot control everything around us, we can control how we respond.
                </p>

                <p>
                  Even a few minutes of daily practice can create lasting change. Over time, you may notice that you respond more calmly to stressful situations, rather than reacting instantly.
                </p>

                <p>
                  Meditation for stress relief is not about escaping life — it is about learning to move through it with greater ease and awareness. With each breath, you create space. And in that space, you find calm.
                </p>
              </div>
            </motion.div>
          </BorderGlow>
        </motion.div>
      </div>
    </div>
  );
}