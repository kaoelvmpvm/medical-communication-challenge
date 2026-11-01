import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cases, bodyParts, patientView } from "../src/data/cases.js";
import { symptoms } from "../src/data/symptoms.js";
import {
  questions,
  questionsForCase,
  answerOptions,
} from "../src/data/questions.js";
import { comparison, matches } from "../src/game/engine.js";
import { markerGroups } from "../src/ui/body-map.js";

// Independent transcription of the user's C07–C12 acceptance table, columns in that order.
const expected = {
  fever: "NNNNNY",
  fatigue: "??????",
  aches: "???N??",
  headache: "???YNN",
  oneSide: "???N??",
  light: "N??N??",
  throat: "??N??N",
  runny: "NN???Y",
  sneeze: "NN????",
  cough: "??N??N",
  itch: "NN????",
  nausea: "?NNNN?",
  vomit: "??NNN?",
  diarrhea: "??N?N?",
  belly: "??N?Y?",
  frequent: "????N?",
  burning: "????N?",
  lower: "????Y?",
  redEye: "YN????",
  eyeDischarge: "Y?????",
  wheals: "?Y????",
  skinItch: "?Y????",
  heartburn: "??Y???",
  sourTaste: "??Y???",
  earPain: "?????Y",
  muffledHearing: "?????Y",
  bilateralPressure: "???Y??",
  periodCramps: "----Y-",
};
const symbol = (value) =>
  value === true
    ? "Y"
    : value === false
      ? "N"
      : value === "unknown"
        ? "?"
        : value === "not_applicable"
          ? "-"
          : "INVALID";
test("all 168 new-case facts exactly match the supplied four-state table", () => {
  assert.equal(symptoms.length, 28);
  assert.equal(cases.length, 12);
  assert.deepEqual(
    Object.keys(expected).sort(),
    symptoms.map((s) => s.id).sort(),
  );
  for (const [id, row] of Object.entries(expected))
    assert.equal(
      cases
        .slice(6)
        .map((entry) => symbol(entry.evidence[id]))
        .join(""),
      row,
      id,
    );
});
test("C01 through C06 original body narratives and locations are byte-for-byte unchanged", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL("./fixtures/original-narratives.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(
    cases.slice(0, 6).map(({ id, notes }) => ({
      id,
      notes: notes.map((note) => [note.part, note.text]),
    })),
    fixture,
  );
  assert.equal(cases[0].evidence.redEye, "unknown");
  assert.equal(cases[0].evidence.periodCramps, "not_applicable");
});
test("new narrative facts, identifiers, measurements and profiles keep the supplied core facts", () => {
  const ids = [
    "viral_conjunctivitis",
    "urticaria",
    "gerd",
    "tension_headache",
    "dysmenorrhea",
    "otitis_media",
  ];
  assert.deepEqual(
    cases.slice(6).map((c) => c.id),
    ids,
  );
  const anchors = [
    ["eye_right", "eye_left", "eyes", "eyes", "body"],
    ["arm_left", "waist", "arm_right", "skin", "body"],
    ["chest", "throat", "upper_abdomen", "chest", "body"],
    ["head_left", "head_right", "forehead", "head", "body"],
    ["lower_abdomen", "lower_back", "lower_abdomen", "body", "lower_abdomen"],
    ["ear_right", "ear_right", "forehead", "nose", "body"],
  ];
  cases.slice(6).forEach((entry, index) => {
    assert.equal(entry.notes.length, 5);
    assert.deepEqual(
      entry.notes.map((n) => n.part),
      anchors[index],
    );
    assert.equal(entry.profile.severity, [4, 6, 5, 4, 6, 6][index]);
    assert.equal(
      entry.profile.temperature,
      [
        "36.7°C，已測量",
        "36.6°C，已測量",
        "36.8°C，已測量",
        "36.6°C，已測量",
        "36.7°C，已測量",
        "38.1°C，已測量",
      ][index],
    );
  });
  assert.ok(cases[6].notes[2].text.includes("透明、水水的分泌物"));
  assert.ok(!cases[6].notes[2].text.includes("膿"));
  assert.equal(
    cases[7].profile.trigger,
    "目前不確定，不能自行認定是某種食物引起",
  );
  assert.ok(cases[8].profile.onset.includes("三週"));
  assert.ok(cases[9].profile.frequency.includes("四個月"));
  assert.ok(cases[10].profile.history.includes("近半年"));
  assert.ok(cases[11].profile.related.includes("前三天"));
  assert.ok(!Object.hasOwn(cases[10].profile, "gender"));
});
test("unknown and not-applicable facts never eliminate a case or claim certainty", () => {
  const c07 = cases[6];
  assert.equal(comparison(c07.evidence, { fatigue: true }), "insufficient");
  assert.equal(comparison(c07.evidence, { fatigue: false }), "insufficient");
  assert.equal(
    comparison(c07.evidence, { periodCramps: true }),
    "insufficient",
  );
  assert.ok(matches({ periodCramps: true }).includes(c07.id));
  assert.equal(comparison(c07.evidence, { redEye: true }), "consistent");
  assert.equal(comparison(c07.evidence, { redEye: false }), "conflict");
  assert.equal(
    comparison(c07.evidence, { fatigue: true, fever: true }),
    "conflict",
  );
  assert.equal(comparison(c07.evidence, {}), "unrecorded");
});
test("all anatomical keys exist and grouped 44px pins stay apart at the smallest body scale", () => {
  for (const name of [
    "eyes",
    "eye_left",
    "eye_right",
    "arm_left",
    "arm_right",
    "waist",
    "chest",
    "upper_abdomen",
    "head_left",
    "head_right",
    "lower_abdomen",
    "lower_back",
    "ear_left",
    "ear_right",
  ])
    assert.ok(bodyParts[name], name);
  assert.ok(bodyParts.eye_left.x > bodyParts.eye_right.x);
  assert.ok(bodyParts.head_left.x > bodyParts.head_right.x);
  assert.ok(bodyParts.arm_left.x > bodyParts.arm_right.x);
  assert.ok(bodyParts.ear_left.x > bodyParts.ear_right.x);
  for (const entry of cases) {
    const groups = markerGroups(entry.notes);
    assert.deepEqual(
      groups.flatMap((g) => g.notes.map((n) => n.id)).sort(),
      entry.notes.map((n) => n.id).sort(),
    );
    for (let i = 0; i < groups.length; i++)
      for (let j = i + 1; j < groups.length; j++)
        assert.ok(
          Math.hypot(
            (groups[i].x - groups[j].x) * 2,
            (groups[i].y - groups[j].y) * 4,
          ) >= 46,
        );
  }
});
test("period questions apply only to C11, without inferring gender or a false menstrual answer", () => {
  const period = questions.find((q) => q.id === "period");
  assert.deepEqual(period.applicableCaseIds, ["dysmenorrhea"]);
  for (const entry of cases) {
    const applicable = entry.id === "dysmenorrhea";
    assert.equal(
      questionsForCase(entry.id).some((q) => q.id === "period"),
      applicable,
    );
    assert.equal(entry.applicability.period, applicable);
    if (!applicable) assert.deepEqual(answerOptions(entry, period), []);
  }
});
test("missing information produces an explicit uncertain answer, not an invented absence", () => {
  const q = questions.find((q) => q.id === "ears");
  const answer = answerOptions(cases[6], q).find((a) => a.id === "detail");
  assert.ok(answer.text.includes("不確定"));
  assert.ok(!answer.text.includes("耳朵不會痛"));
  assert.ok(!answer.text.includes("聽聲音和平常一樣"));
  const checks = [
    [7, "throat", "沒有呼吸困難"],
    [8, "stomach", "沒有想吐、真正嘔吐、腹部絞痛或腹瀉"],
    [10, "stomach", "沒有噁心、嘔吐或腹瀉"],
    [11, "head", "沒有明顯頭痛"],
    [11, "body", "38.1°C"],
  ];
  for (const [index, id, text] of checks)
    assert.ok(
      answerOptions(
        cases[index],
        questions.find((q) => q.id === id),
      )
        .find((a) => a.id === "detail")
        .text.includes(text),
    );
});
test("new-case best responses use source facts, vary position, and are not always longest", () => {
  const ids = ["eyes", "skin", "chest", "head", "period", "ears"];
  const positions = new Set();
  for (let i = 0; i < 6; i++) {
    const entry = cases[i + 6],
      q = questions.find((q) => q.id === ids[i]),
      options = answerOptions(entry, q),
      best = options.find((a) => a.id === "detail");
    positions.add(options.indexOf(best));
    assert.ok(best.text.startsWith(entry.responses[ids[i]]));
    assert.ok(options.some((option) => option.text.length > best.text.length));
    for (const candidate of cases)
      assert.ok(!best.text.includes(candidate.disease));
  }
  assert.ok(positions.size > 1);
});
