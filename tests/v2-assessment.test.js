import test from "node:test";
import assert from "node:assert/strict";
import { AXES, CASE_CATALOG } from "../src/v2/assessment/constants.js";
import { validateCaseBank, scoreAssessment, compareAssessments } from "../src/v2/assessment/scoring.js";

function sampleBank(id = "cold") {
  const makeQuestions = (prefix) => Array.from({ length: 10 }, (_, index) => ({
    id: `${prefix}${String(index + 1).padStart(2, "0")}`,
    axis: AXES[Math.floor(index / 2)].id,
    prompt: `教師測試題 ${prefix} ${index + 1}`,
    options: [
      { id: "A", text: "完整且切題的資訊", score: 2, reason: "完整" },
      { id: "B", text: "部分正確資訊", score: 1, reason: "不完整" },
      { id: "C", text: "合理不知道", score: 0, reason: "尚未確認" },
      { id: "D", text: "忽略已知資訊", score: -1, reason: "忽略資訊" },
    ],
  }));
  return { id, scenario: "固定的模擬病情", pre: makeQuestions("P"), post: makeQuestions("T") };
}
function answers(bank, phase, selected) {
  return Object.fromEntries(bank[phase].map(q => [q.id, selected]));
}
test("P0 catalog declares four approved diseases, with five learner-facing axes", () => {
  assert.equal(CASE_CATALOG.length, 4);
  assert.equal(AXES.length, 5);
  assert.deepEqual(AXES.map(a => a.label),
    ["哪裡不舒服", "何時開始", "過敏情況", "吃過什麼藥", "自己的需求"]);
});
test("V2 complete bank must have 10 questions per phase, two per axis and four scoring options", () => {
  const bank = sampleBank();
  assert.equal(validateCaseBank(bank), true);
  const wrongCount = structuredClone(bank);
  wrongCount.post.pop();
  assert.throws(() => validateCaseBank(wrongCount), /expected 10 questions/);
  const wrongScore = structuredClone(bank);
  wrongScore.pre[0].options[3].score = 0;
  assert.throws(() => validateCaseBank(wrongScore), /exactly one/);
  const wrongAxis = structuredClone(bank);
  wrongAxis.pre[0].axis = "timing";
  assert.throws(() => validateCaseBank(wrongAxis), /expected 2 questions/);
  const duplicateID = structuredClone(bank);
  duplicateID.post[1].id = "T01";
  assert.throws(() => validateCaseBank(duplicateID), /duplicate question ID/);
});
test("score preserves raw negative values but clamps visual radar values to 0–4", () => {
  const bank = sampleBank();
  const negative = scoreAssessment(bank, "pre", answers(bank, "pre", "D"));
  assert.equal(negative.complete, true);
  assert.equal(negative.result.totalRaw, -10);
  assert.equal(negative.result.totalRadar, 0);
  for (const d of negative.result.dimensions) {
    assert.equal(d.raw, -2);
    assert.equal(d.radar, 0);
  }
  const perfect = scoreAssessment(bank, "post", answers(bank, "post", "A"));
  assert.equal(perfect.result.totalRaw, 20);
  assert.equal(perfect.result.totalRadar, 20);
  for (const d of perfect.result.dimensions) {
    assert.equal(d.raw, 4);
    assert.equal(d.radar, 4);
  }
  const diff = compareAssessments(negative, perfect);
  assert.deepEqual(diff.map(d => d.change), [4, 4, 4, 4, 4]);
});
test("incomplete attempts cannot be compared and answer IDs must exist", () => {
  const bank = sampleBank();
  const partiallyFilled = scoreAssessment(bank, "pre", { P01: "A" });
  assert.equal(partiallyFilled.complete, false);
  assert.equal(partiallyFilled.unanswered.length, 9);
  assert.equal(partiallyFilled.result, null);
  assert.throws(() => scoreAssessment(bank, "pre", { BAD: "A" }), /unknown answer/);
  assert.throws(() => compareAssessments(partiallyFilled, scoreAssessment(bank, "post", answers(bank, "post", "A"))),
    /complete/);
});
test("a post-test with a different disease cannot be compared to pre-test", () => {
  const cold = sampleBank("cold");
  const allergy = sampleBank("allergy");
  assert.throws(() => compareAssessments(
    scoreAssessment(cold, "pre", answers(cold, "pre", "A")),
    scoreAssessment(allergy, "post", answers(allergy, "post", "B")),
  ), /same case/);
});
