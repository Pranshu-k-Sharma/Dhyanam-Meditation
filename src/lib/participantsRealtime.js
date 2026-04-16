import {
  clearStaleParticipants,
  GROUP_PARTICIPANTS_EVENT,
  listGroupParticipants,
  removeGroupParticipant,
  upsertGroupParticipant,
} from "./groupSession";

const PRESENCE_TTL_MS = 16000;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

let firebaseRefsPromise = null;

async function getFirebaseRefs() {
  if (!hasFirebaseConfig) {
    return null;
  }

  if (firebaseRefsPromise) {
    return firebaseRefsPromise;
  }

  firebaseRefsPromise = (async () => {
    const [{ getApps, initializeApp }, { getDatabase, onValue, ref, remove, set }] = await Promise.all([
      import("firebase/app"),
      import("firebase/database"),
    ]);

    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const db = getDatabase(app);

    return { db, onValue, ref, remove, set };
  })();

  return firebaseRefsPromise;
}

function sortParticipants(list) {
  return [...list].sort((a, b) => {
    if (a.role === "host" && b.role !== "host") {
      return -1;
    }

    if (b.role === "host" && a.role !== "host") {
      return 1;
    }

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export async function subscribeRoomParticipants(roomCode, onChange) {
  if (!roomCode) {
    onChange([]);
    return () => {};
  }

  const firebaseRefs = await getFirebaseRefs();
  if (!firebaseRefs) {
    const syncFromLocal = () => {
      const participants = clearStaleParticipants(roomCode, PRESENCE_TTL_MS);
      onChange(sortParticipants(participants));
    };

    syncFromLocal();
    window.addEventListener(GROUP_PARTICIPANTS_EVENT, syncFromLocal);
    window.addEventListener("storage", syncFromLocal);

    return () => {
      window.removeEventListener(GROUP_PARTICIPANTS_EVENT, syncFromLocal);
      window.removeEventListener("storage", syncFromLocal);
    };
  }

  const roomRef = firebaseRefs.ref(firebaseRefs.db, `presence/${roomCode}`);
  const unsubscribe = firebaseRefs.onValue(roomRef, (snapshot) => {
    const value = snapshot.val() || {};
    const threshold = Date.now() - PRESENCE_TTL_MS;
    const participants = Object.values(value).filter(
      (participant) => Number(participant?.lastSeenAt) >= threshold
    );
    onChange(sortParticipants(participants));
  });

  return unsubscribe;
}

export async function upsertRoomParticipant(roomCode, participant) {
  if (!roomCode || !participant?.id) {
    return [];
  }

  const firebaseRefs = await getFirebaseRefs();
  const payload = {
    ...participant,
    roomCode,
    lastSeenAt: Date.now(),
  };

  if (!firebaseRefs) {
    return upsertGroupParticipant(roomCode, payload);
  }

  await firebaseRefs.set(
    firebaseRefs.ref(firebaseRefs.db, `presence/${roomCode}/${participant.id}`),
    payload
  );

  return null;
}

export async function removeRoomParticipant(roomCode, participantId) {
  if (!roomCode || !participantId) {
    return [];
  }

  const firebaseRefs = await getFirebaseRefs();
  if (!firebaseRefs) {
    return removeGroupParticipant(roomCode, participantId);
  }

  await firebaseRefs.remove(
    firebaseRefs.ref(firebaseRefs.db, `presence/${roomCode}/${participantId}`)
  );

  return null;
}

export function getRoomParticipants(roomCode) {
  return listGroupParticipants(roomCode);
}

export function hasRemotePresence() {
  return hasFirebaseConfig;
}
