import { AXES, CHOICE_SCORES, PHASES, QUESTIONS_PER_AXIS, QUESTIONS_PER_PHASE, OPTIONS_PER_QUESTION } from "./constants.js";

const knownAxes = new Set(AXES.map(({ id }) => id));
const knownScores = new Set(CHOICE_SCORES);
const SCORE_SEQUENCE = [...CHOICE_SCORES].sort((a, b) => a - b).join(",");

function fail(message) {
  throw new Error(`V2 assessment: ${message}`);
}
function validateItem(item, phase, caseId) {
  if (!item || typeof item !== "object") fail("question must be an object");
  if (!/^([PT])\d{2}$/.test(item.id) ||
      item.id[0] !== (phase === "pre" ? "P" : "T")) fail(`${caseId}: invalid question ID ${item.id}`);
  if (!knownAxes.has(item.axis)) fail(`${caseId}/${item.id}: unknown axis`);
  if (typeof item.prompt !== "string" || !item.prompt.trim()) fail(`${caseId}/${item.id}: missing prompt`);
  if (!Array.isArray(item.options) || item.options.length !== OPTIONS_PER_QUESTION) fail(`${caseId}/${item.id}: expected 4 options`);
  if (new Set(item.options.map(o => o.id)).size !== OPTIONS_PER_QUESTION) fail(`${caseId}/${item.id}: option IDs must be unique`);
  if (item.options.some(o => !o || !/^[A-D]$/.test(o.id) || typeof o.text !== "string" || !o.text.trim() ||
      !knownScores.has(o.score) || typeof o.reason !== "string" || !o.reason.trim())) {
    fail(`${caseId}/${item.id}: option ID, text, score and rationale required`);
  }
  if (item.options.map(o => o.score).sort((a, b) => a - b).join(",") !== SCORE_SEQUENCE) {
    fail(`${caseId}/${item.id}: exactly one -1, 0, +1, +2 choice required`);
  }
}
export function validateCaseBank(caseBank) {
  if (!caseBank || typeof caseBank !== "object") fail("missing case bank");
  if (typeof caseBank.id !== "string" || !caseBank.id.trim()) fail("case id required");
  if (typeof caseBank.scenario !== "string" || !caseBank.scenario.trim()) fail(`${caseBank.id}: scenario required`);
  for (const phase of PHASES) {
    const questions = caseBank[phase];
    if (!Array.isArray(questions) || questions.length !== QUESTIONS_PER_PHASE) fail(`${caseBank.id}/${phase}: expected 10 questions`);
    const ids = questions.map(q => q.id);
    if (new Set(ids).size !== ids.length) fail(`${caseBank.id}/${phase}: duplicate question ID`);
    const prefix = phase === "pre" ? "P" : "T";
    const expected = Array.from({ length: QUESTIONS_PER_PHASE }, (_, n) => `${prefix}${String(n + 1).padStart(2, "0")}`);
    if (ids.slice().sort().join(",") !== expected.join(",")) fail(`${caseBank.id}/${phase}: IDs must be ${prefix}01–${prefix}10`);
    const counts = Object.fromEntries(AXES.map(axis => [axis.id, 0]));
    for (const question of questions) {
      validateItem(question, phase, caseBank.id);
      counts[question.axis] += 1;
    }
    for (const [axis, count] of Object.entries(counts)) {
      if (count !== QUESTIONS_PER_AXIS) fail(`${caseBank.id}/${phase}: ${axis} expected 2 questions, got ${count}`);
    }
  }
  return true;
}
export function scoreAssessment(caseBank, phase, choices) {
  validateCaseBank(caseBank);
  if (!PHASES.includes(phase)) fail("invalid phase");
  if (!choices || typeof choices !== "object" || Array.isArray(choices)) fail("choices object required");
  const questions = caseBank[phase];
  const used = new Set(questions.map(q => q.id));
  if (Object.keys(choices).some(id => !used.has(id))) fail("unknown answer question ID");
  const unanswered = questions.filter(q => !Object.hasOwn(choices, q.id)).map(q => q.id);
  if (unanswered.length) return { caseId: caseBank.id, phase, complete: false, unanswered, result: null };
  const perQuestion = questions.map(question => {
    const option = question.options.find(o => o.id === choices[question.id]);
    if (!option) fail(`${question.id}: unknown option ID`);
    return { id: question.id, axis: question.axis, optionId: option.id, score: option.score };
  });
  const dimensions = AXES.map(axis => {
    const points = perQuestion.filter(row => row.axis === axis.id).reduce((sum, row) => sum + row.score, 0);
    return { id: axis.id, label: axis.label, raw: points, radar: Math.max(0, Math.min(4, points)) };
  });
  return {
    caseId: caseBank.id,
    phase,
    complete: true,
    unanswered: [],
    result: {
      perQuestion,
      dimensions,
      totalRaw: dimensions.reduce((sum, axis) => sum + axis.raw, 0),
      totalRadar: dimensions.reduce((sum, axis) => sum + axis.radar, 0),
    },
  };
}
export function compareAssessments(pre, post) {
  if (!pre?.complete || !post?.complete) fail("comparison requires two complete assessments");
  if (pre.phase !== "pre" || post.phase !== "post") fail("pre and post must be in order");
  if (pre.caseId !== post.caseId) fail("both phases must use the same case");
  return AXES.map(axis => {
    const before = pre.result.dimensions.find(d => d.id === axis.id);
    const after = post.result.dimensions.find(d => d.id === axis.id);
    return { id: axis.id, label: axis.label, pre: before.radar, post: after.radar, change: after.radar - before.radar,
      preRaw: before.raw, postRaw: after.raw };
  });
}
