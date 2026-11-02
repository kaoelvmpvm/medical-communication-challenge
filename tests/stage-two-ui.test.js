import test from "node:test";
import assert from "node:assert/strict";
import { cases, patientView } from "../src/data/cases.js";
import { questions, answerOptions } from "../src/data/questions.js";
import { createIndependentSession } from "../src/game/engine.js";
import { patient } from "../src/ui/screens.js";
import { patientQuestions } from "../src/ui/portal.js";

test("second-stage patient has one question banner, three speech bubbles, and a central person", () => {
  const entry = cases[6];
  const session = createIndependentSession("patient", 2, 1, 6);
  const picker = patientQuestions(session, entry.id);
  assert.ok(picker.includes('class="stage-two-question-bar"'));
  assert.ok(picker.includes("選擇聽到的問題"));
  assert.ok(picker.includes('id="patient-question"'));
  assert.ok(!picker.includes("月經來的時候"));
  const empty = patient(session, patientView(entry), []);
  assert.equal((empty.match(/is-placeholder/g) || []).length, 3);
  assert.ok(empty.includes('class="stage-two-person case-art"'));
  assert.ok(empty.includes("劇情圖片"), "Missing art must have a placeholder");
  assert.ok(empty.includes(entry.diseaseCode));
  assert.ok(!empty.includes("我的病情線索"));
  assert.ok(!empty.includes('stage-two-clue-section'));
  assert.ok(!empty.includes('class="body-map"'));
  assert.ok(!empty.includes('class="body-note"'));
  const imageHtml = patient(session, {
    ...patientView(entry),
    artUrl: "/medical-communication-challenge/art/cases/viral_conjunctivitis.webp",
  }, []);
  assert.ok(imageHtml.includes('src="/medical-communication-challenge/art/cases/viral_conjunctivitis.webp"'));
  assert.ok(imageHtml.includes('alt="這位病患的情境插畫"'));
  assert.ok(!imageHtml.includes('class="art-placeholder"'));
  assert.ok(!imageHtml.includes("<svg"));
  assert.ok(!empty.includes(`<h2>${entry.disease}</h2>`));

  session.pending = "eyes";
  const options = answerOptions(entry, questions.find(q => q.id === "eyes"));
  assert.equal(options.length, 3);
  const markup = patient(session, patientView(entry), options);
  assert.equal((markup.match(/data-action="answer"/g) || []).length, 3);
  assert.ok(markup.includes('data-id="detail"'));
  assert.ok(markup.includes('data-id="brief"'));
  assert.ok(markup.includes('data-id="overlong"'));
  for (const label of ["說得恰到好處", "說得太少", "說太多但沒用"]) {
    assert.ok(!markup.includes(label), `Do not reveal category before confirming: ${label}`);
  }
  session.selectedAnswer = "detail";
  assert.ok(patient(session, patientView(entry), options).includes("✓ 已選擇"));
  session.submitted = true;
  assert.ok(patient(session, patientView(entry), options).includes("說得恰到好處"));
  assert.ok(patient(session, patientView(entry), options).includes("具體且切合問題"));
});

test("each case/question gives three distinct consistent and appropriately described speaking styles", () => {
  const positions = new Set();
  for (const entry of cases) for (const q of questions) {
    const options = answerOptions(entry, q);
    if (q.applicableCaseIds && !q.applicableCaseIds.includes(entry.id)) {
      assert.deepEqual(options, []);
      continue;
    }
    assert.equal(options.length, 3);
    assert.deepEqual(new Set(options.map(o => o.id)), new Set(["overlong", "detail", "brief"]));
    assert.deepEqual(new Set(options.map(o => o.quality)), new Set(["說太多但沒用", "說得恰到好處", "說得太少"]));
    assert.equal(new Set(options.map(o => o.text)).size, 3);
    positions.add(options.findIndex(o => o.id === "detail"));
    const detailed = options.find(o => o.id === "detail");
    assert.ok(detailed.text.length > options.find(o => o.id === "brief").text.length);
    for (const o of options) assert.ok(o.analysis.length > 10);
  }
  assert.deepEqual(positions, new Set([0, 1, 2]));
});
