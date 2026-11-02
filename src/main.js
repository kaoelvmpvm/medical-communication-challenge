import "./style.css";
import "./teacher.css";
import "./art.css";
import { playUiSound } from "./ui/sound.js";
import { isMusicEnabled, setMusicEnabled, activateMusicOnGesture, getMusicVolume, setMusicVolume } from "./ui/music.js";
import { displayVersion } from "./data/version.js";
import { cases, patientView } from "./data/cases.js";
import { stageOneCases, stageOneSymptoms } from "./data/stage-one.js";
import { symptoms } from "./data/symptoms.js";
import { questions, questionsForCase } from "./data/questions.js";
import {
  createIndependentSession,
  matches,
  comparison,
  mark,
  ask,
  optionsFor,
  selectAnswer,
} from "./game/engine.js";
import { createPatientRounds } from "./game/random-round.js";
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
import { caseArtUrl, portalArt } from "./data/art-assets.js";
import { artPlaceholder } from "./ui/case-art.js";
import { observeBodyMap } from "./ui/body-lines.js";
import { TeacherApp } from "./teacher/controller.js";
const app = document.querySelector("#app");
app.innerHTML = `<a class="skip-link" href="#main">跳至主要內容</a><header class="app-header"><div class="header-inner"><a class="brand" href="./" aria-label="醫問到底，回到角色入口"><img class="header-logo" data-art-kind="header-logo" src="${e(portalArt.title || "")}" width="2172" height="724" alt="醫問到底！"><span class="brand-fallback" hidden>醫問到底！</span></a><div class="header-actions"><div class="music-controls" role="group" aria-label="背景音樂設定"><button class="music-toggle" type="button" data-action="toggle-music" aria-pressed="${isMusicEnabled()}" aria-label="${isMusicEnabled() ? "關閉背景音樂" : "開啟背景音樂"}">♫ 音樂${isMusicEnabled() ? "開" : "關"}</button><label class="music-volume" for="music-volume-slider"><span class="music-volume-label">音量</span><input type="range" id="music-volume-slider" min="0" max="100" step="1" value="${getMusicVolume()}" aria-label="背景音樂音量" aria-controls="music-volume-value"><output id="music-volume-value" for="music-volume-slider">${getMusicVolume()}%</output></label></div></div></div></header><div id="status-host"></div><main id="main" class="main-shell"></main><footer class="app-footer"><span>版本 ${displayVersion}</span><span>板橋國中 高勳頊老師設計開發</span></footer><div id="tools-host"></div><div id="announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div><dialog id="action-dialog" aria-labelledby="dialog-title"></dialog>`;
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
let preferredStage = 1;
let lastRenderedScreenKey = "";
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
      "目前的練習紀錄會清除；教師成績不受影響。",
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
  const screenKey = `${view}:${session?.role || role || ""}:${session?.stage || 0}:${session?.round || 0}`;
  const hasChangedScreen = screenKey !== lastRenderedScreenKey;
  try {
    history.replaceState(
      { view, role: session?.role || role, stage: session?.stage || null },
      "",
    );
  } catch {
    /* Case retention still works when browser history is unavailable. */
  }
  clear();
  if (view === "portal") main.innerHTML = portal(portalArt);
  else if (view === "login") main.innerHTML = login();
  else if (view === "setup") main.innerHTML = setup(role, session || { stage: preferredStage });
  else if (view === "student" && session) {
    const pool = session.stage === 1 ? stageOneCases : cases;
    const matching = matches(session.records, pool);
    statusHost.innerHTML = studentStatus(session, matching.length);
    if (session.role === "doctor") {
      main.innerHTML =
        doctor(
          session,
          pool.map((entry) => ({
            id: entry.id,
            disease: entry.disease,
            comparison: comparison(entry.evidence, session.records),
          })),
          matching,
        );
      if (matchMedia("(max-width:700px)").matches)
        main.querySelector(".candidate-details")?.removeAttribute("open");
    } else {
      main.innerHTML =
        (session.stage === 2
          ? patientQuestions(session, cases[session.caseIndex].id)
          : "") +
        patient(
          session,
          {
            ...patientView(pool[session.caseIndex]),
            artUrl: caseArtUrl(pool[session.caseIndex].id),
          },
          session.stage === 2 ? optionsFor(session) : [],
        ) + `<div class="patient-next-action">${b("下一位病患", "next-patient", { kind: "primary" })}</div>`;
      observer = observeBodyMap(main);
    }
  }
  if (hasChangedScreen) {
    main.classList.remove("screen-enter");
    void main.offsetWidth;
    main.classList.add("screen-enter");
  }
  lastRenderedScreenKey = screenKey;
  if (focus) focusHeading();
}
function pauseRandomCase() {
  for (const stage of [1, 2, 3]) {
    try {
      createPatientRounds(sessionStorage, null, stage).pause();
    } catch {
      // Do not alter the current screen if a saved stage is damaged.
    }
  }
}
function loadStudent(data) {
  const stage = Number(data.get("stage"));
  if (![1, 2, 3].includes(stage)) {
    document.querySelector("#student-error").textContent = "請選擇練習階段。";
    return;
  }
  const apply = () => {
    try {
      // All three stages draw a patient locally; no teacher-supplied load code.
      // Draw and persist BEFORE replacing an existing patient session.
      const next = role === "patient"
        ? (() => {
            const loaded = createPatientRounds(sessionStorage, null, stage).next();
            return createIndependentSession("patient", stage, loaded.round, loaded.caseIndex);
          })()
        : createIndependentSession("doctor", stage, 1);
      if (role === "doctor") pauseRandomCase();
      preferredStage = stage;
      session = next;
      view = "student";
      render();
    } catch (error) {
      document.querySelector("#student-error").textContent =
        error.message || "無法抽取或保存新病患，請保留原病例並請教師協助。";
    }
  };
  if (session)
    confirm(
      "確認切換練習階段？",
      "這會重設此平板的練習狀態，教師正式成績不受影響。",
      apply,
    );
  else apply();
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
  const pool = session.stage === 1 ? stageOneCases : cases;
  const activeSymptoms = session.stage === 1 ? stageOneSymptoms : symptoms;
  const matching = matches(session.records, pool);
  main.querySelector("[data-candidates]").innerHTML = candidateCards(
    pool.map((entry) => ({
      id: entry.id,
      disease: entry.disease,
      comparison: comparison(entry.evidence, session.records),
    })),
    matching,
  );
  main.querySelector("[data-match-summary]").textContent =
    `${matching.length} / ${pool.length} 個未衝突`;
  statusHost.querySelector("[data-match-count]").textContent = matching.length;
  const progress = main.querySelector("[data-record-progress]");
  if (progress)
    progress.textContent = `${Object.keys(session.records).length} / ${activeSymptoms.length} 已確認`;
  announce(`紀錄已更新，${matching.length} 個模擬案例符合目前線索。`);
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === "toggle-music") {
    const enabled = setMusicEnabled(!isMusicEnabled());
    target.setAttribute("aria-pressed", String(enabled));
    target.setAttribute("aria-label", enabled ? "關閉背景音樂" : "開啟背景音樂");
    target.textContent = enabled ? "♫ 音樂開" : "♫ 音樂關";
    if (enabled) activateMusicOnGesture();
    announce(enabled ? "背景音樂已開啟" : "背景音樂已關閉");
    return;
  }
  if (action === "choose-stage" && view === "setup") {
    const stage = Number(target.dataset.stage);
    if (![1, 2, 3].includes(stage)) return;
    const input = main.querySelector('[name="stage"]');
    input.value = String(stage);
    main.querySelectorAll(".stage-pick").forEach((button) =>
      button.setAttribute("aria-pressed", String(Number(button.dataset.stage) === stage)),
    );
    if (role === "patient") {
      main.querySelector("#patient-loading").innerHTML = patientLoading(stage);
      main.querySelector("#student-start").textContent = "開始回合";
    }
    main.querySelector("#student-error").textContent = "";
    return;
  }
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
    preferredStage = 1;
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
  if (action === "change-stage" && session) {
    preferredStage = session.stage;
    role = session.role;
    view = "setup";
    render();
    return;
  }
  if (view !== "student" || !session) return;
  if (action === "reset-doctor" && session.role === "doctor") {
    session = createIndependentSession("doctor", session.stage, 1);
    render();
    announce("醫師端已回到初始狀態，教師成績不受影響。");
    return;
  }
  if (action === "next-patient" && session.role === "patient") {
    try {
      const stage = session.stage;
      const loaded = createPatientRounds(sessionStorage, null, stage).next();
      session = createIndependentSession("patient", stage, loaded.round, loaded.caseIndex);
      render();
      announce("已隨機載入下一位病患。");
    } catch (error) {
      modal(`<h2 id="dialog-title">無法切換病患</h2><p>${e(error.message || "病例抽取失敗，原病例仍保留。")}</p><div class="dialog-actions">${b("返回", "cancel", { kind: "primary" })}</div>`);
    }
    return;
  }
  if (action === "mark") {
    if (mark(session, target.dataset.id, JSON.parse(target.dataset.value)))
      updateRecords(target.dataset.id);
    return;
  }
  if (action === "ask") {
    if (ask(session, target.dataset.id)) {
      render({ focus: false });
      const selected = main.querySelector(`#question-${target.dataset.id}`);
      selected?.focus({ preventScroll: true });
    }
    return;
  }
  if (action === "answer") {
    if (selectAnswer(session, target.dataset.id)) {
      const y = scrollY;
      render({ focus: false });
      main
        .querySelector(`[data-action="answer"][data-id="${target.dataset.id}"]`)
        .focus({ preventScroll: true });
      scrollTo({ top: y, behavior: "instant" });
      announce("已選擇，可以隨時改選或切換問題。");
    }
    return;
  }
  if (action === "focus-note") {
    const note = document.getElementById(target.dataset.note);
    const ids = (target.dataset.notes || target.dataset.note).split(" ");
    main
      .querySelectorAll(".body-note")
      .forEach((el) => el.classList.toggle("highlighted", ids.includes(el.id)));
    note.focus({ preventScroll: true });
    note.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
        ? "instant"
        : "smooth",
    });
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
    main.classList.remove("screen-enter");
    void main.offsetWidth;
    main.classList.add("screen-enter");
    lastRenderedScreenKey = "teacher";
    focusHeading();
    return;
  }
  if (form.id === "student-form") return loadStudent(new FormData(form));

});
app.addEventListener("change", (event) => {
  if (view === "teacher") return;
  if (event.target.id === "patient-question" && session?.role === "patient") {
    const questionId = event.target.value;
    if (
      questionId &&
      !questionsForCase(cases[session.caseIndex].id).some(
        (q) => q.id === questionId,
      )
    )
      return;
    const apply = () => {
      session.pending = questionId || null;
      session.selectedAnswer = null;
      session.submitted = false;
      render({ focus: false });
      main.querySelector("#patient-question").focus({ preventScroll: true });
    };
    apply();
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
  if (event.target.id === "music-volume-slider") {
    const percentage = setMusicVolume(event.target.value);
    const output = document.querySelector("#music-volume-value");
    if (output) output.value = `${percentage}%`;
    activateMusicOnGesture();
    return;
  }
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
// Sound is always enabled and plays after user interaction.
app.addEventListener("click", (event) => {
  const control = event.target.closest("button");
  if (!control || control.disabled) return;
  activateMusicOnGesture();
  const action = control.dataset.action || "";
  const type = action === "mark" ? "mark" : ["choose-role", "home", "change-stage", "next-patient"].includes(action) ? "navigate" : "tap";
  playUiSound(type);
}, true);

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
  const savedStage = Number(history.state?.stage);
  if (
    history.state?.view === "student" &&
    history.state?.role === "patient" &&
    [1, 2, 3].includes(savedStage)
  ) {
    const saved = createPatientRounds(sessionStorage, null, savedStage).resume();
    if (saved) {
      session = createIndependentSession("patient", savedStage, saved.round, saved.caseIndex);
      role = "patient";
      view = "student";
    }
  }
} catch {
  // A damaged saved round is never overwritten automatically.
}

app.addEventListener(
  "error",
  (event) => {
    if (event.target.matches?.(".case-art img"))
      event.target.closest(".case-art-frame").innerHTML = artPlaceholder;
    else if (event.target.dataset?.artKind) {
      const image = event.target;
      image.hidden = true;
      if (image.dataset.artKind === "header-logo")
        image.parentElement.querySelector(".brand-fallback")?.removeAttribute("hidden");
      else if (image.dataset.artKind === "logo")
        image
          .closest("h1")
          .querySelector(".logo-text")
          .classList.remove("sr-only");
      else
        image.parentElement
          .querySelector(".home-art-fallback,.role-art-fallback")
          ?.removeAttribute("hidden");
    }
  },
  true,
);

render({ focus: false });
