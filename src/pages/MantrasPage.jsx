import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BorderGlow from "../components/BorderGlow";
import AudioPlayer from "../components/AudioPlayer";
import LiquidEther from "../components/LiquidEther";
import Orb from "../components/Orb";
import { mantraLibrary, mantraMoods } from "../data/mantras";
import { playBellChime } from "../lib/bell";

export default function MantrasPage() {
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("All");
  const [selectedMantra, setSelectedMantra] = useState(mantraLibrary[0].key);
  const [autoPlayToken, setAutoPlayToken] = useState(0);

  const filteredMantras = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return mantraLibrary.filter((item) => {
      const moodPass = moodFilter === "All" || item.mood === moodFilter;
      const queryPass =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.vibe.toLowerCase().includes(normalized) ||
        item.tags.join(" ").toLowerCase().includes(normalized);
      return moodPass && queryPass;
    });
  }, [query, moodFilter]);

  useEffect(() => {
    if (!filteredMantras.some((item) => item.key === selectedMantra)) {
      setSelectedMantra(filteredMantras[0]?.key ?? "");
    }
  }, [filteredMantras, selectedMantra]);

  const active = useMemo(
    () => filteredMantras.find((item) => item.key === selectedMantra) ?? filteredMantras[0],
    [selectedMantra, filteredMantras]
  );

  const activeIndex = useMemo(
    () => filteredMantras.findIndex((item) => item.key === active?.key),
    [active?.key, filteredMantras]
  );

  const handleMoodChange = (mood) => {
    void playBellChime();
    setMoodFilter(mood);
  };

  const handleSelectMantra = (key, options = {}) => {
    const { autoPlay = false } = options;
    void playBellChime();
    setSelectedMantra(key);
    if (autoPlay) {
      setAutoPlayToken((token) => token + 1);
    }
  };

  const handleMoveTrack = useCallback(
    (direction, { fromEnded = false } = {}) => {
      if (!filteredMantras.length || !active) {
        return;
      }

      const atStart = activeIndex <= 0;
      const atEnd = activeIndex >= filteredMantras.length - 1;
      let nextIndex = activeIndex + direction;

      if (nextIndex < 0) {
        nextIndex = filteredMantras.length - 1;
      }

      if (nextIndex >= filteredMantras.length) {
        nextIndex = 0;
      }

      if (!fromEnded && direction < 0 && atStart) {
        nextIndex = filteredMantras.length - 1;
      }

      if (!fromEnded && direction > 0 && atEnd) {
        nextIndex = 0;
      }

      if (nextIndex >= 0 && nextIndex < filteredMantras.length) {
        setSelectedMantra(filteredMantras[nextIndex].key);
        setAutoPlayToken((token) => token + 1);
      }
    },
    [active, activeIndex, filteredMantras]
  );

  const handlePrevious = useCallback(() => {
    void playBellChime();
    handleMoveTrack(-1);
  }, [handleMoveTrack]);

  const handleNext = useCallback(() => {
    void playBellChime();
    handleMoveTrack(1);
  }, [handleMoveTrack]);

  const handleEnded = useCallback(() => {
    handleMoveTrack(1, { fromEnded: true });
  }, [handleMoveTrack]);

  const handlePlayFiltered = () => {
    if (!filteredMantras.length) {
      return;
    }
    handleSelectMantra(filteredMantras[0].key, { autoPlay: true });
  };

  return (
    <section className="relative min-h-screen overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-36">
      <div className="absolute inset-0 cosmic-bg" />
      <div className="absolute inset-0 cosmic-starfield" />
      <div className="absolute inset-0 aurora-wave opacity-80" />
      <div className="absolute inset-0 cosmic-particles opacity-70" />
      <div className="absolute inset-0 incense-smoke" />
      <div className="absolute inset-0 energy-pulse" />
      <div className="pointer-events-none absolute -left-10 top-24 mandala-ornament" />
      <div className="pointer-events-none absolute -right-10 bottom-20 mandala-ornament" />
      <div className="pointer-events-none absolute left-8 top-20 diya-accent opacity-65" />
      <div className="pointer-events-none absolute bottom-14 right-8 diya-accent opacity-60" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.h1
          className="aura-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, ease: "easeOut" }}
        >
          Mantra Library
        </motion.h1>
        <p className="aura-copy mt-4 max-w-2xl text-base leading-relaxed md:text-lg">
          Select a mantra pathway to begin.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-aura-gold/30 bg-aura-card/85 px-3 py-1 text-xs uppercase tracking-[0.12em] text-aura-textSoft">
            {filteredMantras.length} Tracks
          </span>
          <button
            type="button"
            onClick={handlePlayFiltered}
            disabled={!filteredMantras.length}
            className="temple-chip temple-chip-inactive disabled:cursor-not-allowed disabled:opacity-50"
          >
            Play Filtered
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <BorderGlow
            className="w-full md:max-w-md"
            borderRadius={20}
            glowColor="28 18 8"
            backgroundColor="rgba(248,242,231,0.9)"
            glowRadius={18}
            glowIntensity={0.65}
            coneSpread={20}
          >
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by mantra, vibe, or tag"
              className="aura-input w-full"
            />
          </BorderGlow>

          <div className="flex flex-wrap gap-2">
            {mantraMoods.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => handleMoodChange(mood)}
                className={`temple-chip ${moodFilter === mood ? "temple-chip-active" : "temple-chip-inactive"}`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="space-y-3">
            {filteredMantras.length === 0 && (
              <BorderGlow
                borderRadius={20}
                glowColor="28 18 8"
                backgroundColor="rgba(248,242,231,0.88)"
                glowRadius={20}
                glowIntensity={0.7}
                coneSpread={20}
              >
                <div className="glass-surface rounded-2xl p-4 text-sm text-aura-textSoft">
                  No mantra matched your search. Try another mood or keyword.
                </div>
              </BorderGlow>
            )}

            {filteredMantras.map((item) => (
              <BorderGlow
                key={item.key}
                borderRadius={24}
                glowColor="28 18 8"
                backgroundColor="rgba(248,242,231,0.9)"
                glowRadius={24}
                glowIntensity={selectedMantra === item.key ? 0.9 : 0.72}
                coneSpread={24}
              >
                <button
                  type="button"
                  onClick={() => handleSelectMantra(item.key)}
                  className={`temple-card w-full ${
                    selectedMantra === item.key ? "temple-card-active" : "hover:bg-aura-gold/8"
                  }`}
                >
                  <h3 className="text-xl text-aura-text">{item.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-aura-gold/90">
                    {item.mood}
                  </p>
                </button>
              </BorderGlow>
            ))}
          </div>

          {active ? (
            <motion.div
              key={active.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="space-y-5"
            >
              <div className="relative mx-auto" style={{ width: "1080px", height: "1080px" }}>
                <div className="absolute inset-0 z-0 overflow-hidden rounded-full opacity-85">
                  <LiquidEther
                    mouseForce={20}
                    cursorSize={100}
                    isViscous
                    viscous={30}
                    colors={["#f8f2e7", "#d1bfa3", "#1c1208"]}
                    autoDemo
                    autoSpeed={0.5}
                    autoIntensity={2.2}
                    isBounce={false}
                    resolution={0.5}
                  />
                </div>

                <Orb
                  hue={12}
                  hoverIntensity={2}
                  rotateOnHover
                  forceHoverState={false}
                  backgroundColor="#f8f2e7"
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 md:p-10">
                  <div className="pointer-events-auto z-30 w-full max-w-xl">
                    <AudioPlayer
                      track={active.track}
                      minimal
                      autoPlayToken={autoPlayToken}
                      onPrevious={handlePrevious}
                      onNext={handleNext}
                      onEnded={handleEnded}
                      hotkeysEnabled
                      nowPlayingKey={active.key}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <BorderGlow
              borderRadius={24}
              glowColor="28 18 8"
              backgroundColor="rgba(248,242,231,0.9)"
              glowRadius={24}
              glowIntensity={0.75}
              coneSpread={24}
            >
              <div className="glass-surface rounded-3xl p-6 text-aura-textSoft">
                Select a mantra to preview playback controls.
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </section>
  );
}
