// Original ambient puzzle-game loop. Generated locally; no copyrighted recordings.
const MUSIC_KEY = "medical-challenge-music-v1";
let enabled = true;
try {
  const stored = localStorage.getItem(MUSIC_KEY);
  if (stored === "off") enabled = false;
} catch {
  // In-memory defaults still work when browser storage is blocked.
}
let ctx = null;
let timer = null;
let cursor = 0;
let nextTime = 0;
let bus = null;
const tempo = 88;
const beat = 60 / tempo;
const pitch = (semitone) => 440 * Math.pow(2, semitone / 12);
// A short original four-bar C-major-pentatonic motif.
const melody = [0, null, 4, 7, null, 4, 2, null, -3, null, 0, 4, 7, 4, 2, null];
const bass = [-21, -16, -18, -14];
export const isMusicEnabled = () => enabled;
function note(frequency, at, duration, amplitude, voice = "sine") {
  if (!ctx || !bus) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = voice;
  osc.frequency.setValueAtTime(frequency, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(amplitude, at + 0.045);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(at);
  osc.stop(at + duration + 0.015);
}
function schedule() {
  if (!ctx || !enabled || document.hidden || ctx.state !== "running") return;
  while (nextTime < ctx.currentTime + 0.3) {
    const step = cursor % melody.length;
    if (melody[step] !== null) note(pitch(melody[step] - 9), nextTime, beat * 0.68, 0.026);
    if (step % 4 === 0) note(pitch(bass[Math.floor(step / 4)]), nextTime, beat * 3.0, 0.016, "triangle");
    if (step % 4 === 2) note(pitch(bass[Math.floor(step / 4)] + 12), nextTime, beat * 1.4, 0.008);
    nextTime += beat;
    cursor += 1;
  }
}
function stopScheduler() {
  if (timer !== null) { clearInterval(timer); timer = null; }
}
export function activateMusicOnGesture() {
  if (!enabled || typeof window === "undefined" || document.hidden) return;
  const AudioConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioConstructor) return;
  try {
    if (!ctx) {
      ctx = new AudioConstructor();
      bus = ctx.createGain();
      bus.gain.value = 0.23; // Quiet under spoken classroom discussion.
      bus.connect(ctx.destination);
      nextTime = ctx.currentTime + 0.06;
    }
    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        nextTime = Math.max(nextTime, ctx.currentTime + 0.04);
        if (timer === null) timer = setInterval(schedule, 110);
        schedule();
      }).catch(() => {});
    } else {
      if (timer === null) timer = setInterval(schedule, 110);
      schedule();
    }
  } catch {
    // Unsupported audio should never break the learning game.
  }
}
export function setMusicEnabled(next) {
  enabled = Boolean(next);
  try { localStorage.setItem(MUSIC_KEY, enabled ? "on" : "off"); } catch {}
  if (!enabled) {
    stopScheduler();
    if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
  }
  return enabled;
}
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopScheduler();
      if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
    }
    // Resume on next user gesture, to avoid mobile autoplay restrictions.
  });
}
