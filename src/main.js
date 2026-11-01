import "./style.css";
import "./teacher.css";
import { cases, patientView } from "./data/cases.js";
import { questions } from "./data/questions.js";
import {
  createIndependentSession,
  matches,
  mark,
  ask,
  optionsFor,
  selectAnswer,
  submitAnswer,
  manualGuess,
  retry,
} from "./game/engine.js";
import { createPatientRounds } from "./game/random-round.js";
import { readCode } from "./game/codes.js";
import { doctor, patient, candidateCards } from "./ui/screens.js";
import {
  portal,
  setup,
  login,
  studentStatus,
  patientQuestions,
  patientLoading,
} from "./ui/portal.js";
import { button as b, escapeHtml as e, notice } from "./ui/components.js";
import { observeBodyMap } from "./ui/body-lines.js";
import { TeacherApp } from "./teacher/controller.js";
const app = document.querySelector("#app");
app.innerHTML = `<a class="skip-link" href="#main">跳至主要內容</a><header class="app-header"><div class="header-inner"><a class="brand" href="./" aria-label="醫問到底，回到角色入口"><span aria-hidden="true">＋</span>醫問到底<span class="brand-punctuation">！</span></a><span class="header-subtitle">病情解碼挑戰</span><span class="version-label">教學模擬 · 1.3</span><button class="button quiet" type="button" data-action="home">角色入口</button></div></header><div id="status-host"></div><main id="main" class="main-shell"></main><footer class="app-footer"><span>醫問到底！——病情解碼挑戰</span><span>教學模擬・不是醫療診斷工具</span></footer><div id="tools-host"></div><div id="announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div><dialog id="action-dialog" aria-labelledby="dialog-title"></dialog>`;
const main = document.querySelector("#main"),
  statusHost = document.querySelector("#status-host"),
  toolsHost = document.querySelector("#tools-host"),
  dialog = document.querySelector("#action-dialog"),
  announcer = document.querySelector("#announcer");
let view = "portal",
  role = null,
  session = null,
  observer = null,
  teacher = null,
  origin = null,
  confirmAction = null;
function announce(text) {
  announcer.textContent = text;
}
function clear() {
  observer?.disconnect();
  main.replaceChildren();
  statusHost.replaceChildren();
  toolsHost.replaceChildren();
  announcer.textContent = "";
}
function focusHeading() {
  const heading = main.querySelector("#screen-title,h1");
  heading?.setAttribute("tabindex", "-1");
  heading?.focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: "instant" });
}
function close() {
  if (dialog.open) dialog.close();
  dialog.replaceChildren();
  confirmAction = null;
  if (origin?.isConnected) origin.focus({ preventScroll: true });
}
function modal(markup, callback) {
  origin = document.activeElement;
  confirmAction = callback;
  dialog.innerHTML = markup;
  dialog.showModal();
}
function confirm(title, text, callback) {
  modal(
    `<h2 id="dialog-title">${e(title)}</h2><p>${e(text)}</p><div class="dialog-actions">${b("取消", "cancel")}${b("確認", "confirm", { kind: "primary" })}</div>`,
    callback,
  );
}
function leaveTeacher(destination) {
  teacher?.dispose();
  teacher = null;
  session = null;
  role = null;
  view = destination === "lock" ? "login" : "portal";
  clear();
  render();
}
function goHome() {
  if (teacher) return leaveTeacher("home");
  if (session)
    return confirm(
      "回到角色入口？",
      "這台學生平板的輔助紀錄會清除；教師裝置上的正式成績不受影響。",
      () => {
        pauseRandomCase();
        session = null;
        role = null;
        view = "portal";
        render();
      },
    );
  session = null;
  role = null;
  view = "portal";
  render();
}
function render({ focus = true } = {}) {
  try {
    history.replaceState(
      { view, role: session?.role || role, stage: session?.stage || null },
      "",
    );
  } catch {
    /* Case retention still works when browser history is unavailable. */
  }
  clear();
  if (view === "portal") main.innerHTML = portal();
  else if (view === "login") main.innerHTML = login();
  else if (view === "setup") main.innerHTML = setup(role, session);
  else if (view === "student" && session) {
    const matching = matches(session.records);
    statusHost.innerHTML = studentStatus(session, matching.length);
    const independentNotice = notice(
      session.role === "doctor"
        ? session.stage === 1
          ? "四位醫師輪流口頭提問，病人只回答是或否。猜疾病也直接口頭提出；所有問題數與完成數由教師手動登記。症狀紀錄僅在此平板操作，不會同步。"
          : "此平板只保存本回合的輔助紀錄，不會與其他醫師同步。正式提問數與完成數由教師手動登記，疾病猜測也算一次提問。"
        : "這是你的獨立平板，不會傳送或接收其他平板的內容。請依教師安排與同組醫師口頭互動。",
    );
    if (session.role === "doctor") {
      main.innerHTML =
        independentNotice +
        doctor(
          session,
          cases.map(({ id, disease }) => ({ id, disease })),
          matching,
        );
      if (session.stage === 2)
        toolsHost.innerHTML = `<nav class="mobile-tools" aria-label="醫師常用操作">${b("查看問診題庫", "jump-questions")}${b("提出猜測", "open-guess", { kind: "primary" })}</nav>`;
      if (matchMedia("(max-width:700px)").matches)
        main.querySelector(".candidate-details")?.removeAttribute("open");
    } else {
      main.innerHTML =
        independentNotice +
        (session.stage === 2 ? patientQuestions(session) : "") +
        patient(
          session,
          patientView(cases[session.caseIndex]),
          session.stage === 2 ? optionsFor(session) : [],
        );
      observer = observeBodyMap(main);
    }
  }
  if (focus) focusHeading();
}
function pauseRandomCase() {
  try {
    createPatientRounds(sessionStorage).pause();
  } catch {
    /* Never block other roles or change a retained case on failure. */
  }
}
function loadStudent(data) {
  const stage = Number(data.get("stage")),
    round = Number(data.get("round"));
  let next;
  try {
    if (role === "patient" && stage !== 1) {
      const decoded = readCode(data.get("code"));
      if (decoded.stage !== stage || decoded.round !== round)
        throw new Error("病例碼與所選階段／回合不一致，請向教師確認。");
      next = createIndependentSession(role, stage, round, decoded.caseIndex);
    } else if (role === "doctor")
      next = createIndependentSession(role, stage, round);
  } catch (error) {
    document.querySelector("#student-error").textContent = error.message;
    return;
  }
  const apply = () => {
    try {
      if (role === "patient" && stage === 1) {
        // Draw only here, after the explicit start/confirmation; never during render.
        const loaded = createPatientRounds(sessionStorage).start(round);
        next = createIndependentSession("patient", 1, round, loaded.caseIndex);
      } else pauseRandomCase();
      session = next;
      view = "student";
      render();
    } catch (error) {
      document.querySelector("#student-error").textContent =
        error.message || "無法讀取此分頁的回合，沒有重新抽取病例。";
    }
  };
  if (session)
    confirm(
      "確認開始這個階段／回合？",
      stage === 1
        ? "第一階段已開始的回合會沿用原病例；尚未載入的新回合才隨機抽取。這台平板的練習紀錄會重設，教師紀錄不受影響。"
        : "這會清空此平板的症狀、回答與輔助提問數，不會更動教師正式紀錄。",
      apply,
    );
  else apply();
}
function showGuess() {
  modal(
    `<h2 id="dialog-title">提出這次疾病猜測</h2><p>請口頭告訴教師。確認猜測將增加一次本機輔助提問數，正確與否由教師判定。</p><form id="guess-form"><fieldset class="guess-options"><legend class="sr-only">選擇疾病</legend>${cases.map((entry) => `<label><input type="radio" name="disease" value="${entry.id}" required><span>${e(entry.disease)}</span></label>`).join("")}</fieldset><div class="dialog-actions">${b("繼續推理", "cancel")}<button type="submit" class="button primary" disabled id="confirm-guess">確認提出猜測</button></div></form>`,
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
  const progress = main.querySelector("[data-record-progress]");
  if (progress)
    progress.textContent = `${Object.keys(session.records).length} / 18 已確認`;
  announce(`紀錄已更新，${matching.length} 個模擬案例符合目前線索。`);
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === "home") {
    if (view === "teacher") return leaveTeacher("home");
    return goHome();
  }
  if (view === "teacher") return;
  if (action === "cancel") return close();
  if (action === "confirm") {
    const apply = confirmAction;
    close();
    apply?.();
    return;
  }
  if (action === "choose-role") {
    session = null;
    role = null;
    clear();
    if (target.dataset.role === "teacher") view = "login";
    else {
      role = target.dataset.role;
      view = "setup";
    }
    render();
    return;
  }
  if (action === "clear-pin") {
    const input = document.querySelector("#teacher-pin");
    input.value = "";
    input.focus();
    document.querySelector("#login-error").textContent = "";
    return;
  }
  if (action === "change-round" && session) {
    role = session.role;
    view = "setup";
    render();
    return;
  }
  if (view !== "student" || !session) return;
  if (action === "mark") {
    if (mark(session, target.dataset.id, JSON.parse(target.dataset.value)))
      updateRecords(target.dataset.id);
    return;
  }
  if (action === "ask") {
    if (ask(session, target.dataset.id)) {
      render({ focus: false });
      const panel = main.querySelector(".selected-question");
      panel?.setAttribute("tabindex", "-1");
      panel?.focus();
    }
    return;
  }
  if (
    action === "open-guess" &&
    session.role === "doctor" &&
    session.stage === 2
  )
    return showGuess();
  if (action === "open-clear" && session.role === "doctor")
    return confirm(
      "清空症狀紀錄？",
      session.stage === 1
        ? "症狀卡片將恢復未確認，教師紀錄不受影響。"
        : "此平板的症狀將恢復未確認，累積輔助提問數保留。教師紀錄不受影響。",
      () => {
        retry(session);
        render();
        announce(
          session.stage === 1
            ? "症狀紀錄已清空。"
            : "紀錄已清空，輔助提問數保留。",
        );
      },
    );
  if (action === "answer") {
    if (selectAnswer(session, target.dataset.id)) {
      const y = scrollY;
      render({ focus: false });
      main
        .querySelector(`[data-action="answer"][data-id="${target.dataset.id}"]`)
        .focus({ preventScroll: true });
      scrollTo({ top: y, behavior: "instant" });
      announce("已選擇，尚未確認。");
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
      .forEach((el) => el.classList.toggle("highlighted", el === note));
    note.focus({ preventScroll: true });
    note.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
        ? "instant"
        : "smooth",
    });
    return;
  }
  if (action === "jump-questions") {
    const panel = main.querySelector(".question-panel");
    panel.setAttribute("tabindex", "-1");
    panel.focus();
    return;
  }
  if (
    action === "followup" &&
    session.role === "doctor" &&
    session.stage === 3
  ) {
    session.lastFollowup = `準備詢問：${target.dataset.text}`;
    session.followups.push(target.dataset.text);
    main.querySelector(".followup-status").textContent = session.lastFollowup;
  }
});
app.addEventListener("submit", (event) => {
  if (view === "teacher") return;
  event.preventDefault();
  const form = event.target;
  if (form.id === "login-form") {
    if (new FormData(form).get("pin") !== "0709") {
      document.querySelector("#login-error").textContent =
        "密碼不正確，請清除後重新輸入。";
      return;
    }
    form.reset();
    clear();
    view = "teacher";
    teacher = new TeacherApp(main, dialog, { leave: leaveTeacher, announce });
    focusHeading();
    return;
  }
  if (form.id === "student-form") return loadStudent(new FormData(form));
  if (
    form.id === "guess-form" &&
    session?.role === "doctor" &&
    session.stage === 2
  ) {
    const diseaseId = new FormData(form).get("disease");
    if (manualGuess(session, diseaseId)) {
      close();
      render({ focus: false });
      modal(
        `<h2 id="dialog-title">猜測已記入本機輔助次數</h2><p>你提出「${e(cases.find((entry) => entry.id === diseaseId).disease)}」。請教師判定並登記正式提問數；猜錯可以繼續問，或清空紀錄重新整理，不會歸零提問數。</p><p>這台醫師平板沒有指定病例答案，不會自行判定猜對或猜錯。</p>${b("繼續問診", "cancel", { kind: "primary" })}`,
      );
    }
  }
});
app.addEventListener("change", (event) => {
  if (view === "teacher") return;
  if (event.target.name === "stage" && view === "setup" && role === "patient") {
    main.querySelector("#patient-loading").innerHTML = patientLoading(
      Number(event.target.value),
    );
    main.querySelector("#student-error").textContent = "";
    main.querySelector("#student-start").textContent =
      Number(event.target.value) === 1 ? "開始回合" : "載入病例";
    return;
  }
  if (event.target.name === "disease") {
    document.querySelector("#confirm-guess").disabled = false;
    return;
  }
  if (event.target.id === "patient-question" && session?.role === "patient") {
    const questionId = event.target.value;
    if (questionId && !questions.some((q) => q.id === questionId)) return;
    const apply = () => {
      session.pending = questionId || null;
      session.selectedAnswer = null;
      session.submitted = false;
      render({ focus: false });
      main.querySelector("#patient-question").focus({ preventScroll: true });
    };
    if (session.selectedAnswer) {
      event.target.value = session.pending || "";
      confirm(
        "更換回答的問題？",
        "這台平板目前的選擇與解析將清除。先前已口頭分享的回答不會自動通知醫師。",
        apply,
      );
    } else apply();
    return;
  }
  if (
    event.target.dataset.practice &&
    session?.role === "patient" &&
    session.stage === 3
  ) {
    const key = event.target.dataset.practice;
    session.practice = event.target.checked
      ? [...new Set([...session.practice, key])]
      : session.practice.filter((value) => value !== key);
  }
});
app.addEventListener("input", (event) => {
  if (
    event.target.id === "followup-notes" &&
    session?.role === "doctor" &&
    session.stage === 3
  )
    session.followupNotes = event.target.value;
});
dialog.addEventListener("cancel", (event) => {
  if (view === "teacher") return;
  event.preventDefault();
  close();
});
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  goHome();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    close();
    teacher?.dispose();
    teacher = null;
    session = null;
    role = null;
    view = "portal";
    render();
  }
});
window.addEventListener("storage", (event) => {
  if (view === "teacher" && event.key === "medical-challenge-teacher-v1") {
    const status = main.querySelector(".storage-status");
    if (status) {
      status.textContent =
        "另一個分頁已更新紀錄。請重新整理後再登記，避免覆寫。";
      status.setAttribute("role", "alert");
    }
  }
});
try {
  if (
    history.state?.view === "student" &&
    history.state?.role === "patient" &&
    history.state?.stage === 1
  ) {
    const saved = createPatientRounds(sessionStorage).resume();
    if (saved) {
      session = createIndependentSession(
        "patient",
        1,
        saved.round,
        saved.caseIndex,
      );
      role = "patient";
      view = "student";
    }
  }
} catch {
  /* Keep the neutral portal; start() reports damaged/unavailable storage without redrawing. */
}
render({ focus: false });
