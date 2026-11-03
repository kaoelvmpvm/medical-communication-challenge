import { CASE_CATALOG } from "./assessment/constants.js";
import { getAssessmentBank } from "./assessment/data/index.js";
import { scoreAssessment } from "./assessment/scoring.js";

export const V2_STORAGE_KEY = "medical-challenge-v2-learning-v1";
export const FLOW_STEPS = Object.freeze([
  "choose", "pretest", "pre-result", "stage1-ready", "stage1", "stage2",
  "posttest", "final",
]);
const NEXT = Object.freeze({
  "pre-result": "stage1-ready",
  "stage1": "stage2",
  "stage2": "posttest",
});
const validCases = new Set(CASE_CATALOG.map(({ id }) => id));

export function freshProgress() {
  return { schema: 1, step: "choose", caseId: null, role: null,
    preAnswers: {}, postAnswers: {} };
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function isComplete(progress, phase) {
  return scoreAssessment(getAssessmentBank(progress.caseId), phase, progress[
    phase === "pre" ? "preAnswers" : "postAnswers"
  ]).complete;
}
export function validateProgress(progress) {
  assert(progress && progress.schema === 1 && FLOW_STEPS.includes(progress.step),
    "進度資料格式不正確。");
  if (progress.step === "choose") {
    assert(progress.caseId === null && progress.role === null, "初始資料不正確。");
    return progress;
  }
  assert(validCases.has(progress.caseId), "測驗疾病不存在。");
  assert([null, "doctor", "patient"].includes(progress.role), "角色資料不正確。");
  assert(progress.preAnswers && typeof progress.preAnswers === "object" &&
      !Array.isArray(progress.preAnswers) && progress.postAnswers &&
      typeof progress.postAnswers === "object" && !Array.isArray(progress.postAnswers),
  "答題資料不正確。");
  const bank = getAssessmentBank(progress.caseId);
  for (const [phase, answers] of [["pre", progress.preAnswers], ["post", progress.postAnswers]]) {
    const questions = bank[phase];
    assert(Object.keys(answers).every(id => {
      const q = questions.find(item => item.id === id);
      return q && q.options.some(o => o.id === answers[id]);
    }), "答題選項不存在。");
  }
  if (!["pretest"].includes(progress.step))
    assert(isComplete(progress, "pre"), "前測尚未完成。");
  if (["stage1", "stage2", "posttest", "final"].includes(progress.step))
    assert(progress.role === "doctor" || progress.role === "patient", "尚未選擇角色。");
  if (progress.step === "final") assert(isComplete(progress, "post"), "後測尚未完成。");
  return progress;
}
export function chooseCase(progress, caseId) {
  validateProgress(progress);
  assert(progress.step === "choose", "只有開始時可以選擇疾病。");
  assert(validCases.has(caseId), "請選擇有效的疾病情境。");
  return validateProgress({ ...progress, caseId, step: "pretest" });
}
export function recordChoice(progress, questionId, optionId) {
  validateProgress(progress);
  const phase = progress.step === "pretest" ? "pre" :
    progress.step === "posttest" ? "post" : null;
  assert(phase !== null, "目前不是測驗作答時間。");
  const bank = getAssessmentBank(progress.caseId);
  const q = bank[phase].find(item => item.id === questionId);
  assert(q && q.options.some(o => o.id === optionId), "請選擇有效的回答。");
  const name = phase === "pre" ? "preAnswers" : "postAnswers";
  return validateProgress({ ...progress, [name]: { ...progress[name], [questionId]: optionId } });
}
export function submitTest(progress) {
  validateProgress(progress);
  const phase = progress.step === "pretest" ? "pre" :
    progress.step === "posttest" ? "post" : null;
  assert(phase !== null, "目前無法送出測驗。");
  assert(isComplete(progress, phase), "請完成全部10道題目。");
  return validateProgress({ ...progress, step: phase === "pre" ? "pre-result" : "final" });
}
export function chooseRole(progress, role) {
  validateProgress(progress);
  assert(progress.step === "stage1-ready", "還沒有進入角色選擇。");
  assert(role === "doctor" || role === "patient", "角色不正確。");
  return validateProgress({ ...progress, role, step: "stage1" });
}
export function advance(progress) {
  validateProgress(progress);
  const next = NEXT[progress.step];
  assert(next, "目前不可前往下一階段。");
  return validateProgress({ ...progress, step: next });
}
export function restoreProgress(storage) {
  try {
    const raw = storage?.getItem(V2_STORAGE_KEY);
    if (!raw) return freshProgress();
    const data = JSON.parse(raw);
    return validateProgress(data);
  } catch {
    // Preserve a damaged saved record; never replace it silently.
    return null;
  }
}
export function persistProgress(storage, progress) {
  validateProgress(progress);
  storage?.setItem(V2_STORAGE_KEY, JSON.stringify(progress));
}
