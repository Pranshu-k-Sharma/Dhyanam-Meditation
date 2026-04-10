import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playBellChime } from "../lib/bell";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

const PLAYER_PREFS_KEY = "meditation-player-prefs";
const PLAYER_POSITIONS_KEY = "meditation-player-positions";

function readJSONStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export default function AudioPlayer({
  track,
  variant = "default",
  compact = false,
  minimal = false,
  hotkeysEnabled = false,
  autoPlayToken,
  onPrevious,
  onNext,
  onEnded,
  repeatMode = "off",
  onCycleRepeat,
  shuffleEnabled = false,
  onToggleShuffle,
  isFavorite = false,
  onToggleFavorite,
  playbackRate = 1,
  onPlaybackRateChange,
  showAdvancedControls = false,
  showVisualizer = false,
  nowPlayingKey,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playError, setPlayError] = useState("");
  const [sleepTimerTargetMs, setSleepTimerTargetMs] = useState(null);
  const [sleepTimerSelection, setSleepTimerSelection] = useState("off");
  const [sleepNowMs, setSleepNowMs] = useState(Date.now());
  const lastVolumeRef = useRef(0.8);
  const lastSavedSecondRef = useRef(-1);
  const pendingRestoreSecondRef = useRef(0);
  const keyboardSeekIntervalRef = useRef(null);
  const keyboardSeekHoldTimeoutRef = useRef(null);
  const keyboardSeekStartMsRef = useRef(0);
  const activeSeekKeyRef = useRef(null);
  const keyboardSeekBeganRef = useRef(false);

  const hasTrack = Boolean(track?.src);
  const storagePositionKey = nowPlayingKey || track?.src || track?.title || "";
  const isMinimal = minimal && !compact;

  const sleepRemainingMs = sleepTimerTargetMs ? Math.max(0, sleepTimerTargetMs - sleepNowMs) : 0;
  const sleepRemainingLabel =
    sleepRemainingMs > 0 ? `${Math.ceil(sleepRemainingMs / 60000)}m left` : "No timer";

  useEffect(() => {
    const savedPrefs = readJSONStorage(PLAYER_PREFS_KEY, null);
    if (savedPrefs && typeof savedPrefs === "object") {
      if (typeof savedPrefs.volume === "number") {
        setVolume(Math.min(1, Math.max(0, savedPrefs.volume)));
      }
      if (typeof savedPrefs.isMuted === "boolean") {
        setIsMuted(savedPrefs.isMuted);
      }
      if (
        typeof savedPrefs.playbackRate === "number" &&
        typeof onPlaybackRateChange === "function"
      ) {
        onPlaybackRateChange(Math.min(2, Math.max(0.75, savedPrefs.playbackRate)));
      }
    }
  }, [onPlaybackRateChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setPlayError("");

    const savedPositions = readJSONStorage(PLAYER_POSITIONS_KEY, {});
    const savedSecond = Number(savedPositions?.[storagePositionKey]);
    pendingRestoreSecondRef.current =
      Number.isFinite(savedSecond) && savedSecond > 0 ? savedSecond : 0;
  }, [storagePositionKey, track?.src, track?.title]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;

    window.localStorage.setItem(
      PLAYER_PREFS_KEY,
      JSON.stringify({
        volume,
        isMuted,
        playbackRate,
      })
    );
  }, [isMuted, playbackRate, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  const tryPlay = async () => {
    const audio = audioRef.current;
    if (!audio || !hasTrack) {
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
      setPlayError("");
    } catch {
      setIsPlaying(false);
      setPlayError("Could not start playback. Try pressing play again.");
    }
  };

  const togglePlayback = async () => {
    if (!hasTrack) return;

    void playBellChime();

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    await tryPlay();
  };

  useEffect(() => {
    if (!hasTrack || autoPlayToken === undefined) {
      return;
    }
    void tryPlay();
  }, [autoPlayToken, hasTrack, track?.src]);

  useEffect(() => {
    if (!sleepTimerTargetMs) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSleepNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sleepTimerTargetMs]);

  useEffect(() => {
    if (!sleepTimerTargetMs || sleepRemainingMs > 0) {
      return;
    }

    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
      setPlayError("Sleep timer ended. Playback paused.");
    }
    setSleepTimerTargetMs(null);
    setSleepTimerSelection("off");
  }, [sleepRemainingMs, sleepTimerTargetMs]);

  const onSeek = (event) => {
    const nextTime = Number(event.target.value);
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const seekBy = useCallback((deltaSeconds) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }
    const next = Math.min(Math.max(0, audio.currentTime + deltaSeconds), audio.duration);
    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const cyclePlaybackRate = () => {
    if (typeof onPlaybackRateChange !== "function") {
      return;
    }

    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const activeIndex = speeds.findIndex((speed) => Math.abs(speed - playbackRate) < 0.001);
    const nextSpeed = speeds[(activeIndex + 1) % speeds.length];
    onPlaybackRateChange(nextSpeed);
  };

  const toggleMute = () => {
    if (isMuted) {
      const restored = lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.8;
      setVolume(restored);
      setIsMuted(false);
      return;
    }

    lastVolumeRef.current = volume;
    setIsMuted(true);
  };

  const repeatModeLabel =
    repeatMode === "one" ? "Repeat One" : repeatMode === "all" ? "Repeat All" : "Repeat Off";

  const stopKeyboardSeekHold = () => {
    if (keyboardSeekHoldTimeoutRef.current) {
      window.clearTimeout(keyboardSeekHoldTimeoutRef.current);
      keyboardSeekHoldTimeoutRef.current = null;
    }
    if (keyboardSeekIntervalRef.current) {
      window.clearInterval(keyboardSeekIntervalRef.current);
      keyboardSeekIntervalRef.current = null;
    }
    keyboardSeekStartMsRef.current = 0;
    activeSeekKeyRef.current = null;
    keyboardSeekBeganRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopKeyboardSeekHold();
    };
  }, []);

  useEffect(() => {
    if (!hotkeysEnabled) {
      return undefined;
    }

    // Define startKeyboardSeekHold INSIDE the effect for proper closure
    const startKeyboardSeekHold = (eventCode, direction) => {
      if (activeSeekKeyRef.current === eventCode) {
        return; // Already tracking this key
      }

      stopKeyboardSeekHold();
      activeSeekKeyRef.current = eventCode;
      const seekDirection = direction;

      keyboardSeekHoldTimeoutRef.current = window.setTimeout(() => {
        keyboardSeekBeganRef.current = true;
        keyboardSeekStartMsRef.current = performance.now();

        // Initial seek
        seekBy(seekDirection * 5);

        // Continue seeking on interval while key is held
        keyboardSeekIntervalRef.current = window.setInterval(() => {
          const heldMs = performance.now() - keyboardSeekStartMsRef.current;
          const step = heldMs >= 1000 ? 4 : 2;
          seekBy(seekDirection * step);
        }, 120);
      }, 300);
    };

    const onKeyDown = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase?.();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }

      // Space or Shift for play/pause
      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        if (!hasTrack) {
          return;
        }
        event.preventDefault();
        togglePlayback();
        return;
      }

      // Left arrow: hold for 1s+ to seek backward, quick press for previous track
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        if (!hasTrack) {
          return;
        }
        startKeyboardSeekHold("ArrowLeft", -1);
        return;
      }

      // Right arrow: hold for 1s+ to seek forward, quick press for next track
      if (event.code === "ArrowRight") {
        event.preventDefault();
        if (!hasTrack) {
          return;
        }
        startKeyboardSeekHold("ArrowRight", 1);
        return;
      }

      if (event.code === "KeyJ") {
        event.preventDefault();
        seekBy(-5);
        return;
      }

      if (event.code === "KeyL") {
        event.preventDefault();
        seekBy(5);
        return;
      }

      if (event.code === "KeyM") {
        event.preventDefault();
        toggleMute();
        return;
      }

      if (event.code === "KeyR" && typeof onCycleRepeat === "function") {
        event.preventDefault();
        onCycleRepeat();
        return;
      }

      if (event.code === "KeyS" && typeof onToggleShuffle === "function") {
        event.preventDefault();
        onToggleShuffle();
        return;
      }

      if (event.code === "BracketLeft" && typeof onPlaybackRateChange === "function") {
        event.preventDefault();
        onPlaybackRateChange(Math.max(0.75, Number((playbackRate - 0.25).toFixed(2))));
        return;
      }

      if (event.code === "BracketRight" && typeof onPlaybackRateChange === "function") {
        event.preventDefault();
        onPlaybackRateChange(Math.min(2, Number((playbackRate + 0.25).toFixed(2))));
      }
    };

    const onKeyUp = (event) => {
      if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
        const direction = event.code === "ArrowLeft" ? -1 : 1;
        const shouldNavigateTrack = !keyboardSeekBeganRef.current; // Only navigate if seek didn't start
        stopKeyboardSeekHold();

        if (!hasTrack) {
          return;
        }

        if (shouldNavigateTrack) {
          if (direction === -1 && typeof onPrevious === "function") {
            onPrevious();
            return;
          }

          if (direction === 1 && typeof onNext === "function") {
            onNext();
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", stopKeyboardSeekHold);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", stopKeyboardSeekHold);
      stopKeyboardSeekHold();
    };
  }, [
    hasTrack,
    hotkeysEnabled,
    togglePlayback,
    toggleMute,
    seekBy,
    onCycleRepeat,
    onNext,
    onPlaybackRateChange,
    onPrevious,
    onToggleShuffle,
    playbackRate,
    track?.src,
  ]);

  return (
    <div
      className={[
        "cosmic-player-shell rounded-3xl",
        compact && variant === "orb" ? "compact-orb-shell" : "",
        compact ? "px-2.5 pb-2.5 pt-12" : "p-6 md:p-8",
        variant === "orb"
          ? compact
            ? "w-full max-w-[200px] border-0 bg-transparent"
            : "w-full max-w-2xl border border-aura-gold/35 bg-aura-card/86 backdrop-blur"
          : "glass-surface",
      ].join(" ")}
    >
      <audio
        ref={audioRef}
        src={track?.src ?? ""}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => {
          const nextTime = event.currentTarget.currentTime;
          setCurrentTime(nextTime);

          if (!storagePositionKey) {
            return;
          }

          const rounded = Math.floor(nextTime);
          if (Math.abs(rounded - lastSavedSecondRef.current) < 2) {
            return;
          }

          lastSavedSecondRef.current = rounded;
          const savedPositions = readJSONStorage(PLAYER_POSITIONS_KEY, {});
          savedPositions[storagePositionKey] = rounded;
          window.localStorage.setItem(PLAYER_POSITIONS_KEY, JSON.stringify(savedPositions));
        }}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(nextDuration);

          const restoreSecond = pendingRestoreSecondRef.current;
          if (
            Number.isFinite(restoreSecond) &&
            restoreSecond > 2 &&
            Number.isFinite(nextDuration) &&
            nextDuration > 5 &&
            restoreSecond < nextDuration - 1
          ) {
            event.currentTarget.currentTime = restoreSecond;
            setCurrentTime(restoreSecond);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (storagePositionKey) {
            const savedPositions = readJSONStorage(PLAYER_POSITIONS_KEY, {});
            savedPositions[storagePositionKey] = 0;
            window.localStorage.setItem(PLAYER_POSITIONS_KEY, JSON.stringify(savedPositions));
          }
          if (typeof onEnded === "function") {
            onEnded();
          }
        }}
      />

      {!isMinimal && (
        <p className={compact ? "text-center text-[10px] uppercase tracking-[0.2em] text-aura-textSoft" : "text-xs uppercase tracking-[0.2em] text-aura-textSoft"}>
          Audio Session
        </p>
      )}
      <h3 className={compact ? "mt-1 line-clamp-1 text-center text-base text-aura-text" : isMinimal ? "text-center text-2xl text-aura-text" : "mt-2 text-2xl text-aura-text"}>
        {track?.title ?? "Track"}
      </h3>
      {!isMinimal && (
        <p className={compact ? "mt-0.5 line-clamp-1 text-center text-[11px] text-aura-textSoft" : "mt-1 text-aura-textSoft"}>
          {track?.artist ?? "Unknown Artist"}
        </p>
      )}

      {showVisualizer && !compact && !isMinimal && (
        <div className="sound-visualizer mt-5" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, index) => (
            <span
              key={`bar-${index}`}
              className={`sound-visualizer-bar ${isPlaying ? "playing" : ""}`}
              style={{ animationDelay: `${index * 60}ms` }}
            />
          ))}
        </div>
      )}

      <div className={compact ? "mt-2.5 space-y-1.5" : isMinimal ? "mt-5 space-y-4" : "mt-6 flex flex-wrap items-center justify-center gap-4 text-center"}>
        <div
          className={
            compact
              ? "flex items-center justify-center gap-1.5"
              : isMinimal
                ? "flex items-center justify-center gap-3"
                : "flex items-center justify-center gap-2 rounded-full border border-aura-gold/20 bg-aura-bgSoft/55 px-2 py-2"
          }
        >
          <button
            type="button"
            onClick={typeof onPrevious === "function" ? onPrevious : undefined}
            disabled={!hasTrack || typeof onPrevious !== "function"}
            className={[
              "cosmic-glow-button flex items-center justify-center rounded-full border border-aura-gold/35 bg-aura-card/80 text-aura-gold transition hover:bg-aura-gold/14 disabled:cursor-not-allowed disabled:opacity-40",
              compact ? "h-8 w-8" : isMinimal ? "h-11 w-11" : "h-10 w-10",
            ].join(" ")}
            aria-label="Previous track"
            title="Previous track"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6v12M18 6l-8 6 8 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            disabled={!hasTrack}
            className={[
              "cosmic-glow-button flex items-center justify-center rounded-full border border-aura-gold/55 bg-gradient-to-r from-aura-gold to-aura-goldDeep text-aura-bg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50",
              compact ? "h-9 w-9" : isMinimal ? "h-14 w-14" : "h-12 w-12",
            ].join(" ")}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M8 6v12M16 6v12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 6l10 6-10 6V6z" fill="currentColor" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={typeof onNext === "function" ? onNext : undefined}
            disabled={!hasTrack || typeof onNext !== "function"}
            className={[
              "cosmic-glow-button flex items-center justify-center rounded-full border border-aura-gold/35 bg-aura-card/80 text-aura-gold transition hover:bg-aura-gold/14 disabled:cursor-not-allowed disabled:opacity-40",
              compact ? "h-8 w-8" : isMinimal ? "h-11 w-11" : "h-10 w-10",
            ].join(" ")}
            aria-label="Next track"
            title="Next track"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6v12M6 6l8 6-8 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

        </div>

        <div className={compact ? "w-full" : isMinimal ? "w-full px-2" : "min-w-[180px] flex-1 text-center"}>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={onSeek}
            onWheel={(event) => {
              event.preventDefault();
              seekBy(event.deltaY > 0 ? -3 : 3);
            }}
            className="audio-slider h-1.5 w-full"
            disabled={!hasTrack || !duration}
          />
          {isMinimal ? (
            <div className="mt-1 text-center text-[11px] text-aura-textSoft/85">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          ) : (
            <div className={compact ? "mt-0.5 flex justify-between text-[9px] text-aura-textSoft/85" : "mt-1 flex justify-between text-xs text-aura-textSoft/85"}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
              <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
          )}
        </div>

        {isMinimal && (
          <div className="mx-auto flex w-full max-w-xs items-center gap-2 px-2">
            <span className="flex h-7 w-7 items-center justify-center text-aura-textSoft" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M5 10v4h3l4 4V6l-4 4H5z" fill="currentColor" />
              </svg>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(event) => {
                const nextVolume = Number(event.target.value);
                setVolume(nextVolume);
                if (nextVolume > 0 && isMuted) {
                  setIsMuted(false);
                }
              }}
              className="audio-slider h-1.5 w-full"
              aria-label="Sound level"
            />
          </div>
        )}

        {!isMinimal && (
          <label className={compact ? "flex items-center justify-center gap-2 text-aura-textSoft/90" : "flex items-center justify-center gap-2 text-aura-textSoft/90"}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-aura-gold/20 bg-aura-bgSoft/60" aria-hidden="true">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M5 10v4h3l4 4V6l-4 4H5z" fill="currentColor" />
              </svg>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(event) => {
                const nextVolume = Number(event.target.value);
                setVolume(nextVolume);
                if (nextVolume > 0 && isMuted) {
                  setIsMuted(false);
                }
              }}
              className={compact ? "audio-slider h-1.5 w-16" : "audio-slider h-1.5 w-24"}
            />

            <button
              type="button"
              onClick={toggleMute}
              className="cosmic-glow-button flex h-9 w-9 items-center justify-center rounded-full border border-aura-gold/25 bg-aura-card/78 text-aura-textSoft transition hover:bg-aura-gold/12"
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 10v4h3l4 4V6l-4 4H5z" fill="currentColor" />
                  <path d="M15 9l4 6M19 9l-4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 10v4h3l4 4V6l-4 4H5z" fill="currentColor" />
                  <path d="M16 9a4.5 4.5 0 010 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </label>
        )}
      </div>

      {showAdvancedControls && !compact && !isMinimal && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-aura-gold/18 bg-aura-bgSoft/45 p-2.5">
          <button
            type="button"
            onClick={typeof onToggleShuffle === "function" ? onToggleShuffle : undefined}
            disabled={typeof onToggleShuffle !== "function"}
            aria-label={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
            title={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
            className={[
              "cosmic-glow-button flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-45",
              shuffleEnabled
                ? "player-mode-active border-aura-gold/55 bg-aura-gold/18 text-aura-text"
                : "border-aura-gold/25 bg-aura-card/78 text-aura-textSoft hover:bg-aura-gold/10",
            ].join(" ")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h4l8 10h4M4 17h4l2.5-3.2M16 7h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={typeof onCycleRepeat === "function" ? onCycleRepeat : undefined}
            disabled={typeof onCycleRepeat !== "function"}
            aria-label={repeatModeLabel}
            title={repeatModeLabel}
            className={[
              "cosmic-glow-button relative flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-45",
              repeatMode !== "off"
                ? "player-mode-active border-aura-gold/55 bg-aura-gold/18 text-aura-text"
                : "border-aura-gold/25 bg-aura-card/78 text-aura-textSoft hover:bg-aura-gold/10",
            ].join(" ")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 10V7h13M20 14v3H7M17 4l3 3-3 3M7 20l-3-3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {repeatMode === "one" && <span className="absolute -right-0.5 -top-0.5 text-[10px] font-semibold">1</span>}
          </button>

          <button
            type="button"
            onClick={cyclePlaybackRate}
            disabled={typeof onPlaybackRateChange !== "function"}
            aria-label={`Playback speed ${playbackRate.toFixed(2)}x`}
            title={`Playback speed ${playbackRate.toFixed(2)}x`}
            className="cosmic-glow-button flex h-10 w-10 items-center justify-center rounded-full border border-aura-gold/25 bg-aura-card/78 text-aura-textSoft transition hover:bg-aura-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 17a7 7 0 1114 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M12 12l4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <span className="min-w-[72px] rounded-full border border-aura-gold/20 bg-aura-bgSoft/55 px-3 py-1.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-aura-textSoft">
            {playbackRate.toFixed(2)}x
          </span>

          <button
            type="button"
            onClick={typeof onToggleFavorite === "function" ? onToggleFavorite : undefined}
            disabled={typeof onToggleFavorite !== "function"}
            aria-label={isFavorite ? "Favorited" : "Favorite"}
            title={isFavorite ? "Favorited" : "Favorite"}
            className={[
              "cosmic-glow-button flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-45",
              isFavorite
                ? "player-mode-active border-aura-gold/55 bg-aura-gold/18 text-aura-text"
                : "border-aura-gold/25 bg-aura-card/78 text-aura-textSoft hover:bg-aura-gold/10",
            ].join(" ")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} aria-hidden="true">
              <path d="M12 20s-6.5-3.9-8.6-7.7A5.1 5.1 0 016.6 4a5.2 5.2 0 015.4 2.8A5.2 5.2 0 0117.4 4a5.1 5.1 0 013.2 8.3C18.5 16.1 12 20 12 20z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {hasTrack && (
            <a
              href={track.src}
              download
              aria-label="Download"
              title="Download"
              className="cosmic-glow-button flex h-10 w-10 items-center justify-center rounded-full border border-aura-gold/25 bg-aura-card/78 text-aura-textSoft transition hover:bg-aura-gold/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 4v10M8 10l4 4 4-4M5 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          <label className="cosmic-glow-button flex items-center rounded-full border border-aura-gold/25 bg-aura-card/78 px-3 py-1.5 text-aura-textSoft transition hover:bg-aura-gold/10" title="Sleep timer">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14.5 3.5a8.5 8.5 0 108 11 7.5 7.5 0 01-8-11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <select
              value={sleepTimerSelection}
              onChange={(event) => {
                const value = event.target.value;
                setSleepTimerSelection(value);
                if (value === "off") {
                  setSleepTimerTargetMs(null);
                  return;
                }
                const minutes = Number(value);
                if (!Number.isFinite(minutes) || minutes <= 0) {
                  return;
                }
                setSleepTimerTargetMs(Date.now() + minutes * 60000);
                setSleepNowMs(Date.now());
              }}
              className="ml-2 rounded-md border border-aura-gold/20 bg-transparent px-2 py-0.5 text-[11px] uppercase"
              aria-label="Sleep timer"
            >
              <option value="off">Off</option>
              <option value="10">10m</option>
              <option value="20">20m</option>
              <option value="30">30m</option>
              <option value="45">45m</option>
              <option value="60">60m</option>
            </select>
          </label>

          <span className="rounded-full border border-aura-gold/20 bg-aura-bgSoft/55 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-aura-textSoft">
            {sleepRemainingLabel}
          </span>
        </div>
      )}

      {!hasTrack && !isMinimal && (
        <p className="mt-4 rounded-xl border border-aura-gold/24 bg-aura-gold/10 px-3 py-2 text-sm text-aura-text">
          Audio is unavailable for this track.
        </p>
      )}

      {playError && !isMinimal && (
        <p className="mt-3 rounded-xl border border-aura-gold/28 bg-aura-gold/10 px-3 py-2 text-xs text-aura-text">
          {playError}
        </p>
      )}

      {hotkeysEnabled && !compact && !isMinimal && (
        <p className={compact ? "mt-3 text-[10px] text-aura-textSoft/85" : "mt-4 text-xs text-aura-textSoft/85"}>
          Shortcuts: Space play/pause, hold Left/Right seek, J/L seek 5s, M mute, R repeat,
          S shuffle, [ and ] speed
        </p>
      )}

    </div>
  );
}
