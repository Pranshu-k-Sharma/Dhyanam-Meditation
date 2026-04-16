import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BorderGlow from "../components/BorderGlow";
import { soundCategories, soundsLibrary } from "../data/sounds";
import { playBellChime } from "../lib/bell";

const FAVORITES_STORAGE_KEY = "meditation-sounds-favorites";

const tempoWeight = {
  "Very Slow": 1,
  Slow: 2,
  Medium: 3,
  Steady: 4,
};

function readFavoritesFromStorage() {
  try {
    const rawFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!rawFavorites) {
      return new Set();
    }

    const parsed = JSON.parse(rawFavorites);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export default function SoundsPage({ onPlaySound, activeSoundKey = "" }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    setFavorites(readFavoritesFromStorage());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    const syncFavorites = (event) => {
      if (event.key !== FAVORITES_STORAGE_KEY) {
        return;
      }

      setFavorites(readFavoritesFromStorage());
    };

    window.addEventListener("storage", syncFavorites);

    return () => window.removeEventListener("storage", syncFavorites);
  }, []);

  const filteredSounds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = soundsLibrary.filter((item) => {
      const categoryPass = category === "All" || item.category === category;
      const favoritesPass = !favoritesOnly || favorites.has(item.key);
      const queryPass =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.type.toLowerCase().includes(normalized) ||
        item.use.toLowerCase().includes(normalized);
      return categoryPass && favoritesPass && queryPass;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === "tempo") {
        return (tempoWeight[a.tempo] ?? 99) - (tempoWeight[b.tempo] ?? 99);
      }
      if (sortBy === "favorites") {
        const aFav = favorites.has(a.key) ? 1 : 0;
        const bFav = favorites.has(b.key) ? 1 : 0;
        if (aFav !== bFav) {
          return bFav - aFav;
        }
        return a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });
  }, [category, favorites, favoritesOnly, query, sortBy]);

  const tracksCountByCategory = useMemo(() => {
    return soundCategories
      .filter((item) => item !== "All")
      .map((item) => ({
        category: item,
        count: soundsLibrary.filter((sound) => sound.category === item).length,
      }))
      .filter((item) => item.count > 0);
  }, []);

  const handleCategoryChange = (value) => {
    void playBellChime();
    setCategory(value);
  };

  const handleToggleFavorite = (key) => {
    void playBellChime();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handlePlaySound = (key) => {
    void playBellChime();
    if (typeof onPlaySound === "function") {
      onPlaySound(key, { autoPlay: true });
    }
  };

  const handlePlayFiltered = () => {
    if (!filteredSounds.length) {
      return;
    }
    handlePlaySound(filteredSounds[0].key);
  };

  const handlePlayFavorites = () => {
    const favoriteTracks = soundsLibrary.filter((item) => favorites.has(item.key));
    if (!favoriteTracks.length) {
      return;
    }
    handlePlaySound(favoriteTracks[0].key);
  };

  return (
    <section className="relative min-h-screen overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-36">
      <div className="absolute inset-0 cosmic-bg" />
      <div className="absolute inset-0 cosmic-starfield" />
      <div className="absolute inset-0 aurora-wave opacity-80" />
      <div className="absolute inset-0 cosmic-particles opacity-70" />
      <div className="absolute -top-20 right-8 h-56 w-56 rounded-full bg-aura-gold/20 blur-3xl" />
      <div className="absolute left-8 top-44 h-48 w-48 rounded-full bg-aura-card/60 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.h1
          className="aura-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, ease: "easeOut" }}
        >
          Sounds
        </motion.h1>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-aura-gold/30 bg-aura-card/85 px-3 py-1 text-xs uppercase tracking-[0.12em] text-aura-textSoft">
            {soundsLibrary.length} Tracks
          </span>
          <span className="rounded-full border border-aura-gold/30 bg-aura-card/85 px-3 py-1 text-xs uppercase tracking-[0.12em] text-aura-textSoft">
            {favorites.size} Favorites
          </span>
          <button
            type="button"
            onClick={handlePlayFiltered}
            disabled={!filteredSounds.length}
            className="temple-chip temple-chip-inactive disabled:cursor-not-allowed disabled:opacity-50"
          >
            Play Filtered
          </button>
          <button
            type="button"
            onClick={handlePlayFavorites}
            disabled={!favorites.size}
            className="temple-chip temple-chip-inactive disabled:cursor-not-allowed disabled:opacity-50"
          >
            Play Favorites
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap gap-2">
            {tracksCountByCategory.map((item) => (
              <span
                key={item.category}
                className="rounded-full border border-aura-gold/22 bg-aura-card/78 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-aura-textSoft"
              >
                {item.category} {item.count}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => setFavoritesOnly((value) => !value)}
              className={`temple-chip ${favoritesOnly ? "temple-chip-active" : "temple-chip-inactive"}`}
            >
              Favorites {favoritesOnly ? "Only" : "All"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <BorderGlow
            className="w-full"
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
              placeholder="Search by title, type, or purpose"
              className="aura-input w-full"
            />
          </BorderGlow>

          <BorderGlow
            borderRadius={20}
            glowColor="28 18 8"
            backgroundColor="rgba(248,242,231,0.9)"
            glowRadius={18}
            glowIntensity={0.65}
            coneSpread={20}
          >
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="aura-input min-w-[180px]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="title-asc">Sort: Title A-Z</option>
              <option value="title-desc">Sort: Title Z-A</option>
              <option value="tempo">Sort: Tempo</option>
              <option value="favorites">Sort: Favorites First</option>
            </select>
          </BorderGlow>

          <div className="flex flex-wrap gap-2">
            {soundCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleCategoryChange(item)}
                className={`temple-chip ${category === item ? "temple-chip-active" : "temple-chip-inactive"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="space-y-3">
            {filteredSounds.length === 0 && (
              <BorderGlow
                borderRadius={20}
                glowColor="28 18 8"
                backgroundColor="rgba(248,242,231,0.88)"
                glowRadius={20}
                glowIntensity={0.7}
                coneSpread={20}
              >
                <div className="glass-surface rounded-2xl p-4 text-sm text-aura-textSoft">
                  No sounds matched your filters. Try another category or keyword.
                </div>
              </BorderGlow>
            )}

            {filteredSounds.map((item) => (
              <BorderGlow
                key={item.key}
                borderRadius={24}
                glowColor="28 18 8"
                backgroundColor="rgba(248,242,231,0.9)"
                glowRadius={24}
                glowIntensity={activeSoundKey === item.key ? 0.9 : 0.72}
                coneSpread={24}
              >
                <div
                  className={`temple-card w-full ${
                    activeSoundKey === item.key ? "temple-card-active" : "hover:bg-aura-gold/8"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.14em] text-aura-textSoft">{item.tempo}</p>
                      <h3 className="mt-1 text-xl text-aura-text">{item.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(item.key)}
                      className="cosmic-glow-button rounded-full border border-aura-gold/25 bg-aura-card/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-aura-textSoft transition hover:bg-aura-gold/12"
                    >
                      {favorites.has(item.key) ? "Saved" : "Save"}
                    </button>
                  </div>

                  <p className="mt-1 text-sm text-aura-textSoft">{item.use}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-aura-gold/20 bg-aura-bgSoft/60 px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] text-aura-gold/95">
                      {item.category}
                    </span>
                    <span className="rounded-full border border-aura-gold/20 bg-aura-bgSoft/60 px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] text-aura-gold/95">
                      {item.type}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlaySound(item.key)}
                      className="cosmic-glow-button rounded-full border border-aura-gold/28 bg-aura-card/85 px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-aura-textSoft transition hover:bg-aura-gold/12"
                    >
                      Play Now
                    </button>
                    {activeSoundKey === item.key && (
                      <span className="rounded-full border border-aura-gold/28 bg-aura-gold/16 px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-aura-text">
                        Playing
                      </span>
                    )}
                  </div>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
