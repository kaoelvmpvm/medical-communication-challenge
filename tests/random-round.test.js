import test from "node:test";
import assert from "node:assert/strict";
import { cases } from "../src/data/cases.js";
import { stageOneCases, stageOneSymptoms } from "../src/data/stage-one.js";
import {
  drawCaseIndex,
  createPatientRounds,
  PATIENT_ROUNDS_KEY,
} from "../src/game/random-round.js";
import {
  createIndependentSession,
  countOralQuestion,
  manualGuess,
} from "../src/game/engine.js";
import { doctor, patient, stageTwoQuestionGroups } from "../src/ui/screens.js";
import { questions } from "../src/data/questions.js";
import { patientView } from "../src/data/cases.js";
import { studentStatus, patientLoading } from "../src/ui/portal.js";
function memory() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}
test("first-stage random drawing is uniform across exactly eight cases", () => {
  assert.equal(stageOneCases.length, 8);
  assert.equal(cases.length, 12);
  const counts = Array(stageOneCases.length).fill(0);
  for (let value = 0; value < 800; value++)
    counts[drawCaseIndex(() => value)]++;
  assert.deepEqual(counts, Array(stageOneCases.length).fill(100));
  assert.equal(drawCaseIndex(() => 5), 5);
  assert.throws(() => drawCaseIndex(() => -1));
  assert.throws(() => drawCaseIndex(() => 2 ** 32));
});
test("start draws once per round, refresh restores, and repeated starts/revisits never redraw", () => {
  const storage = memory();
  let calls = 0;
  const rounds = createPatientRounds(storage, () => calls++);
  assert.equal(rounds.resume(), null);
  assert.equal(calls, 0);
  assert.deepEqual(rounds.start(1), { round: 1, caseIndex: 0 });
  assert.deepEqual(rounds.start(1), { round: 1, caseIndex: 0 });
  assert.equal(calls, 1);
  assert.deepEqual(
    createPatientRounds(storage, () => {
      throw new Error("must not redraw");
    }).resume(),
    { round: 1, caseIndex: 0 },
  );
  rounds.pause();
  assert.equal(rounds.resume(), null);
  assert.deepEqual(rounds.start(1), { round: 1, caseIndex: 0 });
  assert.equal(calls, 1);
  assert.deepEqual(rounds.start(2), { round: 2, caseIndex: 1 });
  assert.equal(calls, 2);
  assert.deepEqual(rounds.start(1), { round: 1, caseIndex: 0 });
  assert.equal(calls, 2);
});
test("all five rounds are retained independently with no teacher records written", () => {
  const storage = memory();
  storage.setItem("teacher-example", "unchanged");
  let calls = 0;
  const rounds = createPatientRounds(storage, () => calls++);
  for (let round = 1; round <= 5; round++)
    assert.equal(rounds.start(round).caseIndex, round - 1);
  for (let round = 5; round >= 1; round--)
    assert.equal(rounds.start(round).caseIndex, round - 1);
  assert.equal(calls, 5);
  assert.equal(storage.getItem("teacher-example"), "unchanged");
  assert.throws(() => rounds.start(6));
  assert.equal(calls, 5);
});
test("damaged state is never discarded or randomly replaced", () => {
  for (const raw of [
    "bad json",
    JSON.stringify({ version: 3, rounds: {}, activeRound: null }),
    JSON.stringify({ version: 2, rounds: { 1: stageOneCases.length }, activeRound: 1 }),
    JSON.stringify({ version: 1, rounds: {}, activeRound: 1 }),
  ]) {
    const storage = memory();
    storage.setItem(PATIENT_ROUNDS_KEY, raw);
    let calls = 0;
    const rounds = createPatientRounds(storage, () => {
      calls++;
      return 0;
    });
    assert.throws(() => rounds.start(1));
    assert.throws(() => rounds.resume());
    assert.equal(calls, 0);
    assert.equal(storage.getItem(PATIENT_ROUNDS_KEY), raw);
  }
});
test("failed persistence exposes no unsaved case and preserves an already loaded round", () => {
  const storage = memory();
  const rounds = createPatientRounds(storage, () => 3);
  rounds.start(1);
  const before = storage.getItem(PATIENT_ROUNDS_KEY);
  storage.setItem = () => {
    throw new Error("quota");
  };
  assert.throws(() => rounds.start(2), /無法保存/);
  assert.equal(storage.getItem(PATIENT_ROUNDS_KEY), before);
  assert.deepEqual(rounds.resume(), { round: 1, caseIndex: 3 });
});
test("V1.6 first-stage doctor renders eight candidates, twenty continuous records, and no guessing controls", () => {
  const s = createIndependentSession("doctor", 1, 1);
  const html = doctor(
    s,
    stageOneCases.map(({ id, disease }) => ({ id, disease })),
    stageOneCases.map((item) => item.id),
  );
  assert.equal((html.match(/data-symptom-card=/g) || []).length, 20);
  assert.equal((html.match(/data-candidate=/g) || []).length, 8);
  for (const item of stageOneSymptoms) assert.ok(html.includes(item.name), item.name);
  for (const forbidden of [
    "oral-panel",
    "decision-panel",
    "system-nav",
    "symptom-group",
    "data-record-progress",
    'data-action="count"',
    'data-action="open-guess"',
  ])
    assert.ok(!html.includes(forbidden));
  assert.ok(studentStatus(s, 6).includes('data-action="reset-doctor"'));
  assert.ok(!studentStatus(s, 6).includes("更換階段／回合"));
  assert.ok(!studentStatus(s, 6).includes("第 <strong>1</strong> / 5 回合"));
  assert.ok(!studentStatus(s, 6).includes("data-question-count"));
  assert.equal(countOralQuestion(s), false);
  assert.equal(manualGuess(s, "cold"), false);
  assert.equal(s.questionCount, 0);
  assert.ok(!patientLoading(1).includes("<input"));
  assert.ok(patientLoading(2).includes('name="code"'));
  assert.ok(patientLoading(3).includes('name="code"'));
  const stage2 = createIndependentSession("doctor", 2, 1);
  assert.equal(manualGuess(stage2, "cold"), true);
  assert.ok(studentStatus(stage2, 6).includes("data-question-count"));
});

test("next patient draws a new case without exposing a round picker and survives refresh", () => {
  const storage = memory();
  const draws = [4, 4, 6];
  let calls = 0;
  const rounds = createPatientRounds(storage, () => draws[calls++]);
  assert.deepEqual(rounds.next(), { round: 1, caseIndex: 4 });
  assert.deepEqual(rounds.next(), { round: 2, caseIndex: 5 });
  assert.deepEqual(rounds.resume(), { round: 2, caseIndex: 5 });
  rounds.pause();
  assert.equal(rounds.resume(), null);
  assert.deepEqual(rounds.next(), { round: 1, caseIndex: 6 });
  assert.equal(calls, 3);
});
test("failed new-patient persistence does not change the displayed case", () => {
  const storage = memory();
  const rounds = createPatientRounds(storage, () => 2);
  const before = rounds.next();
  const raw = storage.getItem(PATIENT_ROUNDS_KEY);
  storage.setItem = () => { throw new Error("quota"); };
  assert.throws(() => rounds.next(), /無法保存/);
  assert.deepEqual(rounds.resume(), before);
  assert.equal(storage.getItem(PATIENT_ROUNDS_KEY), raw);
});

test("second-stage doctor embeds every question once beneath the appropriate symptom group", () => {
  const s = createIndependentSession("doctor", 2, 1);
  const html = doctor(s, cases.map(({ id, disease }) => ({ id, disease })), cases.map((c) => c.id));
  const allIds = Object.values(stageTwoQuestionGroups).flat();
  assert.equal(allIds.length, questions.length);
  assert.deepEqual([...allIds].sort(), questions.map((q) => q.id).sort());
  for (const [group, ids] of Object.entries(stageTwoQuestionGroups)) {
    const section = html.split(`id="group-${group}"`)[1]?.split('</section>')[0] || "";
    for (const id of ids) assert.ok(section.includes(`data-action="ask" data-id="${id}"`), `${group}: ${id}`);
    assert.ok(section.indexOf("inline-question-list") < section.indexOf("symptom-grid"), group);
  }
  assert.equal((html.match(/data-symptom-card=/g)||[]).length, 28);
  assert.equal((html.match(/data-action="ask"/g)||[]).length, questions.length);
  assert.ok(!html.includes("decision-panel"));
  assert.ok(!html.includes("question-panel"));
  assert.ok(!html.includes("open-guess"));
  assert.ok(!html.includes("猜測疾病"));
});

test("patient game screen no longer reveals four-digit disease code", () => {
  const s = createIndependentSession("patient", 2, 1, 6);
  const html = patient(s, patientView(cases[6]), []);
  assert.ok(!html.includes("疾病代碼"));
  assert.ok(!html.includes("disease-code"));
  assert.ok(!html.includes(cases[6].diseaseCode));
  assert.ok(html.includes("僅供病患閱讀"));
});

test("V1.6 stage one has distinct eight-case yes/no scenarios, with no one- or two-question shortcuts", () => {
  assert.equal(stageOneSymptoms.length, 20);
  assert.equal(stageOneCases.length, 8);
  const keys = stageOneSymptoms.map(s => s.id);
  for (const entry of stageOneCases) {
    assert.deepEqual(Object.keys(entry.evidence), keys);
    assert.ok(Object.values(entry.evidence).every(v => typeof v === "boolean"));
    assert.equal(entry.notes.length, 6);
    assert.ok(entry.notes.every(note => note.text.length > 12));
  }
  for (let i=0;i<keys.length;i++)
    for (let j=i+1;j<keys.length;j++)
      for (const entry of stageOneCases) {
        const survivors = stageOneCases.filter(other => other.evidence[keys[i]] === entry.evidence[keys[i]]
          && other.evidence[keys[j]] === entry.evidence[keys[j]]);
        assert.ok(survivors.length >= 2, `${entry.id}: ${keys[i]}, ${keys[j]}`);
      }
  const key3 = ["belly", "fever", "sudden"];
  const signatures = stageOneCases.map(entry => key3.map(id => Number(entry.evidence[id])).join(""));
  assert.equal(new Set(signatures).size, 8);
});
