// Plays the supplied recording; no substitute synthesized tune.
const MUSIC_KEY = "medical-challenge-music-v1";
const AUDIO_PATH = `${import.meta.env?.BASE_URL || "/medical-communication-challenge/"}audio/videoplayback.m4a`;
const MUSIC_VOLUME_KEY = "medical-challenge-music-volume-v1";
const DEFAULT_VOLUME_PERCENT = 14;
let volumePercent = DEFAULT_VOLUME_PERCENT;
let enabled = true;
let track = null;
try {
  enabled = localStorage.getItem(MUSIC_KEY) !== "off";
  const saved = localStorage.getItem(MUSIC_VOLUME_KEY);
  if (saved !== null && saved.trim() !== "") {
    const parsed = Number(saved);
    if (Number.isFinite(parsed)) volumePercent = Math.max(0, Math.min(100, Math.round(parsed)));
  }
} catch {
  // Restricted browser storage must not block game use.
}
export function isMusicEnabled() { return enabled; }
export function getMusicVolume() { return volumePercent; }
export function setMusicVolume(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return volumePercent;
  volumePercent = Math.max(0, Math.min(100, Math.round(parsed)));
  try {
    localStorage.setItem(MUSIC_VOLUME_KEY, String(volumePercent));
  } catch {
    // Volume still updates when storage is unavailable.
  }
  if (track) track.volume = volumePercent / 100;
  return volumePercent;
}
function getTrack() {
  if (track || typeof Audio === "undefined") return track;
  track = new Audio(AUDIO_PATH);
  track.loop = true;
  track.preload = "none";
  track.volume = volumePercent / 100;
  return track;
}
export function activateMusicOnGesture() {
  if (!enabled || typeof document === "undefined" || document.hidden) return;
  const audio = getTrack();
  if (!audio || !audio.paused) return;
  try {
    const promise = audio.play();
    if (promise && typeof promise.catch === "function") promise.catch(() => {
      // Until the supplied music is uploaded, remain silent rather than play unrelated music.
    });
  } catch {
    // An unavailable audio file cannot interrupt the game.
  }
}
export function setMusicEnabled(next) {
  enabled = Boolean(next);
  try {
    localStorage.setItem(MUSIC_KEY, enabled ? "on" : "off");
  } catch {
    // In-memory setting works for this page.
  }
  if (!enabled) track?.pause();
  return enabled;
}
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) track?.pause();
    // Resume after a new user gesture to respect mobile autoplay restrictions.
  });
}
