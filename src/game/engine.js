import { cases, patientView } from "../data/cases.js";
import { stageOneCases, stageOneSymptoms } from "../data/stage-one.js";
import { symptoms } from "../data/symptoms.js";
import {
  questions,
  answerOptions,
  questionApplies,
} from "../data/questions.js";

export function createSession(stage = 1) {
  if (![1, 2, 3].includes(stage)) throw new Error("無效階段");
  return {
    stage,
    caseIndex: 0,
    role: null,
    handoff: "patient",
    records: {},
    questionCount: 0,
    totalQuestions: 0,
    pending: null,
    history: [],
    completed: [],
    selectedAnswer: null,
    submitted: false,
    attempts: 0,
    solved: false,
    practice: [],
    finished: false,
  };
}
export function comparison(evidence, records) {
  const entries = Object.entries(records).filter(([, value]) => typeof value === "boolean");
  if (!entries.length) return "unrecorded";

  // An explicit contradiction eliminates this fictional case.
  // Unknown and not-applicable facts must never be interpreted as "no".
  for (const [id, answer] of entries) {
    if (typeof evidence[id] === "boolean" && evidence[id] !== answer)
      return "conflict";
  }

  // Only a complete check of every defined yes/no fact can confirm a match.
  // A partial match remains a possible (green) candidate.
  const fullyChecked = Object.entries(evidence)
    .filter(([, fact]) => typeof fact === "boolean")
    .every(([id, fact]) => records[id] === fact);
  return fullyChecked ? "consistent" : "insufficient";
}

export function matches(records, pool = cases) {
  return pool
    .filter((entry) => comparison(entry.evidence, records) !== "conflict")
    .map((entry) => entry.id);
}
export function mark(session, id, value) {
  if (
    session.role !== "doctor" ||
    session.handoff ||
    session.stage === 3 ||
    session.solved
  )
    return false;
  if (
    !(session.independent && session.stage === 1 ? stageOneSymptoms : symptoms).some((symptom) => symptom.id === id) ||
    ![true, false, null].includes(value)
  )
    return false;
  if (value === null) delete session.records[id];
  else session.records[id] = value;
  return true;
}
export function requestHandoff(session, target) {
  if (!["doctor", "patient"].includes(target)) return false;
  session.role = null;
  session.handoff = target;
  return true;
}
export function enterRole(session) {
  if (!session.handoff) return false;
  session.role = session.handoff;
  session.handoff = null;
  return true;
}
export function countOralQuestion(session) {
  if (
    session.independent ||
    session.stage !== 1 ||
    session.role !== "doctor" ||
    session.handoff ||
    session.solved
  )
    return false;
  session.questionCount++;
  session.totalQuestions++;
  return true;
}
export function ask(session, questionId) {
  if (
    session.stage !== 2 ||
    session.role !== "doctor" ||
    session.handoff ||
    session.solved ||
    (!session.independent && session.pending && !session.submitted)
  )
    return false;
  const question = questions.find((item) => item.id === questionId);
  if (!question) return false;
  session.questionCount++;
  session.totalQuestions++;
  session.pending = questionId;
  session.selectedAnswer = null;
  session.submitted = false;
  if (!session.independent) requestHandoff(session, "patient");
  return true;
}
export function selectAnswer(session, id) {
  if (
    session.stage !== 2 ||
    session.role !== "patient" ||
    session.handoff ||
    !session.pending ||
    session.submitted
  )
    return false;
  if (!optionsFor(session).some((option) => option.id === id)) return false;
  session.selectedAnswer = id;
  return true;
}
export function optionsFor(session) {
  const question = questions.find((item) => item.id === session.pending);
  return question && questionApplies(question, cases[session.caseIndex].id)
    ? answerOptions(cases[session.caseIndex], question)
    : [];
}
export function submitAnswer(session) {
  if (
    session.role !== "patient" ||
    session.handoff ||
    session.stage !== 2 ||
    session.submitted ||
    !session.selectedAnswer
  )
    return false;
  const option = optionsFor(session).find(
    (item) => item.id === session.selectedAnswer,
  );
  if (!option) return false;
  session.submitted = true;
  session.history.push({
    question: questions.find((item) => item.id === session.pending).title,
    answer: option.text,
  });
  return true;
}
export function guess(session, diseaseId) {
  if (
    session.independent ||
    session.stage === 3 ||
    session.role !== "doctor" ||
    session.handoff ||
    session.solved ||
    !cases.some((item) => item.id === diseaseId)
  )
    return null;
  session.attempts++;
  const correct = cases[session.caseIndex].id === diseaseId;
  if (correct) {
    session.solved = true;
    session.completed.push(cases[session.caseIndex].id);
  }
  return correct;
}
export function retry(session) {
  if (
    session.role !== "doctor" ||
    session.solved ||
    session.stage === 3 ||
    session.handoff
  )
    return false;
  // Retry only clears the record sheet. All question counts and conversation history persist.
  session.records = {};
  return true;
}
export function nextCase(session) {
  if (
    session.role !== "doctor" ||
    session.handoff ||
    (session.stage !== 3 && !session.solved)
  )
    return false;
  if (session.caseIndex === cases.length - 1) {
    session.finished = true;
    session.role = null;
    return true;
  }
  const fresh = createSession(session.stage);
  Object.assign(session, fresh, {
    caseIndex: session.caseIndex + 1,
    totalQuestions: session.totalQuestions,
    completed: session.completed,
  });
  return true;
}
export function nextStage(session) {
  if (!session.finished || session.stage >= 3) return false;
  Object.assign(session, createSession(session.stage + 1));
  return true;
}

// Multi-tablet sessions never carry a doctor-side assigned case or grade guesses.
export function createIndependentSession(role, stage, round, caseIndex = null) {
  if (!["doctor", "patient"].includes(role) || ![1, 2, 3, 4, 5].includes(round))
    throw new Error("角色或回合無效");
  if (
    role === "patient" &&
    (!Number.isInteger(caseIndex) || caseIndex < 0 || caseIndex >= (stage === 1 ? stageOneCases.length : cases.length))
  )
    throw new Error("請先載入有效病例碼");
  return {
    ...createSession(stage),
    role,
    handoff: null,
    independent: true,
    round,
    caseIndex: role === "patient" ? caseIndex : null,
    manualGuesses: [],
    followups: [],
  };
}
export function manualGuess(session, diseaseId) {
  if (
    !session.independent ||
    session.role !== "doctor" ||
    session.stage !== 2 ||
    !cases.some((entry) => entry.id === diseaseId)
  )
    return false;
  session.questionCount++;
  session.totalQuestions++;
  session.attempts++;
  session.manualGuesses.push(diseaseId);
  return true;
}
