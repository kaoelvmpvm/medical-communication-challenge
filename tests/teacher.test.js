import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyBook,
  addClass,
  saveGroup,
  adjust,
  rankings,
  validateBook,
  exportCsv,
} from "../src/teacher/model.js";
import { createStore, STORAGE_KEY } from "../src/teacher/store.js";
import { makeCode, readCode } from "../src/game/codes.js";
import {
  createIndependentSession,
  manualGuess,
  ask,
  guess,
  retry,
  mark,
} from "../src/game/engine.js";
function book() {
  const value = emptyBook();
  addClass(value, "815");
  saveGroup(value.classes[0], null, 1, ["1", "2", "3", "4", "5"]);
  return value;
}
function memory() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}
test("portable codes round-trip all six cases and fifteen stage-round pairs; invalid checksum rejected", () => {
  for (let i = 0; i < 6; i++)
    for (const stage of [1, 2, 3])
      for (let round = 1; round <= 5; round++) {
        const code = makeCode(i, stage, round);
        assert.equal(code.length, 12);
        assert.deepEqual(readCode(code), { code, stage, round, caseIndex: i });
        assert.throws(() =>
          readCode(code.slice(0, 11) + ((Number(code[11]) + 1) % 10)),
        );
      }
  assert.throws(() => readCode("123"));
  assert.throws(() => makeCode(6, 1, 1));
});
test("coded stages two and three retain five distinct cases and five rotating patient seats", () => {
  const group = book().classes[0].groups[0];
  for (const stage of [2, 3]) {
    const plan = group.plans[stage].map(readCode);
    assert.equal(new Set(plan.map((item) => item.caseIndex)).size, 5);
    assert.deepEqual(
      plan.map((item) => item.round),
      [1, 2, 3, 4, 5],
    );
    assert.ok(plan.every((item) => item.stage === stage));
  }
});
test("class and group validation rejects duplicate seats, including normalized values, but permits other classes", () => {
  const value = book(),
    entry = value.classes[0];
  assert.throws(() => addClass(value, " 815 "));
  assert.throws(() => saveGroup(entry, null, 2, ["01", "6", "7", "8", "9"]));
  assert.throws(() => saveGroup(entry, null, 2, ["6", "6", "7", "8", "9"]));
  assert.throws(() => saveGroup(entry, null, 2, ["6", "7", "8", "9", ""]));
  saveGroup(entry, null, 2, ["6", "7", "8", "9", "10"]);
  const group = entry.groups[0];
  group.scores[1].questions = 9;
  const codes = structuredClone(group.plans);
  saveGroup(entry, group.id, 3, ["1", "2", "3", "4", "5"]);
  assert.equal(group.scores[1].questions, 9);
  assert.deepEqual(group.plans, codes);
  addClass(value, "816");
  saveGroup(value.classes[1], null, 1, ["1", "2", "3", "4", "5"]);
  assert.equal(validateBook(value).classes.length, 2);
});
test("rapid counter operations are clamped and stages remain independent with no stage-three score", () => {
  const group = book().classes[0].groups[0];
  for (let i = 0; i < 30; i++) {
    adjust(group, 1, "questions", 1);
    adjust(group, 1, "completed", 1);
  }
  assert.deepEqual(group.scores[1], { questions: 30, completed: 5 });
  assert.deepEqual(group.scores[2], { questions: 0, completed: 0 });
  for (let i = 0; i < 60; i++) {
    adjust(group, 1, "questions", -1);
    adjust(group, 1, "completed", -1);
  }
  assert.deepEqual(group.scores[1], { questions: 0, completed: 0 });
  assert.throws(() => adjust(group, 3, "questions", 1));
  assert.throws(() => rankings([group], 3));
});
test("only fully complete groups qualify, ties use competition ranks 1,1,3", () => {
  const entry = book().classes[0];
  for (let i = 2; i <= 4; i++)
    saveGroup(
      entry,
      null,
      i,
      Array.from({ length: 5 }, (_, n) => String(i * 5 + n)),
    );
  entry.groups[0].scores[1] = { questions: 10, completed: 5 };
  entry.groups[1].scores[1] = { questions: 8, completed: 5 };
  entry.groups[2].scores[1] = { questions: 8, completed: 5 };
  entry.groups[3].scores[1] = { questions: 0, completed: 4 };
  assert.deepEqual(
    rankings(entry.groups, 1).map(({ rank, group }) => [group.number, rank]),
    [
      [2, 1],
      [3, 1],
      [1, 3],
      [4, null],
    ],
  );
});
test("automatic storage persists, undo restores the last operation, stale tabs cannot overwrite", () => {
  const storage = memory(),
    store = createStore(storage);
  store.commit((value) => Object.assign(value, book()), "新增");
  const second = createStore(storage);
  store.commit(
    (value) => adjust(value.classes[0].groups[0], 1, "questions", 1),
    "增加",
  );
  assert.equal(
    createStore(storage).book.classes[0].groups[0].scores[1].questions,
    1,
  );
  assert.throws(() =>
    second.commit((value) => addClass(value, "816"), "舊分頁"),
  );
  assert.equal(store.undo(), true);
  assert.equal(
    createStore(storage).book.classes[0].groups[0].scores[1].questions,
    0,
  );
  assert.equal(store.undo(), false);
});
test("storage quota/security failures do not alter records or replace the previous saved book", () => {
  const storage = memory(),
    store = createStore(storage);
  store.commit((value) => Object.assign(value, book()), "新增");
  const before = storage.getItem(STORAGE_KEY);
  storage.setItem = () => {
    throw new Error("quota");
  };
  assert.throws(() =>
    store.commit(
      (value) => adjust(value.classes[0].groups[0], 1, "questions", 1),
      "增加",
    ),
  );
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.equal(store.book.classes[0].groups[0].scores[1].questions, 0);
});
test("backup validates all fields and rejects invalid scores, duplicates, tampered plans atomically", () => {
  const original = book();
  assert.deepEqual(
    validateBook(JSON.parse(JSON.stringify(original))),
    original,
  );
  for (const mutate of [
    (b) => (b.version = 2),
    (b) => (b.classes[0].groups[0].scores[1].completed = 6),
    (b) => (b.classes[0].groups[0].scores[2].questions = -1),
    (b) => (b.classes[0].groups[0].seats[1] = "1"),
    (b) =>
      (b.classes[0].groups[0].plans[1][1] = b.classes[0].groups[0].plans[1][0]),
  ]) {
    const value = structuredClone(original);
    mutate(value);
    assert.throws(() => validateBook(value));
  }
  const storage = memory();
  storage.setItem(STORAGE_KEY, "bad json");
  assert.throws(() => createStore(storage));
  assert.equal(storage.getItem(STORAGE_KEY), "bad json");
});
test("CSV includes both independent stages and UTF-8 BOM, quotes commas and neutralizes spreadsheet formulas", () => {
  const value = book();
  value.classes[0].name = "=1+1";
  value.classes[0].groups[0].scores[2].questions = 17;
  const csv = exportCsv(value);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"17"'));
  assert.equal(csv.split("\r\n").length, 3);
  value.classes[0].name = '815,"A"';
  assert.ok(exportCsv(value).includes('"815,""A"""'));
});
test("independent doctor never receives an assigned case and guesses count as questions without automatic grading", () => {
  const doctor = createIndependentSession("doctor", 2, 1);
  assert.equal(doctor.caseIndex, null);
  assert.equal(guess(doctor, "cold"), null);
  assert.equal(manualGuess(doctor, "cold"), true);
  assert.equal(doctor.questionCount, 1);
  assert.equal(doctor.solved, false);
  mark(doctor, "fever", true);
  retry(doctor);
  assert.equal(doctor.questionCount, 1);
  assert.deepEqual(doctor.records, {});
  const stage2 = createIndependentSession("doctor", 2, 2);
  ask(stage2, "head");
  assert.equal(stage2.role, "doctor");
  assert.equal(stage2.handoff, null);
  assert.equal(ask(stage2, "nose"), true);
  assert.equal(stage2.questionCount, 2);
  assert.deepEqual(stage2.history, []);
  const stage3 = createIndependentSession("doctor", 3, 1);
  assert.equal(manualGuess(stage3, "cold"), false);
  assert.equal(stage3.questionCount, 0);
});
