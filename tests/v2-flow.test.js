import test from "node:test";
import assert from "node:assert/strict";
import {
 freshProgress, chooseCase, recordChoice, submitTest,
 chooseRole, advance, validateProgress, restoreProgress,
 persistProgress, V2_STORAGE_KEY,
} from "../src/v2/flow.js";
import { CASE_CATALOG } from "../src/v2/assessment/constants.js";
import { getAssessmentBank } from "../src/v2/assessment/data/index.js";
import { compareAssessments, scoreAssessment } from "../src/v2/assessment/scoring.js";
import { home, chooseCasePage, assessment, roleChoice, finalResult, stepIndicator } from "../src/v2/view.js";
import { readFileSync } from "node:fs";

function perfectAnswer(progress, phase, score = 2) {
 const bank=getAssessmentBank(progress.caseId);
 let next=progress;
 for(const question of bank[phase]) {
   const option=question.options.find(item=>item.score===score);
   next=recordChoice(next,question.id,option.id);
 }
 return next;
}
function startPre(caseId="cold") {
 return chooseCase(freshProgress(),caseId);
}
function readyToPractice(caseId="cold") {
 let progress=perfectAnswer(startPre(caseId),"pre");
 progress=submitTest(progress);
 return advance(progress);
}
function completeRun(caseId) {
 let p=chooseRole(readyToPractice(caseId),"patient");
 p=advance(p);
 p=advance(p);
 p=perfectAnswer(p,"post",1);
 return submitTest(p);
}
test("P1 sequence is pre → stage1 → stage2 → post; no third stage entry", () => {
 const p=startPre("cold");
 assert.equal(p.step,"pretest");
 assert.throws(()=>advance(p),/目前不可/);
 assert.throws(()=>chooseRole(p,"doctor"),/還沒有進入/);
 const ready=readyToPractice("cold");
 assert.equal(ready.step,"stage1-ready");
 const stage1=chooseRole(ready,"doctor");
 assert.equal(stage1.step,"stage1");
 assert.equal(stage1.role,"doctor");
 const stage2=advance(stage1);
 assert.equal(stage2.step,"stage2");
 assert.equal(stage2.role,"doctor");
 const post=advance(stage2);
 assert.equal(post.step,"posttest");
 assert.equal(post.caseId,"cold");
 assert.throws(()=>advance(post),/目前不可/);
 const last=perfectAnswer(post,"post");
 assert.equal(submitTest(last).step,"final");
 assert.throws(()=>advance(submitTest(last)),/目前不可/);
});
test("P1 four selected cases all preserve same test scenario and independent phase answers", () => {
 for(const disease of CASE_CATALOG) {
   const done=completeRun(disease.id);
   assert.equal(done.caseId,disease.id);
   assert.equal(done.preAnswers && Object.keys(done.preAnswers).length,10);
   assert.equal(Object.keys(done.postAnswers).length,10);
   assert.equal(done.role,"patient");
   const bank=getAssessmentBank(done.caseId);
   const diff=compareAssessments(
     scoreAssessment(bank,"pre",done.preAnswers),
     scoreAssessment(bank,"post",done.postAnswers));
   assert.deepEqual(diff.map(d=>d.pre),[4,4,4,4,4]);
   assert.deepEqual(diff.map(d=>d.post),[2,2,2,2,2]);
   assert.match(finalResult(done),/前測/);
   assert.match(finalResult(done),/後測/);
 }
});
test("P1 cannot submit incomplete assessment, change case or alter completed test choices", () => {
 const p=startPre();
 assert.throws(()=>submitTest(p),/請完成全部10/);
 assert.throws(()=>chooseCase(p,"allergy"),/只有開始/);
 assert.throws(()=>recordChoice(p,"P01","Q"),/有效的回答/);
 assert.throws(()=>recordChoice(p,"T01","A"),/有效的回答/);
 const done=readyToPractice();
 assert.throws(()=>recordChoice(done,"P01","A"),/目前不是/);
});
test("P1 persistence survives reload and does not touch legacy teacher storage", () => {
 const saved=new Map([["medical-challenge-teacher-v1",JSON.stringify({legacy:true})]]);
 const storage={
   getItem:k=>saved.get(k)??null,
   setItem:(k,v)=>saved.set(k,v),
   removeItem:k=>saved.delete(k),
 };
 const p=perfectAnswer(startPre("gastro"),"pre");
 persistProgress(storage,p);
 assert.equal(restoreProgress(storage).caseId,"gastro");
 assert.equal(restoreProgress(storage).step,"pretest");
 assert.equal(saved.has("medical-challenge-teacher-v1"),true);
 assert.equal(saved.has(V2_STORAGE_KEY),true);
 saved.set(V2_STORAGE_KEY,"{bad");
 assert.equal(restoreProgress(storage),null);
 assert.equal(saved.get(V2_STORAGE_KEY),"{bad");
});
test("P1 UI exposes all four choices, accessible assessment and no scoring key on answering screen", () => {
 const empty=freshProgress();
 const landing=home({title:"/art/title.webp",hero:"/art/hero.webp"},false);
 assert.match(landing,/開始學習挑戰/);
 assert.match(landing,/教師專用/);
 const selector=chooseCasePage(empty,id=>`/art/cases/${id}.webp`);
 assert.equal((selector.match(/data-v2-action="choose-case"/g)||[]).length,4);
 for(const {title} of CASE_CATALOG) assert.ok(selector.includes(title));
 let p=startPre();
 let html=assessment(p,0);
 assert.equal((html.match(/data-v2-action="answer"/g)||[]).length,4);
 assert.match(html,/最有可能是你平常會說的話/);
 assert.doesNotMatch(html,/(?:正確答案|得分|說得太少)/);
 const option=getAssessmentBank("cold").pre[0].options[0];
 p=recordChoice(p,"P01",option.id);
 html=assessment(p,0);
 assert.match(html,/aria-pressed="true"/);
 assert.match(stepIndicator(p),/遊戲前測/);
 assert.doesNotMatch(stepIndicator(p),/第三階段/);
 const roles=roleChoice(readyToPractice(),{doctor:"/doctor.webp",patient:"/patient.webp"});
 assert.equal((roles.match(/data-v2-action="choose-role"/g)||[]).length,2);
 const source=readFileSync(new URL("../index.html",import.meta.url),"utf-8");
 assert.match(source,/\/src\/v2\/main\.js/);
 assert.doesNotMatch(source,/\/src\/main\.js/);
});
test("P1 resumed corrupted state requires deliberate reset and rejects invalid transitions", () => {
 assert.throws(()=>validateProgress({...freshProgress(),step:"final",caseId:"cold"}),/前測尚未完成/);
 assert.throws(()=>chooseCase(freshProgress(),"unknown"),/有效/);
 const p=completeRun("cold");
 assert.throws(()=>chooseRole(p,"patient"),/還沒有進入/);
});
