let audioContext = null;
const STORAGE_KEY = "meditation.bell.enabled";
let bellEnabled = false;

try {
  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  bellEnabled = storedValue === "true";
} catch {
  bellEnabled = false;
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

export async function playBellChime() {
  if (!bellEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.06, now + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  master.connect(ctx.destination);

  const fundamental = ctx.createOscillator();
  fundamental.type = "sine";
  fundamental.frequency.setValueAtTime(783.99, now);
  fundamental.frequency.exponentialRampToValueAtTime(739.99, now + 0.55);

  const harmonic = ctx.createOscillator();
  harmonic.type = "triangle";
  harmonic.frequency.setValueAtTime(1174.66, now);
  harmonic.frequency.exponentialRampToValueAtTime(1046.5, now + 0.5);

  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0.35, now);
  harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  fundamental.connect(master);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(master);

  fundamental.start(now);
  harmonic.start(now + 0.01);
  fundamental.stop(now + 0.58);
  harmonic.stop(now + 0.5);

  window.setTimeout(() => {
    try {
      master.disconnect();
      harmonicGain.disconnect();
    } catch {
      // Audio nodes may already be disconnected.
    }
  }, 700);
}

export function isBellEnabled() {
  return bellEnabled;
}

export function setBellEnabled(enabled) {
  bellEnabled = Boolean(enabled);

  try {
    window.localStorage.setItem(STORAGE_KEY, String(bellEnabled));
  } catch {
    // Ignore storage failures and keep the in-memory preference.
  }
}
