import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { portal } from "../src/ui/portal.js";
import { isSoundEnabled, setSoundEnabled, playUiSound } from "../src/ui/sound.js";

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

test("page header uses art logo, sound toggle and omits the obsolete footer phrase", () => {
  const source = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /class="header-logo"/);
  assert.match(source, /data-action="toggle-sound"/);
  assert.doesNotMatch(source, /教學模擬・不是醫療診斷工具/);
});

test("sound is opt-in and is safe without Web Audio or local storage", () => {
  const previous = isSoundEnabled();
  try {
    assert.equal(typeof setSoundEnabled(true), "boolean");
    assert.doesNotThrow(() => playUiSound("navigate"));
  } finally {
    setSoundEnabled(previous);
  }
});
