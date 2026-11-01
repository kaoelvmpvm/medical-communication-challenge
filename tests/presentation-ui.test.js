import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { portal, setup } from "../src/ui/portal.js";
import { isSoundEnabled, playUiSound } from "../src/ui/sound.js";

test("portal removes obsolete prompts but retains role actions and the art", () => {
  const html = portal({
    title: "/art/home/title.webp",
    hero: "/art/home/hero.webp",
    doctor: "/art/roles/doctor.webp",
    patient: "/art/roles/patient.webp",
    teacher: "/art/roles/teacher.webp",
  });
  for (const phrase of [
    "選擇角色，依教師指定的階段與回合開始。",
    "從一個好問題開始",
    "聽懂感受・問出線索・說得清楚",
  ]) assert.equal(html.includes(phrase), false);
  for (const phrase of ["我是醫生", "我是病人", "教師專用", "/art/home/title.webp"])
    assert.equal(html.includes(phrase), true);
});

test("page header uses art logo, removes the audio toggle and obsolete footer phrase", () => {
  const source = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /class="header-logo"/);
  assert.doesNotMatch(source, /data-action="toggle-sound"/);
  assert.doesNotMatch(source, /教學模擬・不是醫療診斷工具/);
});

test("sound is permanently enabled and safe without Web Audio", () => {
  assert.equal(isSoundEnabled(), true);
  assert.doesNotThrow(() => playUiSound("navigate"));
});

test("student stages are three selectable game buttons and medical technical copy is absent", () => {
  const html = setup("patient", { stage: 2 });
  assert.equal((html.match(/data-action="choose-stage"/g) || []).length, 3);
  assert.ok(!html.includes("<select name=\"stage\""));
  assert.match(html, /name="stage" value="2"/);
  assert.match(html, /data-stage="2" aria-pressed="true"/);
});
test("music toggle is independent from always-on interaction effects", async () => {
  const { isMusicEnabled, setMusicEnabled, activateMusicOnGesture, getMusicVolume, setMusicVolume } = await import("../src/ui/music.js");
  const before = isMusicEnabled();
  const previousVolume = getMusicVolume();
  try {
    assert.equal(typeof setMusicEnabled(false), "boolean");
    assert.equal(isMusicEnabled(), false);
    assert.doesNotThrow(() => activateMusicOnGesture());
    assert.equal(isSoundEnabled(), true);
    assert.equal(setMusicVolume(65), 65);
    assert.equal(getMusicVolume(), 65);
    assert.equal(setMusicVolume(-20), 0);
    assert.equal(setMusicVolume(120), 100);
    assert.equal(setMusicVolume(Number.NaN), 100);
  } finally {
    setMusicVolume(previousVolume);
    setMusicEnabled(before);
  }
});

test("background track uses supplied local M4A rather than generating a substitute tune", () => {
  const source = readFileSync(new URL("../src/ui/music.js", import.meta.url), "utf8");
  assert.match(source, /audio\/videoplayback\.m4a/);
  assert.doesNotMatch(source, /createOscillator|const melody/);
});

test("possible-case styling is green, and the obsolete gray override is removed", () => {
  const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
  const legacy = readFileSync(new URL("../src/teacher.css", import.meta.url), "utf8");
  assert.match(css, /\.candidate\.uncertain\s*\{[^}]*background:\s*#edf8f3/s);
  assert.doesNotMatch(legacy, /\.candidate\.uncertain/);
  assert.match(css, /\.candidate\.inconsistent\s*\{[^}]*background:\s*#eceff1/s);
});
test("background music slider is accessible and wired into volume updates", () => {
  const source = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /id="music-volume-slider"/);
  assert.match(source, /aria-label="背景音樂音量"/);
  assert.match(source, /setMusicVolume\(event\.target\.value\)/);
  assert.match(source, /id="music-volume-value"/);
});
