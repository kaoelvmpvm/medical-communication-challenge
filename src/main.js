import "./style.css";
import { cases, patientView } from "./data/cases.js";
import {
  createSession,
  matches,
  mark,
  requestHandoff,
  enterRole,
  countOralQuestion,
  ask,
  selectAnswer,
  optionsFor,
  submitAnswer,
  guess,
  retry,
  nextCase,
  nextStage,
} from "./game/engine.js";
import { button as b, escapeHtml as e } from "./ui/components.js";
import {
  lobby,
  handoff,
  statusBar,
  doctor,
  patient,
  summary,
  candidateCards,
} from "./ui/screens.js";

const app = document.querySelector("#app");
app.innerHTML = `<a class="skip-link" href="#main">跳至主要內容</a><header class="app-header"><div class="header-inner"><a class="brand" href="./" aria-label="醫問到底，回到練習選單"><span aria-hidden="true">＋</span>醫問到底<span class="brand-punctuation">！</span></a><span class="header-subtitle">病情解碼挑戰</span><span class="version-label">教學模擬 · 1.1</span><button type="button" class="button quiet header-home" data-action="home">練習選單</button></div></header><div id="status-host"></div><main id="main" class="main-shell"></main><footer class="app-footer"><span>醫問到底！——病情解碼挑戰</span><span>僅供教育練習，不提供醫療診斷或治療建議。</span></footer><div id="tools-host"></div><div id="announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div><dialog id="action-dialog" aria-labelledby="dialog-title"></dialog>`;
const main = document.querySelector("#main");
const statusHost = document.querySelector("#status-host");
const toolsHost = document.querySelector("#tools-host");
const dialog = document.querySelector("#action-dialog");
const announcer = document.querySelector("#announcer");
let session = null;
let observer;
let dialogOrigin;
let dialogKind = null;

function announce(message) {
  announcer.textContent = message;
}
function closeDialog() {
  dialog.close();
  dialog.replaceChildren();
  dialogKind = null;
  if (dialogOrigin?.isConnected) dialogOrigin.focus({ preventScroll: true });
}
function render({ focus = true } = {}) {
  observer?.disconnect();
  // Never retain the previous role DOM underneath a handoff screen.
  main.replaceChildren();
  statusHost.replaceChildren();
  toolsHost.replaceChildren();
  announcer.textContent = "";
  if (!session) main.innerHTML = lobby();
  else if (session.finished) main.innerHTML = summary(session);
  else if (session.handoff)
    main.innerHTML = handoff(
      session.handoff,
      session.stage,
      session.caseIndex + 1,
    );
  else {
    const matching = matches(session.records);
    statusHost.innerHTML = statusBar(session, matching.length);
    if (session.role === "doctor") {
      // No evidence maps or patient notes are supplied to the doctor renderer.
      const diseases = cases.map(({ id, disease }) => ({ id, disease }));
      main.innerHTML = doctor(session, diseases, matching);
      if (session.stage !== 3 && !session.solved)
        toolsHost.innerHTML = `<nav class="mobile-tools" aria-label="醫師常用操作">${session.stage === 1 ? b("＋ 提問一次", "count") : b("查看問診題庫", "jump-questions")}${b("提出猜測", "open-guess", { kind: "primary" })}</nav>`;
      const details = main.querySelector(".candidate-details");
      if (details && matchMedia("(max-width: 700px)").matches)
        details.open = false;
    } else {
      main.innerHTML = patient(
        session,
        patientView(cases[session.caseIndex]),
        session.stage === 2 ? optionsFor(session) : [],
      );
      observeBodyMap();
    }
  }
  document.querySelector(".header-home").hidden = !session || !!session.handoff;
  if (focus) {
    const heading = main.querySelector("#screen-title, #handoff-title, h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
function transfer(target) {
  if (dialog.open) closeDialog();
  requestHandoff(session, target);
  render();
}
function openDialog(kind, markup) {
  dialogKind = kind;
  dialogOrigin = document.activeElement;
  dialog.innerHTML = markup;
  dialog.showModal();
}
function showGuess() {
  openDialog(
    "guess",
    `<div class="dialog-heading"><span class="eyebrow">這是模擬病例推理</span><h2 id="dialog-title">你想提出哪個疾病？</h2><p>選好後，再按下確認。這不是醫療診斷。</p></div><form id="guess-form"><fieldset class="guess-options"><legend class="sr-only">選擇猜測疾病</legend>${cases.map((entry) => `<label><input type="radio" name="disease" value="${entry.id}" required><span>${e(entry.disease)}</span></label>`).join("")}</fieldset><div class="dialog-actions"><button type="button" class="button secondary" data-action="cancel-dialog" autofocus>先繼續問</button><button type="submit" class="button primary" id="confirm-guess" disabled>確認這次猜測</button></div></form>`,
  );
}
function updateRecords(id) {
  const value = session.records[id];
  const card = main.querySelector(`[data-symptom-card="${id}"]`);
  card.dataset.state = value === undefined ? "unknown" : value ? "yes" : "no";
  card.querySelector("[data-record-status]").textContent =
    value === undefined ? "— 未確認" : value ? "✓ 有" : "× 沒有";
  card
    .querySelector('[data-value="true"]')
    .setAttribute("aria-pressed", String(value === true));
  card
    .querySelector('[data-value="false"]')
    .setAttribute("aria-pressed", String(value === false));
  const matching = matches(session.records);
  main.querySelector("[data-candidates]").innerHTML = candidateCards(
    cases.map(({ id, disease }) => ({ id, disease })),
    matching,
  );
  main.querySelector("[data-match-summary]").textContent =
    `${matching.length} / 6 個案例符合`;
  statusHost.querySelector("[data-match-count]").textContent = matching.length;
  main.querySelector("[data-record-progress]").textContent =
    `${Object.keys(session.records).length} / 18 已確認`;
  announce(`紀錄已更新，${matching.length} 個模擬案例符合目前線索。`);
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === "cancel-dialog") return closeDialog();
  if (action === "home") {
    if (!session) return;
    return openDialog(
      "home",
      `<h2 id="dialog-title">要結束這次練習嗎？</h2><p>回到選單後，這次的紀錄與提問次數不會保留。</p><div class="dialog-actions">${b("繼續練習", "cancel-dialog")}${b("結束並回選單", "confirm-home", { kind: "primary" })}</div>`,
    );
  }
  if (action === "confirm-home" && dialogKind === "home") {
    closeDialog();
    session = null;
    return render();
  }
  if (action === "start" && !session) {
    session = createSession(Number(target.dataset.stage));
    return render();
  }
  if (!session) return;
  if (action === "enter") {
    if (enterRole(session)) render();
    return;
  }
  if (session.handoff || (session.finished && !["next-stage"].includes(action)))
    return;
  if (action === "switch")
    return transfer(session.role === "doctor" ? "patient" : "doctor");
  if (action === "mark") {
    if (mark(session, target.dataset.id, JSON.parse(target.dataset.value)))
      updateRecords(target.dataset.id);
    return;
  }
  if (action === "count") {
    if (countOralQuestion(session)) {
      statusHost.querySelector("[data-question-count]").textContent =
        session.questionCount;
      announce(`已記錄提問，目前 ${session.questionCount} 次。`);
    }
    return;
  }
  if (action === "ask") {
    if (ask(session, target.dataset.id)) render();
    return;
  }
  if (action === "answer") {
    if (selectAnswer(session, target.dataset.id)) {
      const scrollY = window.scrollY;
      render({ focus: false });
      main
        .querySelector(`[data-action="answer"][data-id="${target.dataset.id}"]`)
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY, behavior: "instant" });
      announce("已選擇回答，尚未送出。");
    }
    return;
  }
  if (action === "submit-answer") {
    if (submitAnswer(session)) {
      render({ focus: false });
      const analysis = main.querySelector(".answer-analysis");
      analysis.setAttribute("tabindex", "-1");
      analysis.focus();
    }
    return;
  }
  if (action === "focus-note") {
    const note = document.getElementById(target.dataset.note);
    main
      .querySelectorAll(".body-note")
      .forEach((item) => item.classList.toggle("highlighted", item === note));
    note?.focus({ preventScroll: true });
    note?.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    return;
  }
  if (session.role === "doctor") {
    if (action === "jump-questions") {
      const panel = main.querySelector(".question-panel");
      panel?.scrollIntoView({ block: "start" });
      panel?.setAttribute("tabindex", "-1");
      panel?.focus({ preventScroll: true });
      return;
    }
    if (action === "open-guess" && session.stage !== 3 && !session.solved)
      return showGuess();
    if (action === "open-clear" && session.stage !== 3)
      return openDialog(
        "clear",
        `<h2 id="dialog-title">清空這位病患的症狀紀錄？</h2><p>18 項症狀將恢復未確認，累積提問數及已確認的對話仍會保留。</p><div class="dialog-actions">${b("保留紀錄", "cancel-dialog")}${b("確認清空", "confirm-clear", { kind: "danger" })}</div>`,
      );
    if (
      (action === "confirm-clear" && dialogKind === "clear") ||
      (action === "retry" && dialogKind === "wrong")
    ) {
      if (retry(session)) {
        closeDialog();
        render();
        announce("症狀已恢復未確認，提問數已保留。");
      }
      return;
    }
    if (action === "next" && nextCase(session)) return render();
    if (action === "practice-next" && session.stage === 3)
      return openDialog(
        "practice-next",
        `<h2 id="dialog-title">完成這位病患的溝通練習？</h2><p>確認雙方已完成描述、回述與補充，再進入下一個情境。</p><div class="dialog-actions">${b("再練習一下", "cancel-dialog")}${b("確認完成", "confirm-practice-next", { kind: "primary" })}</div>`,
      );
    if (
      action === "confirm-practice-next" &&
      dialogKind === "practice-next" &&
      session.stage === 3
    ) {
      closeDialog();
      if (nextCase(session)) render();
      return;
    }
  }
  if (action === "next-stage" && nextStage(session)) render();
});
app.addEventListener("change", (event) => {
  if (event.target.matches('input[name="disease"]'))
    document.querySelector("#confirm-guess").disabled = false;
  if (
    event.target.dataset.practice &&
    session?.role === "patient" &&
    session.stage === 3 &&
    !session.handoff
  ) {
    const value = event.target.dataset.practice;
    session.practice = event.target.checked
      ? [...new Set([...session.practice, value])]
      : session.practice.filter((item) => item !== value);
  }
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "guess-form" || dialogKind !== "guess") return;
  event.preventDefault();
  const result = guess(session, new FormData(event.target).get("disease"));
  closeDialog();
  if (result === true) render();
  else if (result === false)
    openDialog(
      "wrong",
      `<h2 id="dialog-title">這次猜測與模擬病例不同</h2><p>回想哪些資訊還需要釐清。可以保留紀錄繼續問，也可以清空紀錄重新整理；累積提問數都會保留。</p><div class="dialog-actions">${b("保留紀錄，繼續問", "cancel-dialog")}${b("清空紀錄，重新整理", "retry", { kind: "primary" })}</div>`,
    );
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDialog();
});
document.querySelector(".brand").addEventListener("click", (event) => {
  if (session) {
    event.preventDefault();
    document.querySelector('[data-action="home"]').click();
  }
});
// Prevent a stale role screen being restored from the browser back-forward cache.
window.addEventListener("pageshow", (event) => {
  if (event.persisted && session?.role) transfer(session.role);
});

function observeBodyMap() {
  const map = main.querySelector(".body-map");
  if (!map) return;
  const update = () => {
    const svg = map.querySelector(".body-connectors");
    if (!svg || matchMedia("(max-width: 700px)").matches) return;
    const bounds = map.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    const lines = [...map.querySelectorAll(".body-note")].map((note) => {
      const marker = map
        .querySelector(`[data-note="${note.id}"]`)
        .getBoundingClientRect();
      const card = note.getBoundingClientRect();
      const left = note.classList.contains("left");
      const x1 = (left ? card.right : card.left) - bounds.left;
      const y1 = card.top + card.height / 2 - bounds.top;
      const x2 = marker.left + marker.width / 2 - bounds.left;
      const y2 = marker.top + marker.height / 2 - bounds.top;
      const elbow = left ? x1 + 20 : x1 - 20;
      return `<polyline points="${x1},${y1} ${elbow},${y1} ${x2},${y2}"/>`;
    });
    svg.innerHTML = lines.join("");
  };
  observer = new ResizeObserver(update);
  observer.observe(map);
  map.querySelectorAll(".body-note").forEach((note) => observer.observe(note));
  requestAnimationFrame(update);
}
render({ focus: false });
