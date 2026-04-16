export const GROUP_SESSION_STORAGE_KEY = "meditation-group-session";
export const GROUP_SESSION_EVENT = "meditation-group-session-changed";
export const GROUP_PARTICIPANTS_STORAGE_KEY = "meditation-group-participants";
export const GROUP_PARTICIPANTS_EVENT = "meditation-group-participants-changed";

const SESSION_MODES = ["silent", "breath", "mantra"];

const SESSION_LENGTHS = [10, 20, 30, 45];

export function createRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "CIRCLE-";

  for (let index = 0; index < 4; index += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }

  return code;
}

export function createCallId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = () => {
    let value = "";
    for (let index = 0; index < 4; index += 1) {
      value += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return value;
  };

  return `CALL-${segment()}-${segment()}`;
}

export function createDefaultGroupSession() {
  return {
    role: "host",
    locked: false,
    active: false,
    joined: false,
    hasStarted: false,
    roomCode: "",
    callId: "",
    mode: "breath",
    minutes: 20,
    startedAt: null,
    isCameraEnabled: true,
    isMicMuted: true,
    isScreenSharing: false,
    screenAudioEnabled: true,
    minimized: false,
  };
}

export function normalizeGroupSession(input) {
  const fallback = createDefaultGroupSession();

  if (!input || typeof input !== "object") {
    return fallback;
  }

  const roomCode = typeof input.roomCode === "string" && input.roomCode.trim() ? input.roomCode.trim().toUpperCase() : fallback.roomCode;
  const callId = typeof input.callId === "string" && input.callId.trim() ? input.callId.trim().toUpperCase() : fallback.callId;
  const mode = typeof input.mode === "string" && SESSION_MODES.includes(input.mode) ? input.mode : fallback.mode;
  const role = input.role === "guest" ? "guest" : "host";
  const minutes = Number.isFinite(Number(input.minutes)) && SESSION_LENGTHS.includes(Number(input.minutes))
    ? Number(input.minutes)
    : fallback.minutes;

  return {
    ...fallback,
    ...input,
    roomCode,
    callId,
    mode,
    role,
    locked: Boolean(input.locked),
    minutes,
    active: Boolean(input.active && Number.isFinite(Number(input.startedAt))),
    joined: Boolean(input.joined || roomCode),
    hasStarted: Boolean(input.hasStarted),
    startedAt: Number.isFinite(Number(input.startedAt)) ? Number(input.startedAt) : null,
    isCameraEnabled: input.isCameraEnabled !== false,
    isMicMuted: input.isMicMuted !== false,
    isScreenSharing: Boolean(input.isScreenSharing),
    screenAudioEnabled: input.screenAudioEnabled !== false,
    minimized: Boolean(input.minimized),
  };
}

export function readGroupSession() {
  try {
    const raw = window.localStorage.getItem(GROUP_SESSION_STORAGE_KEY);
    if (!raw) {
      return createDefaultGroupSession();
    }

    return normalizeGroupSession(JSON.parse(raw));
  } catch {
    return createDefaultGroupSession();
  }
}

export function writeGroupSession(nextSession) {
  const normalized = normalizeGroupSession(nextSession);
  window.localStorage.setItem(GROUP_SESSION_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(GROUP_SESSION_EVENT, { detail: normalized }));
  return normalized;
}

export function readGroupParticipants() {
  try {
    const raw = window.localStorage.getItem(GROUP_PARTICIPANTS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeGroupParticipants(nextState) {
  window.localStorage.setItem(GROUP_PARTICIPANTS_STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent(GROUP_PARTICIPANTS_EVENT, { detail: nextState }));
}

export function listGroupParticipants(roomCode) {
  if (!roomCode) {
    return [];
  }

  const allRooms = readGroupParticipants();
  const roomParticipants = allRooms[roomCode] || {};
  return Object.values(roomParticipants);
}

export function upsertGroupParticipant(roomCode, participant) {
  if (!roomCode || !participant?.id) {
    return [];
  }

  const allRooms = readGroupParticipants();
  const roomParticipants = allRooms[roomCode] || {};
  const nextRoomParticipants = {
    ...roomParticipants,
    [participant.id]: {
      ...roomParticipants[participant.id],
      ...participant,
      roomCode,
      lastSeenAt: Date.now(),
    },
  };

  const nextState = {
    ...allRooms,
    [roomCode]: nextRoomParticipants,
  };

  writeGroupParticipants(nextState);
  return Object.values(nextRoomParticipants);
}

export function removeGroupParticipant(roomCode, participantId) {
  if (!roomCode || !participantId) {
    return [];
  }

  const allRooms = readGroupParticipants();
  const roomParticipants = allRooms[roomCode] || {};

  if (!roomParticipants[participantId]) {
    return Object.values(roomParticipants);
  }

  const nextRoomParticipants = { ...roomParticipants };
  delete nextRoomParticipants[participantId];

  const nextState = { ...allRooms };
  if (Object.keys(nextRoomParticipants).length) {
    nextState[roomCode] = nextRoomParticipants;
  } else {
    delete nextState[roomCode];
  }

  writeGroupParticipants(nextState);
  return Object.values(nextRoomParticipants);
}

export function clearStaleParticipants(roomCode, staleAfterMs = 15000) {
  if (!roomCode) {
    return [];
  }

  const allRooms = readGroupParticipants();
  const roomParticipants = allRooms[roomCode] || {};
  const threshold = Date.now() - staleAfterMs;
  const nextRoomParticipants = Object.fromEntries(
    Object.entries(roomParticipants).filter(([, value]) => Number(value?.lastSeenAt) >= threshold)
  );

  if (Object.keys(nextRoomParticipants).length === Object.keys(roomParticipants).length) {
    return Object.values(roomParticipants);
  }

  const nextState = { ...allRooms };
  if (Object.keys(nextRoomParticipants).length) {
    nextState[roomCode] = nextRoomParticipants;
  } else {
    delete nextState[roomCode];
  }

  writeGroupParticipants(nextState);
  return Object.values(nextRoomParticipants);
}
