import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const gainRef = useRef(null);
  const oscillatorsRef = useRef([]);

  const startAmbient = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      await context.resume();
    }

    const masterGain = context.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(context.destination);

    const frequencies = [196, 293.66, 392];
    const oscillators = frequencies.map((frequency, index) => {
      const osc = context.createOscillator();
      const oscGain = context.createGain();

      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = frequency;
      oscGain.gain.value = index === 0 ? 0.015 : 0.006;

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();

      return osc;
    });

    gainRef.current = masterGain;
    oscillatorsRef.current = oscillators;

    masterGain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 2.4);
  };

  const stopAmbient = () => {
    const context = audioContextRef.current;
    const masterGain = gainRef.current;

    if (context && masterGain) {
      masterGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.8);
    }

    window.setTimeout(() => {
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Oscillator may already be stopped.
        }
      });
      oscillatorsRef.current = [];

      if (gainRef.current) {
        try {
          gainRef.current.disconnect();
        } catch {
          // Node may already be disconnected.
        }
      }
      gainRef.current = null;
    }, 1900);
  };

  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Oscillator may already be stopped.
        }
      });

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleToggle = async () => {
    if (!enabled) {
      await startAmbient();
      setEnabled(true);
      return;
    }

    stopAmbient();
    setEnabled(false);
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      className="fixed bottom-24 right-4 z-50 rounded-full border border-aura-gold/45 bg-aura-card/90 px-4 py-3 text-xs uppercase tracking-[0.16em] text-aura-gold shadow-[0_0_30px_rgba(245,193,108,0.25)] backdrop-blur transition hover:bg-aura-gold/16 md:bottom-6 md:right-6"
      whileTap={{ scale: 0.97 }}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable ambient sound" : "Enable ambient sound"}
    >
      {enabled ? "Sound On" : "Sound Off"}
    </motion.button>
  );
}
