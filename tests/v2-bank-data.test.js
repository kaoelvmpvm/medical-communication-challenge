import test from "node:test";
import assert from "node:assert/strict";
import { ASSESSMENT_BANKS, getAssessmentBank } from "../src/v2/assessment/data/index.js";
import { AXES, CASE_CATALOG } from "../src/v2/assessment/constants.js";
import { validateCaseBank, scoreAssessment, compareAssessments } from "../src/v2/assessment/scoring.js";

test("all four approved banks have 20 questions and 80 independently scored options each", () => {
  let qCount = 0, optionCount = 0;
  assert.deepEqual(Object.keys(ASSESSMENT_BANKS).sort(), CASE_CATALOG.map(c => c.id).sort());
  for (const [id, bank] of Object.entries(ASSESSMENT_BANKS)) {
    assert.equal(getAssessmentBank(id), bank);
    assert.ok(bank.scenario.length >= 150, `${id} should contain its full fixed scenario`);
    assert.equal(validateCaseBank(bank), true);
    assert.equal(bank.pre.length, 10);
    assert.equal(bank.post.length, 10);
    assert.deepEqual(bank.pre.map(q => q.id), Array.from({length:10},(_,n)=>`P${String(n+1).padStart(2,"0")}`));
    assert.deepEqual(bank.post.map(q => q.id), Array.from({length:10},(_,n)=>`T${String(n+1).padStart(2,"0")}`));
    for (const phase of ["pre","post"]) for (const question of bank[phase]) {
      qCount++;
      optionCount += question.options.length;
      assert.ok(question.prompt.startsWith("醫師問："), `${id}/${question.id} missing clinician prompt`);
      assert.equal(question.options.length, 4);
      assert.deepEqual(question.options.map(o=>o.id), ["A","B","C","D"]);
      assert.deepEqual(question.options.map(o=>o.score).sort((a,b)=>a-b), [-1,0,1,2]);
      assert.equal(new Set(question.options.map(o => o.text)).size, 4);
      assert.ok(question.options.every(o => o.text.length >= 12 && o.reason), `${id}/${question.id} too short`);
    }
    assert.deepEqual(
      AXES.map(a=>bank.pre.filter(q => q.axis===a.id).length), [2,2,2,2,2]);
    assert.deepEqual(
      AXES.map(a=>bank.post.filter(q => q.axis===a.id).length), [2,2,2,2,2]);
  }
  assert.equal(qCount, 80);
  assert.equal(optionCount, 320);
  assert.equal(getAssessmentBank("not-a-case"), null);
});
test("student answer selection is scored only by stable option IDs, not position or text length", () => {
  for (const bank of Object.values(ASSESSMENT_BANKS)) {
    for (const phase of ["pre","post"]) {
      const answers = Object.fromEntries(bank[phase].map(q => [q.id, q.options.find(o=>o.score===2).id]));
      const result = scoreAssessment(bank,phase,answers);
      assert.equal(result.complete,true);
      assert.equal(result.result.totalRaw,20);
      assert.equal(result.result.totalRadar,20);
      assert.deepEqual(result.result.dimensions.map(d=>d.radar), [4,4,4,4,4]);
    }
    const low=scoreAssessment(bank,"pre",Object.fromEntries(bank.pre.map(q=>[q.id,q.options.find(o=>o.score===-1).id])));
    const high=scoreAssessment(bank,"post",Object.fromEntries(bank.post.map(q=>[q.id,q.options.find(o=>o.score===2).id])));
    assert.equal(low.result.totalRaw,-10);
    assert.deepEqual(compareAssessments(low,high).map(x=>x.change), [4,4,4,4,4]);
  }
});
