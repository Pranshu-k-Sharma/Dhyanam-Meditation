import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, ChevronDown, Minus, Mic, MicOff, MonitorPlay, ScreenShare, ScreenShareOff, Video, VideoOff, X } from "lucide-react";
import BorderGlow from "./BorderGlow";
import { createDefaultGroupSession, normalizeGroupSession, writeGroupSession } from "../lib/groupSession";

function formatRemaining(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function stopStream(stream) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      // Stream may already be stopped.
    }
  });
}

export default function GroupCallDock({ session, onSessionChange }) {
  const [isMounted, setIsMounted] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [screenError, setScreenError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const dragBoundsRef = useRef(null);

  const activeSession = useMemo(() => normalizeGroupSession(session), [session]);
  const isVisible = activeSession.active && Boolean(activeSession.startedAt) && activeSession.hasStarted;
  const progressPercent = useMemo(() => {
    if (!activeSession.active || !activeSession.startedAt) {
      return 0;
    }

    return Math.min(100, (elapsedSeconds / (activeSession.minutes * 60)) * 100);
  }, [activeSession.active, activeSession.minutes, activeSession.startedAt, elapsedSeconds]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!activeSession.active || !activeSession.startedAt) {
      setElapsedSeconds(0);
      return undefined;
    }

    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - activeSession.startedAt) / 1000));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeSession.active, activeSession.startedAt]);

  useEffect(() => {
    let cancelled = false;

    async function attachCamera() {
      setCameraError("");

      if (!activeSession.active || !activeSession.isCameraEnabled || !cameraVideoRef.current || !navigator.mediaDevices?.getUserMedia) {
        stopStream(cameraStreamRef.current);
        cameraStreamRef.current = null;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stopStream(stream);
          return;
        }

        stopStream(cameraStreamRef.current);
        cameraStreamRef.current = stream;
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      } catch {
        setCameraError("Camera access is blocked in this browser.");
      }
    }

    void attachCamera();

    return () => {
      cancelled = true;
    };
  }, [activeSession.active, activeSession.isCameraEnabled]);

  const stopScreenShare = () => {
    stopStream(screenStreamRef.current);
    screenStreamRef.current = null;

    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }

    onSessionChange(
      writeGroupSession({
        ...activeSession,
        isScreenSharing: false,
      })
    );
  };

  useEffect(() => {
    return () => {
      stopStream(cameraStreamRef.current);
      stopStream(screenStreamRef.current);
    };
  }, []);

  if (!isVisible || !isMounted) {
    return null;
  }

  const leaveCall = () => {
    stopStream(cameraStreamRef.current);
    stopStream(screenStreamRef.current);
    cameraStreamRef.current = null;
    screenStreamRef.current = null;

    onSessionChange(
      writeGroupSession(createDefaultGroupSession())
    );
  };

  const updateSession = (patch) => {
    onSessionChange(
      writeGroupSession({
        ...activeSession,
        ...patch,
      })
    );
  };

  const toggleScreenShare = async () => {
    if (!activeSession.active) {
      return;
    }

    if (activeSession.isScreenSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setScreenError("Screen share is not supported in this browser.");
      return;
    }

    setScreenError("");

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: activeSession.screenAudioEnabled,
      });

      stopStream(screenStreamRef.current);
      screenStreamRef.current = stream;

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play();
      }

      const nextSession = writeGroupSession({
        ...activeSession,
        isScreenSharing: true,
      });
      onSessionChange(nextSession);

      const stopSharing = () => {
        stopScreenShare();
      };

      stream.getVideoTracks()[0]?.addEventListener("ended", stopSharing, { once: true });
    } catch {
      setScreenError("Screen share was not started.");
      stopScreenShare();
    }
  };

  const participants = activeSession.joined ? 2 : 1;
  const remaining = activeSession.startedAt ? Math.max(0, activeSession.minutes * 60 - elapsedSeconds) : activeSession.minutes * 60;

  return (
    <div ref={dragBoundsRef} className="pointer-events-none fixed inset-0 z-[980]">
      {activeSession.minimized ? (
        <motion.button
          type="button"
          drag
          dragConstraints={dragBoundsRef}
          dragElastic={0.12}
          dragMomentum={false}
          whileDrag={{ scale: 1.03 }}
          initial={{ opacity: 0, scale: 0.82, y: 240 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => updateSession({ minimized: false })}
          className="pointer-events-auto absolute bottom-4 left-[calc(50%-30px)] flex h-[60px] w-[60px] cursor-grab select-none items-center justify-center rounded-full border border-aura-gold/28 bg-[#f8f2e7]/95 shadow-[0_16px_38px_rgba(28,18,8,0.2)] backdrop-blur active:cursor-grabbing"
          aria-label="Open meditation call"
          title="Open meditation call"
        >
          <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.92),rgba(209,191,163,0.62)_42%,rgba(28,18,8,0.18)_72%,rgba(15,10,5,0.08)_100%)] text-aura-text">
            <Minus className="h-4 w-4 text-aura-textSoft" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-aura-gold/25 bg-[#f8f2e7] text-[9px] text-aura-textSoft shadow-[0_8px_20px_rgba(28,18,8,0.16)]">
              {activeSession.roomCode ? activeSession.roomCode.slice(-2) : "•"}
            </span>
          </div>
        </motion.button>
      ) : (
        <motion.div
          drag
          dragConstraints={dragBoundsRef}
          dragElastic={0.08}
          dragMomentum={false}
          whileDrag={{ scale: 1.01 }}
          initial={{ opacity: 0, y: 320, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(92vw,390px)] -translate-x-1/2 cursor-grab active:cursor-grabbing"
        >
          <BorderGlow
            borderRadius={28}
            glowColor="28 18 8"
            backgroundColor="rgba(248,242,231,0.92)"
            glowRadius={24}
            glowIntensity={0.88}
            coneSpread={24}
          >
            <section className="overflow-hidden rounded-[1.5rem] border border-aura-gold/20 bg-[#f8f2e7]/96 shadow-[0_18px_50px_rgba(28,18,8,0.18)] backdrop-blur">
              <div className="flex items-center justify-between gap-3 border-b border-aura-gold/12 bg-[#efe7d8]/80 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-aura-textSoft">Meditation Call</p>
                  <h2 className="mt-0.5 text-lg font-semibold text-aura-text">{activeSession.roomCode || "Open Circle"}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSession({ minimized: true })}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-aura-gold/20 bg-aura-card/80 text-aura-textSoft transition hover:bg-aura-gold/12"
                    aria-label="Minimize call"
                    title="Minimize call"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={leaveCall}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-aura-gold/20 bg-aura-card/80 text-aura-textSoft transition hover:bg-aura-gold/12"
                    aria-label="Close call"
                    title="Close call"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-[1.35rem] border border-aura-gold/16 bg-[#120b05]">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f8f2e7]/70">
                    <span>You</span>
                    <span className="flex items-center gap-1">{activeSession.isCameraEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}{activeSession.isCameraEnabled ? "Live" : "Off"}</span>
                  </div>
                  <div className="relative aspect-[4/3] bg-[#0d0804]">
                    <video ref={cameraVideoRef} muted playsInline className={activeSession.isCameraEnabled ? "h-full w-full object-cover" : "hidden"} />
                    {!activeSession.isCameraEnabled && (
                      <div className="flex h-full items-center justify-center text-[#f8f2e7]/80">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.35rem] border border-aura-gold/16 bg-[#120b05]">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f8f2e7]/70">
                    <span>Screen</span>
                    <span className="flex items-center gap-1">{activeSession.isScreenSharing ? <ScreenShare className="h-3.5 w-3.5" /> : <ScreenShareOff className="h-3.5 w-3.5" />}{activeSession.isScreenSharing ? "Shared" : "Idle"}</span>
                  </div>
                  <div className="relative aspect-[4/3] bg-[#0d0804]">
                    <video ref={screenVideoRef} muted playsInline className={activeSession.isScreenSharing ? "h-full w-full object-cover" : "hidden"} />
                    {!activeSession.isScreenSharing && (
                      <div className="flex h-full items-center justify-center text-center text-[#f8f2e7]/78">
                        <div>
                          <ScreenShare className="mx-auto h-8 w-8" />
                          <p className="mt-2 text-[11px] uppercase tracking-[0.18em]">Ready for share</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateSession({ isCameraEnabled: !activeSession.isCameraEnabled })}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-aura-gold/18 bg-aura-bg/72 px-3 py-2.5 text-left transition hover:bg-aura-gold/10"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-aura-text">
                    {activeSession.isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    <span className="truncate">Camera</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-aura-textSoft">{activeSession.isCameraEnabled ? "On" : "Off"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSession({ isMicMuted: !activeSession.isMicMuted })}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-aura-gold/18 bg-aura-bg/72 px-3 py-2.5 text-left transition hover:bg-aura-gold/10"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-aura-text">
                    {activeSession.isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span className="truncate">Microphone</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-aura-textSoft">{activeSession.isMicMuted ? "Muted" : "Live"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void toggleScreenShare()}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-aura-gold/18 bg-aura-bg/72 px-3 py-2.5 text-left transition hover:bg-aura-gold/10"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-aura-text">
                    {activeSession.isScreenSharing ? <ScreenShareOff className="h-4 w-4" /> : <ScreenShare className="h-4 w-4" />}
                    <span className="truncate">Share screen</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-aura-textSoft">{activeSession.isScreenSharing ? "Stop" : "Start"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSession({ screenAudioEnabled: !activeSession.screenAudioEnabled })}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-aura-gold/18 bg-aura-bg/72 px-3 py-2.5 text-left transition hover:bg-aura-gold/10"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-aura-text">
                    <MonitorPlay className="h-4 w-4" />
                    <span className="truncate">Share audio</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-aura-textSoft">{activeSession.screenAudioEnabled ? "On" : "Off"}</span>
                </button>
              </div>

              <div className="rounded-[1.35rem] border border-aura-gold/16 bg-aura-bg/72 p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-aura-textSoft">
                  <span>{activeSession.mode} session</span>
                  <span>{participants} participant{participants === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-aura-bgSoft/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1c1208] via-[#6f5638] to-[#1c1208]" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-aura-textSoft">
                  <span>{formatRemaining(remaining)} remaining</span>
                  <span>{activeSession.screenAudioEnabled ? "Share audio on" : "Share audio off"}</span>
                </div>
              </div>

              {(cameraError || screenError) && (
                <div className="rounded-[1.1rem] border border-aura-gold/16 bg-aura-bg/68 p-2.5 text-xs leading-relaxed text-aura-textSoft">
                  {cameraError}
                  {cameraError && screenError ? " " : ""}
                  {screenError}
                </div>
              )}
              </div>
            </section>
          </BorderGlow>
        </motion.div>
      )}
    </div>
  );
}