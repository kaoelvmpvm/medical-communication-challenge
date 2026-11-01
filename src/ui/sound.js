// Classroom-friendly, opt-in interaction sound effects. No external audio assets.
const KEY = "medical-challenge-sound-v1";
let enabled = false;
let audioContext = null;
try {
  enabled = localStorage.getItem(KEY) === "on";
} catch {
  // Private browsing/storage restrictions must not block the game.
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(next) {
  enabled = Boolean(next);
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    // The toggle still works for the current page when storage is unavailable.
  }
  return enabled;
}

export function playUiSound(kind = "tap") {
  if (!enabled || typeof window === "undefined") return;
  const AudioConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioConstructor) return;
  try {
    if (!audioContext) audioContext = new AudioConstructor();
    if (audioContext.state === "suspended")
      audioContext.resume().catch(() => {});
    const notes = kind === "enable" ? [523, 659] :
      kind === "navigate" ? [440, 587] :
      kind === "mark" ? [620] : [490];
    const origin = audioContext.currentTime + 0.007;
    notes.forEach((frequency, index) => {
      const at = origin + index * 0.068;
      const duration = kind === "tap" ? 0.065 : 0.105;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.022, at + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.005);
    });
  } catch {
    // Audio is optional; unsupported browsers must remain fully usable.
  }
}
