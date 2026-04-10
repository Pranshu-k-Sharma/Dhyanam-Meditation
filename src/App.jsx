import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Hero from "./components/Hero";
import BorderGlow from "./components/BorderGlow";
import AudioPlayer from "./components/AudioPlayer";
import Orb from "./components/Orb";
import AccountAccess from "./components/AccountAccess";
import InformationFooter from "./components/InformationFooter";
import MantrasPage from "./pages/MantrasPage";
import BreathingExercisePage from "./pages/BreathingExercisePage";
import SoundsPage from "./pages/SoundsPage";
import StressReliefPage from "./pages/StressReliefPage";
import FocusPage from "./pages/FocusPage";
import SleepPage from "./pages/SleepPage";
import SpiritualPage from "./pages/SpiritualPage";
import { soundsLibrary } from "./data/sounds";
import { playBellChime } from "./lib/bell";

const Breathing = lazy(() => import("./components/Breathing"));
const ReflectionSection = lazy(() => import("./components/ReflectionSection"));
const Mantra = lazy(() => import("./components/Mantra"));
const Cards = lazy(() => import("./components/Cards"));

const sectionNavItems = [
  { id: "home", label: "Home" },
  { id: "breathing", label: "Breath" },
  { id: "categories", label: "Paths" },
];

const pageNavItems = [
  { to: "/mantras", label: "Mantras" },
  { to: "/sounds", label: "Sounds" },
];

const ACTIVE_USER_STORAGE_KEY = "innerpeace.activeUser";

function hasActiveUserSession() {
  try {
    const raw = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw);
    return Boolean(parsed?.email);
  } catch {
    return false;
  }
}

function App() {
  const floatingBoundsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const isBreathingExercisePage = location.pathname === "/breathing-exercise";
  const [activeSection, setActiveSection] = useState("home");
  const [showIntro, setShowIntro] = useState(true);
  const [globalPlayerVisible, setGlobalPlayerVisible] = useState(false);
  const [globalPlayerMinimized, setGlobalPlayerMinimized] = useState(false);
  const [globalSoundKey, setGlobalSoundKey] = useState(soundsLibrary[0]?.key ?? "");
  const [globalAutoPlayToken, setGlobalAutoPlayToken] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasActiveUserSession());

  const globalActiveSound = useMemo(() => {
    return soundsLibrary.find((item) => item.key === globalSoundKey) ?? soundsLibrary[0] ?? null;
  }, [globalSoundKey]);

  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.2,
  });

  useEffect(() => {
    const timer = window.setTimeout(
      () => setShowIntro(false),
      shouldReduceMotion ? 100 : 900
    );

    return () => window.clearTimeout(timer);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!isHomePage) {
      return undefined;
    }

    const sectionElements = sectionNavItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!sectionElements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        threshold: [0.3, 0.45, 0.6, 0.75],
        rootMargin: "-20% 0px -20% 0px",
      }
    );

    sectionElements.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [isHomePage]);

  useEffect(() => {
    if (isBreathingExercisePage) {
      setActiveSection("breathing");
    }
  }, [isBreathingExercisePage]);

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const sectionIdFromHash = location.hash?.replace("#", "");
    if (!sectionIdFromHash) {
      return;
    }

    const element = document.getElementById(sectionIdFromHash);
    if (element) {
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 30);
    }
  }, [isHomePage, location.hash]);

  const handleSectionNavigation = (sectionId) => {
    void playBellChime();

    if (sectionId === "home") {
      navigate("/");
      return;
    }

    if (sectionId === "breathing") {
      navigate("/breathing-exercise");
      return;
    }

    if (isHomePage) {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    navigate({ pathname: "/", hash: `#${sectionId}` });
  };

  const openGlobalPlayer = (soundKey, { autoPlay = true } = {}) => {
    const exists = soundsLibrary.some((item) => item.key === soundKey);
    if (!exists) {
      return;
    }

    setGlobalSoundKey(soundKey);
    setGlobalPlayerVisible(true);
    setGlobalPlayerMinimized(false);

    if (autoPlay) {
      setGlobalAutoPlayToken((value) => value + 1);
    }
  };

  const handleGlobalNext = () => {
    if (!globalActiveSound || !soundsLibrary.length) {
      return;
    }

    const index = soundsLibrary.findIndex((item) => item.key === globalActiveSound.key);
    const nextIndex = (index + 1) % soundsLibrary.length;
    openGlobalPlayer(soundsLibrary[nextIndex].key, { autoPlay: true });
  };

  const handleGlobalPrevious = () => {
    if (!globalActiveSound || !soundsLibrary.length) {
      return;
    }

    const index = soundsLibrary.findIndex((item) => item.key === globalActiveSound.key);
    const prevIndex = (index - 1 + soundsLibrary.length) % soundsLibrary.length;
    openGlobalPlayer(soundsLibrary[prevIndex].key, { autoPlay: true });
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase?.();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }

      if (event.code === "KeyF") {
        if (!globalPlayerVisible) {
          return;
        }
        event.preventDefault();
        setGlobalPlayerMinimized(false);
        return;
      }

      if (event.code === "KeyI") {
        if (!globalPlayerVisible) {
          return;
        }
        event.preventDefault();
        setGlobalPlayerMinimized(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [globalPlayerVisible]);

  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(hasActiveUserSession());

    const onAuthChanged = (event) => {
      const value = event?.detail?.isAuthenticated;
      if (typeof value === "boolean") {
        setIsAuthenticated(value);
        return;
      }

      syncAuthState();
    };

    const onStorage = (event) => {
      if (event.key === ACTIVE_USER_STORAGE_KEY) {
        syncAuthState();
      }
    };

    window.addEventListener("innerpeace-auth-changed", onAuthChanged);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("innerpeace-auth-changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);



  const renderCurrentPage = () => {
    if (location.pathname === "/mantras") {
      return <MantrasPage />;
    }

    if (location.pathname === "/sounds") {
      return <SoundsPage onPlaySound={openGlobalPlayer} activeSoundKey={globalActiveSound?.key ?? ""} />;
    }

    if (location.pathname === "/breathing-exercise") {
      return <BreathingExercisePage />;
    }

    if (location.pathname === "/stress-relief") {
      return <StressReliefPage />;
    }

    if (location.pathname === "/focus") {
      return <FocusPage />;
    }

    if (location.pathname === "/sleep") {
      return <SleepPage />;
    }

    if (location.pathname === "/spiritual") {
      return <SpiritualPage />;
    }

    return (
      <>
        <Hero />
        <Suspense fallback={<div className="h-20" />}>
          <ReflectionSection />
          <Breathing />
          <Mantra />
          <Cards />
        </Suspense>
        <InformationFooter />
      </>
    );
  };

  return (
    <>
      <header className="absolute left-4 top-4 z-[95]">
        <img
          src="/images/dhyanam_darkgold_white_bg-removebg-preview.png"
          alt="Dhyanam top-left logo"
          className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 object-contain"
        />
      </header>
      {isHomePage && (
        <header className="absolute left-1/2 top-20 z-[95] -translate-x-1/2">
          <img
            src="/images/dhyanam_transparent.png"
            alt="Dhyanam logo"
            className="h-56 w-[18rem] sm:h-64 sm:w-[18rem] md:h-48 md:w-[18rem] object-contain"
          />
        </header>
      )}
      <main className="relative min-h-screen overflow-hidden bg-aura-bg text-aura-text">
      <div className="pointer-events-none fixed inset-0 cosmic-bg" />
      <div className="pointer-events-none fixed inset-0 cosmic-starfield" />
      <div className="pointer-events-none fixed inset-0 aurora-wave" />
      <div className="pointer-events-none fixed inset-0 cosmic-particles" />
      <div className="pointer-events-none fixed inset-0 incense-smoke" />
      <div className="pointer-events-none fixed inset-0 energy-pulse" />
      <div className="pointer-events-none fixed left-4 top-24 z-[5] diya-accent opacity-70" />
      <div className="pointer-events-none fixed bottom-20 right-6 z-[5] diya-accent opacity-65" />
      <div className="pointer-events-none fixed -left-10 top-1/3 z-[5] mandala-ornament" />
      <div className="pointer-events-none fixed -right-10 bottom-1/3 z-[5] mandala-ornament" />

      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center cosmic-bg"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.9, ease: "easeOut" }}
          >
            <motion.div
              className="rounded-full border border-aura-gold/45 bg-aura-card/80 px-7 py-3 text-xs uppercase tracking-[0.3em] text-aura-text shadow-[0_0_30px_rgba(245,193,108,0.25)] backdrop-blur"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.05 : 0.7 }}
            >
              Entering Dhyanam
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="pointer-events-none fixed left-0 right-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-[var(--scroll-progress-start)] via-[var(--scroll-progress-mid)] to-[var(--scroll-progress-end)]"
        style={{ scaleX: progressScaleX }}
      />

      {isAuthenticated && (
        <>
          <div className="aura-nav-shell fixed bottom-4 left-1/2 z-[85] -translate-x-1/2 rounded-full p-2 text-[10px] uppercase tracking-[0.14em] sm:text-xs md:bottom-auto md:left-auto md:right-28 md:top-6 md:translate-x-0">
            <nav className="flex gap-1 sm:gap-2">
              {sectionNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSectionNavigation(item.id)}
                  className="aura-nav-item relative rounded-full px-3 py-2 transition"
                >
                  {(activeSection === item.id && (isHomePage || isBreathingExercisePage)) && (
                    <motion.span
                      layoutId="active-nav-pill"
                      className="active-nav-pill absolute inset-0 rounded-full bg-aura-gold/30"
                      transition={{ type: "spring", stiffness: 190, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              ))}

              {pageNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="aura-nav-item relative rounded-full px-3 py-2 transition"
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="active-nav-pill"
                          className="active-nav-pill absolute inset-0 rounded-full bg-aura-gold/30"
                          transition={{ type: "spring", stiffness: 190, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}

      <AccountAccess />

      <div key={`${location.pathname}${location.hash}`}>
        {isAuthenticated ? (
          renderCurrentPage()
        ) : (
          <section className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
            <div className="mx-auto max-w-lg rounded-3xl border border-aura-gold/16 bg-aura-card/72 px-6 py-8 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.2em] text-aura-gold/85">Protected Space</p>
              <h2 className="mt-3 text-3xl font-semibold text-aura-text">Sign in to continue</h2>
              <p className="mt-3 text-sm leading-relaxed text-aura-textSoft">
                Create an account or log in with a valid email to access mantras, sounds, and your personalized profile.
              </p>
            </div>
          </section>
        )}
      </div>

      {globalPlayerVisible && globalActiveSound && (
        globalPlayerMinimized ? (
          <div ref={floatingBoundsRef} className="pointer-events-none fixed inset-0 z-[999]">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              drag
              dragConstraints={floatingBoundsRef}
              dragElastic={0.08}
              dragMomentum={false}
              whileDrag={{ scale: 1.01 }}
              className="pointer-events-auto absolute bottom-3 right-3 w-[min(72vw,260px)] cursor-grab active:cursor-grabbing"
            >
              <BorderGlow
                borderRadius={24}
                glowColor="28 18 8"
                backgroundColor="rgba(248,242,231,0.92)"
                glowRadius={24}
                glowIntensity={0.86}
                coneSpread={24}
              >
                <div className="glass-surface relative flex items-center justify-center overflow-hidden rounded-3xl p-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => setGlobalPlayerMinimized((value) => !value)}
                    className="cosmic-glow-button absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-aura-gold/30 bg-aura-card/85 text-[9px] text-aura-textSoft transition hover:bg-aura-gold/12"
                    aria-label={globalPlayerMinimized ? "Expand player" : "Minimize player"}
                    title={globalPlayerMinimized ? "Expand player" : "Minimize player"}
                  >
                    {globalPlayerMinimized ? "▢" : "—"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setGlobalPlayerVisible(false)}
                    className="cosmic-glow-button absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-aura-gold/30 bg-aura-card/85 text-[9px] text-aura-textSoft transition hover:bg-aura-gold/12"
                    aria-label="Close player"
                    title="Close player"
                  >
                    ✕
                  </button>

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-85">
                    <div className="h-[82%] w-[82%]">
                      <Orb
                        hue={10}
                        hoverIntensity={1.6}
                        rotateOnHover
                        forceHoverState={false}
                        backgroundColor="#f8f2e7"
                      />
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-center text-center">
                    <AudioPlayer
                      track={globalActiveSound.track}
                      variant="orb"
                      compact
                      autoPlayToken={globalAutoPlayToken}
                      onPrevious={handleGlobalPrevious}
                      onNext={handleGlobalNext}
                      onEnded={handleGlobalNext}
                      hotkeysEnabled
                      showVisualizer={false}
                      nowPlayingKey={globalActiveSound.key}
                    />
                  </div>
                </div>
              </BorderGlow>
            </motion.div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[999]">
            <div className="absolute inset-0 bg-[rgba(28,18,8,0.35)] backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="pointer-events-auto absolute inset-0"
            >
              <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-6 md:p-10">
                <BorderGlow
                  borderRadius={32}
                  glowColor="28 18 8"
                  backgroundColor="rgba(248,242,231,0.92)"
                  glowRadius={28}
                  glowIntensity={0.92}
                  coneSpread={26}
                  className="w-[min(92vmin,92vw)]"
                >
                  <div className="glass-surface relative aspect-square w-full overflow-hidden rounded-[28px] p-4 text-center sm:p-6 md:p-8">
                    <div className="absolute right-4 top-4 z-20 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setGlobalPlayerMinimized(true)}
                          className="cosmic-glow-button flex h-9 w-9 items-center justify-center rounded-full border border-aura-gold/30 bg-aura-card/85 text-aura-textSoft transition hover:bg-aura-gold/12"
                        aria-label="Minimize player"
                        title="Minimize player"
                      >
                          ▭
                      </button>

                      <button
                        type="button"
                        onClick={() => setGlobalPlayerVisible(false)}
                          className="cosmic-glow-button flex h-9 w-9 items-center justify-center rounded-full border border-aura-gold/30 bg-aura-card/85 text-aura-textSoft transition hover:bg-aura-gold/12"
                        aria-label="Close player"
                        title="Close player"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="pointer-events-none absolute inset-0 opacity-95">
                      <Orb
                        hue={10}
                        hoverIntensity={2}
                        rotateOnHover
                        forceHoverState={false}
                        backgroundColor="#f8f2e7"
                      />
                    </div>

                    <div className="relative z-10 flex h-[calc(100%-3.5rem)] items-center justify-center text-center">
                      <div className="mx-auto w-full max-w-3xl text-center">
                        <AudioPlayer
                          track={globalActiveSound.track}
                          variant="orb"
                          compact={false}
                          autoPlayToken={globalAutoPlayToken}
                          onPrevious={handleGlobalPrevious}
                          onNext={handleGlobalNext}
                          onEnded={handleGlobalNext}
                          hotkeysEnabled
                          showVisualizer={false}
                          nowPlayingKey={globalActiveSound.key}
                        />
                      </div>
                    </div>
                  </div>
                </BorderGlow>
              </div>
            </motion.div>
          </div>
        )
      )}


    </main>
    </>
  );
}

export default App;
