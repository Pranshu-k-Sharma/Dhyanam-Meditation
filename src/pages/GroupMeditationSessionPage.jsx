import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Crown, ExternalLink, Lock, Mic, MicOff, MonitorPlay, ScreenShare, Share2, Video, VideoOff, VolumeX, Wifi } from "lucide-react";
import BorderGlow from "../components/BorderGlow";
import { easeCalm, motionTiming } from "../lib/motion";
import {
  createCallId,
  createDefaultGroupSession,
  createRoomCode,
  readGroupSession,
  writeGroupSession,
  GROUP_SESSION_EVENT,
} from "../lib/groupSession";
import {
  removeRoomParticipant,
  subscribeRoomParticipants,
  upsertRoomParticipant,
} from "../lib/participantsRealtime";

const SESSION_MODES = [
  {
    key: "silent",
    label: "Silent Circle",
    description: "Hold shared stillness and keep the room quiet.",
  },
  {
    key: "breath",
    label: "Breath Sync",
    description: "Guide the room with a steady inhale and exhale rhythm.",
  },
  {
    key: "mantra",
    label: "Mantra Wave",
    description: "Repeat a mantra softly while the call stays open.",
  },
];

const SESSION_LENGTHS = [10, 20, 30, 45];

const ACTIVE_USER_STORAGE_KEY = "innerpeace.activeUser";

const JOIN_STEPS = [
  "Open invite",
  "Check camera & mic",
  "Choose mode",
  "Start circle",
  "Begin guided calm",
];

function pickConnectionQuality(count, live) {
  if (!live) {
    return { label: "Standby", detail: "No active media stream", tone: "text-aura-textSoft" };
  }

  if (count <= 3) {
    return { label: "Excellent", detail: "Stable call quality", tone: "text-emerald-700" };
  }

  if (count <= 6) {
    return { label: "Good", detail: "Balanced performance", tone: "text-amber-700" };
  }

  return { label: "Busy", detail: "Higher media load", tone: "text-rose-700" };
}

export default function GroupMeditationSessionPage() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const savedSession = useMemo(() => readGroupSession(), []);
  const linkedRoomCode = params.get("room")?.trim().toUpperCase() || "";
  const linkedCallId = params.get("call")?.trim().toUpperCase() || "";
  const linkedMode = params.get("mode")?.trim().toLowerCase() || "";
  const linkedMinutes = Number.parseInt(params.get("minutes") || "", 10);
  const linkedRole = params.get("role")?.trim().toLowerCase() || "";
  const linkedLocked = ["1", "true", "yes"].includes((params.get("locked") || "").trim().toLowerCase());
  const initialRole = linkedRole === "guest" || linkedRole === "host"
    ? linkedRole
    : savedSession.role === "guest"
      ? "guest"
      : "host";
  const isHost = initialRole === "host";

  const initialRoomCode = linkedRoomCode || savedSession.roomCode || createRoomCode();
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [inputCode, setInputCode] = useState(initialRoomCode);
  const [mode, setMode] = useState(
    SESSION_MODES.some((item) => item.key === linkedMode)
      ? linkedMode
      : savedSession.mode || "breath"
  );
  const [minutes, setMinutes] = useState(
    Number.isFinite(linkedMinutes) && SESSION_LENGTHS.includes(linkedMinutes)
      ? linkedMinutes
      : savedSession.minutes || 20
  );
  const [callId, setCallId] = useState(linkedCallId || savedSession.callId || createCallId());
  const [copyLabel, setCopyLabel] = useState("Copy invite link");
  const [hostCopyLabel, setHostCopyLabel] = useState("Copy host link");
  const [shareLabel, setShareLabel] = useState("Share invite");
  const [cameraEnabled, setCameraEnabled] = useState(savedSession.isCameraEnabled !== false);
  const [micMuted, setMicMuted] = useState(savedSession.isMicMuted !== false);
  const [roomLocked, setRoomLocked] = useState(() => linkedLocked || Boolean(savedSession.locked));
  const [networkStatus, setNetworkStatus] = useState("stable");
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState({ camera: "unknown", mic: "unknown" });
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState(
    linkedRoomCode
      ? `Invite link loaded for ${linkedRoomCode}. Join and start when ready.`
      : savedSession.active
        ? "Your call is already live in the dock. You can keep using the site while it stays open."
        : "Create or join a circle. The live meeting stays docked while you move through the rest of the website."
  );
  
  useEffect(() => {
    const syncFromSession = () => {
      const nextSession = readGroupSession();
      if (nextSession.roomCode) {
        setRoomCode(nextSession.roomCode);
        setInputCode(nextSession.roomCode);
      }
      if (nextSession.callId) {
        setCallId(nextSession.callId);
      }
      setRoomLocked(Boolean(nextSession.locked || linkedLocked));
      setMode(nextSession.mode || "breath");
      setMinutes(nextSession.minutes || 20);
      setMessage(
        nextSession.active
          ? "Your call is live in the dock. You can keep using the site while it stays open."
          : nextSession.joined
            ? "Your room is ready. Start the circle to open the docked meeting."
            : "Create or join a circle. The live meeting stays docked while you move through the rest of the website."
      );
    };

    syncFromSession();
    window.addEventListener(GROUP_SESSION_EVENT, syncFromSession);
    window.addEventListener("storage", syncFromSession);

    return () => {
      window.removeEventListener(GROUP_SESSION_EVENT, syncFromSession);
      window.removeEventListener("storage", syncFromSession);
    };
  }, []);

  const inviteLink = useMemo(() => {
    const query = new URLSearchParams({
      room: roomCode,
      call: callId,
      mode,
      minutes: String(minutes),
      role: "guest",
      locked: roomLocked ? "1" : "0",
    });

    return `${window.location.origin}/group-session?${query.toString()}`;
  }, [callId, minutes, mode, roomCode, roomLocked]);

  const hostInviteLink = useMemo(() => {
    const query = new URLSearchParams({
      room: roomCode,
      call: callId,
      mode,
      minutes: String(minutes),
      role: "host",
      locked: roomLocked ? "1" : "0",
    });

    return `${window.location.origin}/group-session?${query.toString()}`;
  }, [callId, minutes, mode, roomCode, roomLocked]);

  const qrLink = useMemo(() => {
    const encoded = encodeURIComponent(inviteLink);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encoded}`;
  }, [inviteLink]);

  const participantIdentity = useMemo(() => readParticipantIdentity(), []);
  const currentSession = readGroupSession();
  const isLive = currentSession.active;
  const userRole = initialRole;
  const joinedInRoom = Boolean(currentSession.joined && currentSession.roomCode === roomCode);

  const persistSession = (patch) => {
    const nextSession = writeGroupSession({
      ...readGroupSession(),
      roomCode,
      callId,
      mode,
      minutes,
      role: userRole,
      locked: roomLocked,
      joined: true,
      isCameraEnabled: cameraEnabled,
      isMicMuted: micMuted,
      ...patch,
    });

    return nextSession;
  };

  const handleCreateRoom = () => {
    const nextRoomCode = createRoomCode();
    const nextCallId = createCallId();
    setRoomLocked(false);
    setRoomCode(nextRoomCode);
    setInputCode(nextRoomCode);
    setCallId(nextCallId);
    persistSession({
      roomCode: nextRoomCode,
      callId: nextCallId,
      active: false,
      startedAt: null,
      joined: true,
      hasStarted: false,
      isCameraEnabled: cameraEnabled,
      isMicMuted: micMuted,
      locked: false,
      minimized: false,
    });
    setMessage(`Room ${nextRoomCode} is ready. The live dock will appear when you start the session.`);
  };

  const handleJoinRoom = () => {
    const nextRoomCode = inputCode.trim().toUpperCase();
    if (!nextRoomCode) {
      setMessage("Enter a room code to join.");
      return;
    }

    if (roomLocked && !isHost) {
      setMessage("This room is locked by the host. Ask the host to unlock before joining.");
      return;
    }

    const nextCallId = callId || createCallId();
    setRoomCode(nextRoomCode);
    setCallId(nextCallId);
    persistSession({
      roomCode: nextRoomCode,
      callId: nextCallId,
      active: false,
      startedAt: null,
      joined: true,
      hasStarted: false,
      isCameraEnabled: cameraEnabled,
      isMicMuted: micMuted,
      minimized: false,
    });
    setMessage(`Joined ${nextRoomCode}. Open the dock to manage camera, screen share, and audio.`);
  };

  const handleStartSession = () => {
    if (!roomCode.trim()) {
      setMessage("Create or join a room first.");
      return;
    }

    if (roomLocked && !isHost) {
      setMessage("Only the host can start while the room is locked.");
      return;
    }

    const nextCallId = createCallId();
    setCallId(nextCallId);

    persistSession({
      roomCode,
      callId: nextCallId,
      mode,
      minutes,
      joined: true,
      active: true,
      hasStarted: true,
      isCameraEnabled: cameraEnabled,
      isMicMuted: micMuted,
      startedAt: Date.now(),
      minimized: false,
      isScreenSharing: false,
    });

    setMessage("The call is live. Use the dock to share your screen or keep browsing the site.");
  };

  const handleStopSession = () => {
    persistSession({
      active: false,
      startedAt: null,
      isScreenSharing: false,
      minimized: false,
      joined: true,
      hasStarted: false,
    });

    setMessage("The live session ended, but your room is still ready.");
  };

  const handleLeaveRoom = () => {
    const reset = createDefaultGroupSession();
    writeGroupSession(reset);
    const nextRoomCode = createRoomCode();
    const nextCallId = createCallId();
    setRoomCode(nextRoomCode);
    setInputCode(nextRoomCode);
    setCallId(nextCallId);
    setRoomLocked(false);
    setMode("breath");
    setMinutes(20);
    setMessage("You left the room.");
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyLabel("Invite copied");
    } catch {
      // Fallback for browsers that block clipboard API.
      window.prompt("Copy this invite link", inviteLink);
      setCopyLabel("Copy manually");
    }

    window.setTimeout(() => setCopyLabel("Copy invite link"), 1800);
  };

  const handleOpenInvite = () => {
    window.open(inviteLink, "_blank", "noopener,noreferrer");
  };

  const handleCopyHostInvite = async () => {
    if (!isHost) {
      setMessage("Only hosts can share host links.");
      return;
    }

    try {
      await navigator.clipboard.writeText(hostInviteLink);
      setHostCopyLabel("Host link copied");
    } catch {
      window.prompt("Copy this host invite link", hostInviteLink);
      setHostCopyLabel("Copy manually");
    }

    window.setTimeout(() => setHostCopyLabel("Copy host link"), 1800);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      setShareLabel("Share unsupported");
      window.setTimeout(() => setShareLabel("Share invite"), 1800);
      return;
    }

    try {
      await navigator.share({
        title: "Join my meditation circle",
        text: `Join my ${mode} meditation session for ${minutes} minutes`,
        url: inviteLink,
      });
      setShareLabel("Shared");
    } catch {
      setShareLabel("Share canceled");
    }

    window.setTimeout(() => setShareLabel("Share invite"), 1800);
  };

  const handleDeviceCheck = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setDeviceStatus({ camera: "unsupported", mic: "unsupported" });
      setMessage("Device checks are not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setDeviceStatus({ camera: "ready", mic: "ready" });
      setMessage("Device check passed. You are ready to start or join the circle.");
    } catch {
      setDeviceStatus({ camera: "blocked", mic: "blocked" });
      setMessage("Camera or microphone access is blocked. Please allow permissions and try again.");
    }
  };

  const statusTone =
    deviceStatus.camera === "ready" && deviceStatus.mic === "ready"
      ? "Ready"
      : deviceStatus.camera === "blocked" || deviceStatus.mic === "blocked"
        ? "Blocked"
        : deviceStatus.camera === "unsupported" || deviceStatus.mic === "unsupported"
          ? "Unsupported"
          : "Unchecked";

  useEffect(() => {
    let unsubscribe = () => {};
    let disposed = false;

    const start = async () => {
      const nextUnsubscribe = await subscribeRoomParticipants(roomCode, (nextParticipants) => {
        setParticipants(nextParticipants);
      });

      if (disposed) {
        nextUnsubscribe();
        return;
      }

      unsubscribe = nextUnsubscribe;
    };

    void start();

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !joinedInRoom) {
      return;
    }

    const heartbeat = () => {
      void upsertRoomParticipant(roomCode, {
        id: participantIdentity.id,
        name: participantIdentity.name,
        role: userRole,
        isHost,
        isMicMuted: micMuted,
        isCameraEnabled: cameraEnabled,
        networkStatus,
      });
    };

    heartbeat();
    const heartbeatTimer = window.setInterval(heartbeat, 5000);

    const onBeforeUnload = () => {
      void removeRoomParticipant(roomCode, participantIdentity.id);
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearInterval(heartbeatTimer);
      void removeRoomParticipant(roomCode, participantIdentity.id);
    };
  }, [
    roomCode,
    joinedInRoom,
    participantIdentity.id,
    participantIdentity.name,
    userRole,
    isHost,
    micMuted,
    cameraEnabled,
    networkStatus,
  ]);

  const connectionQuality = useMemo(
    () => pickConnectionQuality(participants.length, isLive),
    [isLive, participants.length]
  );

  useEffect(() => {
    if (!isLive || !participants.length) {
      setActiveSpeakerIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSpeakerIndex((value) => (value + 1) % participants.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isLive, participants.length]);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("reconnecting");
      window.setTimeout(() => {
        setNetworkStatus("restored");
        window.setTimeout(() => setNetworkStatus("stable"), 1200);
      }, 900);
    };

    const handleOffline = () => {
      setNetworkStatus("reconnecting");
    };

    if (!isLive) {
      setNetworkStatus("stable");
      return undefined;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isLive]);

  const handleToggleRoomLock = () => {
    if (!isHost) {
      setMessage("Only the host can lock or unlock the room.");
      return;
    }

    setRoomLocked((value) => {
      const nextLocked = !value;
      persistSession({ locked: nextLocked });
      setMessage(
        nextLocked
          ? "Room locked. Only current participants stay connected."
          : "Room unlocked. New participants can join."
      );
      return nextLocked;
    });
  };

  const handleMuteAll = () => {
    if (!isHost) {
      setMessage("Only the host can mute all participants.");
      return;
    }

    setMessage("Host action: everyone has been asked to mute for the next breathing cycle.");
  };

  return (
    <section className="relative min-h-screen overflow-hidden px-6 py-10 md:px-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,242,231,0.98),rgba(209,191,163,0.92)_48%,rgba(248,242,231,0.88)_100%)]" />

      {isLive && networkStatus !== "stable" && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed right-4 top-4 z-[130] rounded-2xl border border-aura-gold/22 bg-aura-card/92 px-4 py-3 shadow-[0_14px_36px_rgba(28,18,8,0.16)] backdrop-blur"
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-aura-textSoft">
            {networkStatus === "reconnecting" ? "Reconnecting" : "Connection Restored"}
          </p>
          <p className="mt-1 text-sm text-aura-text">
            {networkStatus === "reconnecting"
              ? "Network is unstable. Keeping your circle active."
              : "Call quality is stable again."}
          </p>
        </motion.div>
      )}

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTiming.sectionReveal, ease: easeCalm }}
          className="space-y-6"
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-full border border-aura-gold/30 bg-aura-card/80 px-4 py-2 text-sm text-aura-textSoft transition hover:bg-aura-gold/10 hover:text-aura-text"
          >
            Back
          </button>

          <BorderGlow
            borderRadius={32}
            glowColor="28 18 8"
            backgroundColor="rgba(248,242,231,0.9)"
            glowRadius={30}
            glowIntensity={0.72}
            coneSpread={28}
          >
            <div className="rounded-[2rem] border border-aura-gold/18 bg-aura-card/86 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-aura-textSoft">
                <span className="rounded-full border border-aura-gold/20 bg-aura-bg/72 px-3 py-1.5">Live circle lobby</span>
                <span className="rounded-full border border-aura-gold/20 bg-aura-bg/72 px-3 py-1.5">Persistent dock</span>
                <span className="rounded-full border border-aura-gold/20 bg-aura-bg/72 px-3 py-1.5">Screen share audio supported</span>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="temple-label mb-3">Circle Lobby</p>
                  <h1 className="temple-heading text-4xl font-semibold md:text-6xl">Enter a calm live room with one tap.</h1>
                  <p className="aura-copy mt-4 max-w-2xl text-base leading-relaxed md:text-lg">
                    Configure your room, run a quick device check, and share a working invite instantly. The floating
                    dock appears only after you start the call.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="temple-chip temple-chip-active">Room {roomCode}</span>
                    <span className="temple-chip temple-chip-inactive inline-flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5" />
                      {isHost ? "Host" : "Guest"}
                    </span>
                    <span className="temple-chip temple-chip-inactive">{callId.slice(-5) || "call"}</span>
                    <span className="temple-chip temple-chip-inactive">{mode}</span>
                    <span className="temple-chip temple-chip-inactive">{minutes} min</span>
                    <span className="temple-chip temple-chip-inactive">{isLive ? "Live" : "Ready"}</span>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
                    <label className="flex flex-col gap-2 text-sm text-aura-textSoft">
                      Room code
                      <input
                        value={inputCode}
                        onChange={(event) => setInputCode(event.target.value.toUpperCase())}
                        placeholder="CIRCLE-ABCD"
                        className="aura-input rounded-2xl border border-aura-gold/20 bg-aura-card/80 px-4 py-3 text-base uppercase tracking-[0.12em] outline-none transition focus:border-aura-gold/50"
                      />
                    </label>

                    <div className="flex flex-col justify-end gap-3 sm:flex-row md:flex-col">
                      <button type="button" onClick={handleJoinRoom} className="aura-button w-full sm:w-auto">
                        Join Room
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateRoom}
                        className="rounded-full border border-aura-gold/28 bg-aura-bg/70 px-5 py-2.5 text-sm tracking-[0.12em] text-aura-text transition hover:bg-aura-gold/12"
                      >
                        New Room
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="inline-flex items-center gap-2 rounded-full border border-aura-gold/24 bg-aura-card/72 px-4 py-2 text-sm text-aura-textSoft transition hover:bg-aura-gold/10 hover:text-aura-text"
                    >
                      <Copy className="h-4 w-4" />
                      {copyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenInvite}
                      className="inline-flex items-center gap-2 rounded-full border border-aura-gold/24 bg-aura-card/72 px-4 py-2 text-sm text-aura-textSoft transition hover:bg-aura-gold/10 hover:text-aura-text"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open invite
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyHostInvite}
                      disabled={!isHost}
                      className="inline-flex items-center gap-2 rounded-full border border-aura-gold/24 bg-aura-card/72 px-4 py-2 text-sm text-aura-textSoft transition hover:bg-aura-gold/10 hover:text-aura-text disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Copy className="h-4 w-4" />
                      {hostCopyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="inline-flex items-center gap-2 rounded-full border border-aura-gold/24 bg-aura-card/72 px-4 py-2 text-sm text-aura-textSoft transition hover:bg-aura-gold/10 hover:text-aura-text"
                    >
                      <Share2 className="h-4 w-4" />
                      {shareLabel}
                    </button>
                    <span className="text-sm text-aura-textSoft">{message}</span>
                  </div>

                  {isHost && (
                    <p className="mt-2 text-xs text-aura-textSoft">
                      Host link keeps host permissions. Share it only with trusted co-hosts.
                    </p>
                  )}

                  <div className="mt-3 grid gap-3 rounded-2xl border border-aura-gold/18 bg-aura-bg/70 p-4 md:grid-cols-[auto_1fr] md:items-start">
                    <img src={qrLink} alt="QR code for guest invite link" className="h-24 w-24 rounded-xl border border-aura-gold/20 bg-white p-1" />
                    <div className="space-y-2">
                      <div className="rounded-xl border border-aura-gold/16 bg-aura-card/72 p-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-aura-gold/20 bg-aura-bg/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-aura-textSoft">
                            Guest link
                          </span>
                          {roomLocked && (
                            <span className="rounded-full border border-aura-gold/20 bg-aura-bg/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-aura-textSoft">
                              Locked room
                            </span>
                          )}
                        </div>
                        <a
                          href={inviteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block break-all text-sm text-aura-text underline decoration-aura-gold/40 underline-offset-4 hover:text-aura-gold"
                        >
                          {inviteLink}
                        </a>
                      </div>

                      {isHost && (
                        <div className="rounded-xl border border-aura-gold/16 bg-aura-card/72 p-3">
                          <span className="rounded-full border border-aura-gold/20 bg-aura-bg/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-aura-textSoft">
                            Host link
                          </span>
                          <a
                            href={hostInviteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block break-all text-sm text-aura-text underline decoration-aura-gold/40 underline-offset-4 hover:text-aura-gold"
                          >
                            {hostInviteLink}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-aura-gold/18 bg-aura-bg/72 p-5">
                  <p className="temple-label mb-4">Pre-join</p>
                  <div className="mb-4 grid gap-3 rounded-2xl border border-aura-gold/16 bg-aura-card/72 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-aura-text">Device readiness</p>
                      <span className="rounded-full border border-aura-gold/20 bg-aura-bg/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-aura-textSoft">
                        {statusTone}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setCameraEnabled((value) => !value)}
                        className="flex items-center justify-between rounded-xl border border-aura-gold/18 bg-aura-bg/68 px-3 py-2 text-sm text-aura-text transition hover:bg-aura-gold/10"
                      >
                        <span className="inline-flex items-center gap-2">
                          {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                          Camera on join
                        </span>
                        <span className="text-xs text-aura-textSoft">{cameraEnabled ? "On" : "Off"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMicMuted((value) => !value)}
                        className="flex items-center justify-between rounded-xl border border-aura-gold/18 bg-aura-bg/68 px-3 py-2 text-sm text-aura-text transition hover:bg-aura-gold/10"
                      >
                        <span className="inline-flex items-center gap-2">
                          {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          Mic on join
                        </span>
                        <span className="text-xs text-aura-textSoft">{micMuted ? "Muted" : "Live"}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeviceCheck}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-aura-gold/24 bg-aura-bg/68 px-3 py-2 text-sm text-aura-text transition hover:bg-aura-gold/10"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Run camera and mic check
                    </button>
                  </div>

                  <p className="temple-label mb-4">Meeting tools</p>
                  <div className="space-y-3">
                    {[
                      { icon: Video, title: "Camera in the dock", text: "Your self-view stays live in the corner while you browse the site." },
                      { icon: ScreenShare, title: "Screen share", text: "Share a tab or screen, and include system audio when your browser allows it." },
                      { icon: Wifi, title: "Keep using the site", text: "Mantras, sounds, and other pages stay available while the meeting is open." },
                      { icon: MonitorPlay, title: "Sound capture", text: "Browser-tab sharing captures music and mantra playback without extra setup." },
                      { icon: CheckCircle2, title: "Simple room flow", text: "Join, start, and leave without losing the room state." },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3 rounded-2xl border border-aura-gold/16 bg-aura-card/72 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-aura-gold/18 bg-aura-bg/80 text-aura-text">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-medium text-aura-text">{item.title}</h2>
                          <p className="mt-1 text-sm leading-relaxed text-aura-textSoft">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </BorderGlow>

          <div className="grid gap-6 lg:grid-cols-2">
            <BorderGlow
              borderRadius={28}
              glowColor="28 18 8"
              backgroundColor="rgba(248,242,231,0.88)"
              glowRadius={26}
              glowIntensity={0.66}
              coneSpread={24}
            >
              <div className="rounded-[1.75rem] border border-aura-gold/18 bg-aura-card/84 p-6">
                <p className="temple-label mb-3">Session mode</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SESSION_MODES.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMode(item.key)}
                      className={[
                        "rounded-2xl border px-4 py-4 text-left transition",
                        item.key === mode
                          ? "border-aura-gold/45 bg-aura-gold/10"
                          : "border-aura-gold/18 bg-aura-bg/68 hover:bg-aura-gold/8",
                      ].join(" ")}
                    >
                      <div className="text-lg font-medium text-aura-text">{item.label}</div>
                      <div className="mt-1 text-sm leading-relaxed text-aura-textSoft">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </BorderGlow>

            <BorderGlow
              borderRadius={28}
              glowColor="28 18 8"
              backgroundColor="rgba(248,242,231,0.88)"
              glowRadius={26}
              glowIntensity={0.66}
              coneSpread={24}
            >
              <div className="rounded-[1.75rem] border border-aura-gold/18 bg-aura-card/84 p-6">
                <p className="temple-label mb-3">Duration</p>
                <div className="flex flex-wrap gap-3">
                  {SESSION_LENGTHS.map((length) => (
                    <button
                      key={length}
                      type="button"
                      onClick={() => setMinutes(length)}
                      className={[
                        "rounded-full border px-4 py-2 text-sm transition",
                        length === minutes
                          ? "border-aura-gold/40 bg-aura-gold/12 text-aura-text"
                          : "border-aura-gold/18 bg-aura-bg/70 text-aura-textSoft hover:bg-aura-gold/8 hover:text-aura-text",
                      ].join(" ")}
                    >
                      {length} min
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleStartSession}
                    className="aura-button"
                    disabled={roomLocked && !isHost}
                  >
                    Start Circle
                  </button>
                  <button
                    type="button"
                    onClick={handleStopSession}
                    className="rounded-full border border-aura-gold/28 bg-aura-bg/70 px-5 py-2.5 text-sm tracking-[0.12em] text-aura-text transition hover:bg-aura-gold/12"
                  >
                    Stop Circle
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="rounded-full border border-aura-gold/20 bg-transparent px-5 py-2.5 text-sm tracking-[0.12em] text-aura-textSoft transition hover:bg-aura-gold/8 hover:text-aura-text"
                  >
                    Leave Room
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-aura-gold/16 bg-aura-bg/72 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-aura-textSoft">Host controls</p>
                    <span className="text-xs text-aura-textSoft">{isHost ? "Enabled" : "Host only"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleToggleRoomLock}
                      className="inline-flex items-center gap-2 rounded-full border border-aura-gold/22 bg-aura-bg/68 px-3 py-1.5 text-xs text-aura-text transition hover:bg-aura-gold/10"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      {roomLocked ? "Unlock room" : "Lock room"}
                    </button>
                    <button
                      type="button"
                      onClick={handleMuteAll}
                      className="inline-flex items-center gap-2 rounded-full border border-aura-gold/22 bg-aura-bg/68 px-3 py-1.5 text-xs text-aura-text transition hover:bg-aura-gold/10"
                    >
                      <VolumeX className="h-3.5 w-3.5" />
                      Mute all
                    </button>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-aura-gold/16 bg-aura-bg/72 p-4 text-sm leading-relaxed text-aura-textSoft">
                  The dock stays visible while you move through Mantras, Sounds, Breathing, or any other part of the website.
                  If you share the tab or window, site audio can be included when the browser allows audio capture.
                </div>
              </div>
            </BorderGlow>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <BorderGlow
              borderRadius={28}
              glowColor="28 18 8"
              backgroundColor="rgba(248,242,231,0.88)"
              glowRadius={26}
              glowIntensity={0.66}
              coneSpread={24}
            >
              <div className="rounded-[1.75rem] border border-aura-gold/18 bg-aura-card/84 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="temple-label">Circle presence</p>
                  <span className="rounded-full border border-aura-gold/18 bg-aura-bg/68 px-3 py-1 text-xs uppercase tracking-[0.14em] text-aura-textSoft">
                    {participants.length} participants
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {participants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                      className="inline-flex items-center gap-2 rounded-full border border-aura-gold/18 bg-aura-bg/70 px-3 py-1.5"
                    >
                      <motion.span
                        animate={
                          isLive && index === activeSpeakerIndex
                            ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0 rgba(28,18,8,0)", "0 0 14px rgba(111,86,56,0.45)", "0 0 0 rgba(28,18,8,0)"] }
                            : { scale: 1, boxShadow: "0 0 0 rgba(28,18,8,0)" }
                        }
                        transition={{ duration: 1.2, repeat: isLive && index === activeSpeakerIndex ? Infinity : 0 }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-aura-gold/18 bg-aura-card text-[11px] font-semibold text-aura-text"
                      >
                        {String(participant.name || "?").slice(0, 1).toUpperCase()}
                      </motion.span>
                      <span className="text-xs text-aura-text">
                        {participant.name}
                        {participant.id === participantIdentity.id ? " (You)" : ""}
                        {participant.role === "host" ? " host" : ""}
                        {isLive && index === activeSpeakerIndex ? " speaking" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-aura-textSoft">
                        {participant.isMicMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                        {participant.isCameraEnabled ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-aura-gold/16 bg-aura-bg/72 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.14em] text-aura-textSoft">Connection quality</span>
                    <span className={`text-sm font-semibold ${connectionQuality.tone}`}>{connectionQuality.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-aura-textSoft">{connectionQuality.detail}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-aura-bgSoft/70">
                    <motion.div
                      initial={{ width: "18%" }}
                      animate={{
                        width:
                          connectionQuality.label === "Excellent"
                            ? "92%"
                            : connectionQuality.label === "Good"
                              ? "72%"
                              : connectionQuality.label === "Busy"
                                ? "52%"
                                : "28%",
                      }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#1c1208] via-[#6f5638] to-[#1c1208]"
                    />
                  </div>
                </div>
              </div>
            </BorderGlow>

            <BorderGlow
              borderRadius={28}
              glowColor="28 18 8"
              backgroundColor="rgba(248,242,231,0.88)"
              glowRadius={26}
              glowIntensity={0.66}
              coneSpread={24}
            >
              <div className="rounded-[1.75rem] border border-aura-gold/18 bg-aura-card/84 p-6">
                <p className="temple-label">Join timeline</p>
                <div className="mt-4 space-y-3">
                  {JOIN_STEPS.map((step, index) => {
                    const isComplete = index < (isLive ? JOIN_STEPS.length : 3);
                    return (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.07 }}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                            isComplete
                              ? "border-aura-gold/35 bg-aura-gold/12 text-aura-text"
                              : "border-aura-gold/18 bg-aura-bg/70 text-aura-textSoft"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1 rounded-xl border border-aura-gold/16 bg-aura-bg/68 px-3 py-2">
                          <p className="text-sm text-aura-text">{step}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </BorderGlow>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function readParticipantIdentity() {
  try {
    const existingId = window.sessionStorage.getItem("meditation-participant-id");
    const id = existingId || (window.crypto?.randomUUID?.() ?? `participant-${Date.now()}`);

    if (!existingId) {
      window.sessionStorage.setItem("meditation-participant-id", id);
    }

    const raw = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const name = parsed?.name || parsed?.email || "Guest";

    return { id, name };
  } catch {
    return { id: `participant-${Date.now()}`, name: "Guest" };
  }
}