import test from "node:test";
import assert from "node:assert/strict";
import { cases, bodyParts, patientView } from "../src/data/cases.js";
import { symptoms } from "../src/data/symptoms.js";
import { questions } from "../src/data/questions.js";
import {
  createSession,
  matches,
  mark,
  enterRole,
  requestHandoff,
  countOralQuestion,
  ask,
  optionsFor,
  selectAnswer,
  submitAnswer,
  guess,
  retry,
  nextCase,
  nextStage,
} from "../src/game/engine.js";

function doctor(stage = 1) {
  const s = createSession(stage);
  enterRole(s);
  requestHandoff(s, "doctor");
  enterRole(s);
  return s;
}
test("six fictional cases have complete evidence for exactly eighteen symptoms", () => {
  assert.equal(cases.length, 6);
  assert.equal(symptoms.length, 18);
  assert.equal(new Set(symptoms.map((item) => item.id)).size, 18);
  for (const entry of cases) {
    assert.deepEqual(
      Object.keys(entry.evidence).sort(),
      symptoms.map((item) => item.id).sort(),
    );
    assert.ok(
      Object.values(entry.evidence).every(
        (value) => typeof value === "boolean",
      ),
    );
    assert.deepEqual(matches(entry.evidence), [entry.id]);
  }
});
test("every annotation has a valid anatomical anchor and patient projection omits answers", () => {
  for (const entry of cases) {
    const view = patientView(entry);
    assert.deepEqual(Object.keys(view).sort(), ["context", "notes"]);
    assert.ok(view.notes.length >= 3);
    for (const note of view.notes) {
      assert.ok(bodyParts[note.part]);
      assert.ok(note.text.length > 10);
      for (const diagnosis of cases)
        assert.ok(!JSON.stringify(view).includes(diagnosis.disease));
    }
  }
});
test("all eighteen records start unknown and support repeated yes, no and clear without toggling errors", () => {
  const s = doctor();
  assert.deepEqual(s.records, {});
  for (const symptom of symptoms) {
    for (let i = 0; i < 20; i++) {
      assert.equal(mark(s, symptom.id, true), true);
      assert.equal(s.records[symptom.id], true);
      mark(s, symptom.id, true);
      assert.equal(s.records[symptom.id], true);
      mark(s, symptom.id, false);
      assert.equal(s.records[symptom.id], false);
      mark(s, symptom.id, null);
      assert.ok(!(symptom.id in s.records));
    }
  }
  assert.deepEqual(
    matches(s.records),
    cases.map((item) => item.id),
  );
  assert.equal(mark(s, "made-up", true), false);
});
test("candidate matching recomputes on both positive and negative evidence including zero matches", () => {
  for (const symptom of symptoms)
    for (const value of [true, false]) {
      assert.deepEqual(
        matches({ [symptom.id]: value }),
        cases
          .filter((entry) => entry.evidence[symptom.id] === value)
          .map((entry) => entry.id),
      );
    }
  assert.equal(matches({ fever: true, frequent: true }).length, 0);
});
test("handoff clears active role and prevents hidden role actions until confirmed", () => {
  const s = doctor();
  requestHandoff(s, "patient");
  assert.equal(s.role, null);
  assert.equal(mark(s, "fever", true), false);
  assert.equal(countOralQuestion(s), false);
  assert.equal(guess(s, "cold"), null);
  enterRole(s);
  assert.equal(s.role, "patient");
  assert.equal(mark(s, "fever", true), false);
});
test("stage one has no question-bank actions and stage three has no guessing or counting", () => {
  const s = doctor();
  assert.equal(ask(s, "body"), false);
  assert.equal(countOralQuestion(s), true);
  const practice = doctor(3);
  assert.equal(ask(practice, "body"), false);
  assert.equal(mark(practice, "fever", true), false);
  assert.equal(countOralQuestion(practice), false);
  assert.equal(guess(practice, "cold"), null);
});
test("wrong guess and record retry retain all question counts and confirmed history", () => {
  const s = doctor();
  countOralQuestion(s);
  countOralQuestion(s);
  mark(s, "fever", true);
  assert.equal(guess(s, "flu"), false);
  assert.equal(retry(s), true);
  assert.deepEqual(s.records, {});
  assert.equal(s.questionCount, 2);
  assert.equal(s.totalQuestions, 2);
  assert.equal(s.attempts, 1);
});
test("stage two requires patient confirmation, locks a sent answer, and preserves history on retry", () => {
  const s = doctor(2);
  assert.equal(ask(s, "body"), true);
  assert.equal(ask(s, "body"), false);
  assert.equal(s.questionCount, 1);
  assert.equal(s.role, null);
  enterRole(s);
  assert.equal(optionsFor(s).length, 4);
  assert.equal(submitAnswer(s), false);
  selectAnswer(s, "vague");
  assert.equal(s.history.length, 0);
  selectAnswer(s, "detail");
  assert.equal(submitAnswer(s), true);
  assert.equal(submitAnswer(s), false);
  assert.equal(selectAnswer(s, "guess"), false);
  assert.equal(s.history.length, 1);
  requestHandoff(s, "doctor");
  enterRole(s);
  retry(s);
  assert.equal(s.history.length, 1);
  assert.equal(s.questionCount, 1);
  assert.equal(ask(s, "nose"), true);
  assert.equal(s.questionCount, 2);
});
test("all cases and questions produce four distinct non-diagnostic responses", () => {
  for (const entry of cases)
    for (const question of questions) {
      const s = doctor(2);
      s.caseIndex = cases.indexOf(entry);
      ask(s, question.id);
      const options = optionsFor(s);
      assert.equal(new Set(options.map((item) => item.text)).size, 4);
      for (const option of options) {
        assert.ok(option.analysis.length > 10);
        for (const candidate of cases)
          assert.ok(!option.text.includes(candidate.disease));
      }
    }
});
test("next patient clears local records and question count while retaining cumulative totals", () => {
  const s = doctor();
  countOralQuestion(s);
  mark(s, "fever", false);
  assert.equal(nextCase(s), false);
  assert.equal(guess(s, "cold"), true);
  assert.equal(guess(s, "cold"), null);
  assert.equal(s.completed.length, 1);
  assert.equal(nextCase(s), true);
  assert.equal(s.caseIndex, 1);
  assert.equal(s.handoff, "patient");
  assert.equal(s.questionCount, 0);
  assert.equal(s.totalQuestions, 1);
  assert.deepEqual(s.records, {});
});
test("six-patient completion transitions through all three stages without leaking solved results", () => {
  const s = doctor();
  for (let stage = 1; stage <= 3; stage++) {
    assert.equal(s.stage, stage);
    for (const entry of cases) {
      if (s.handoff) enterRole(s);
      if (s.role !== "doctor") {
        requestHandoff(s, "doctor");
        enterRole(s);
      }
      if (stage !== 3) assert.equal(guess(s, entry.id), true);
      assert.equal(nextCase(s), true);
    }
    assert.equal(s.finished, true);
    assert.equal(s.role, null);
    assert.equal(nextStage(s), stage < 3);
  }
});
