import "../style.css";
import "../art.css";
import "../teacher.css";
import "./style.css";

import { portalArt, caseArtUrl } from "../data/art-assets.js";
import { cases, patientView } from "../data/cases.js";
import { stageOneCases } from "../data/stage-one.js";
import { questionsForCase } from "../data/questions.js";
import { createIndependentSession, matches, comparison, mark, ask, selectAnswer, optionsFor } from "../game/engine.js";
import { doctor, patient } from "../ui/screens.js";
import { patientQuestions, login } from "../ui/portal.js";
import { escapeHtml as e, button as b } from "../ui/components.js";
import { artPlaceholder } from "../ui/case-art.js";
import { observeBodyMap } from "../ui/body-lines.js";
import { TeacherApp } from "../teacher/controller.js";
import { playUiSound } from "../ui/sound.js";
import { isMusicEnabled, setMusicEnabled, activateMusicOnGesture, getMusicVolume, setMusicVolume } from "../ui/music.js";
import { getAssessmentBank } from "./assessment/data/index.js";
import {
  V2_STORAGE_KEY, freshProgress, restoreProgress, persistProgress,
  chooseCase, recordChoice, submitTest, chooseRole, advance,
} from "./flow.js";
import {
  home, chooseCasePage, assessment, preResult, roleChoice,
  stageHeader, finalResult, restoreErrorPage,
} from "./view.js";

const app = document.getElementById("app");
const storage = (() => {
  try { return window.sessionStorage; } catch { return null; }
})();
let progress = restoreProgress(storage);
let screen = "home";
let teacher = null;
let stageSession = null;
let questionIndex = 0;
let observer = null;
const isStoreUnavailable = !storage;

app.innerHTML = `<a href="#main" class="skip-link">跳至主要內容</a>
<header class="app-header">
  <div class="header-inner">
    <a href="./" class="brand" id="v2-home-link" aria-label="返回醫問到底首頁">
      <img src="${e(portalArt.title || "")}" alt="醫問到底！" class="header-logo" width="2172" height="724">
    </a>
    <div class="header-actions">
      <div class="music-controls" role="group" aria-label="背景音樂設定">
        <button type="button" class="music-toggle" data-v2-action="music" aria-pressed="${isMusicEnabled()}" aria-label="${isMusicEnabled() ? "關閉背景音樂" : "開啟背景音樂"}">♫ 音樂${isMusicEnabled() ? "開" : "關"}</button>
        <label class="music-volume" for="music-volume-slider">音量
          <input type="range" id="music-volume-slider" min="0" max="100" step="1" value="${getMusicVolume()}" aria-label="背景音樂音量">
          <output id="music-volume-value">${getMusicVolume()}%</output>
        </label>
      </div>
    </div>
  </div>
</header>
<main id="main" class="main-shell"></main>
<footer class="app-footer"><span>V2.0 開發版</span><span>板橋國中 高勳頊老師設計開發</span></footer>
<dialog id="action-dialog" aria-labelledby="dialog-title"></dialog>
<div id="announcer" class="sr-only" role="status" aria-live="polite"></div>`;

const main = document.getElementById("main");
const dialog = document.getElementById("action-dialog");
const announcer = document.getElementById("announcer");
let confirmation = null;
function announce(message) { announcer.textContent = message; }
function modal(title, message, callback) {
  confirmation = callback;
  dialog.innerHTML = `<h2 id="dialog-title">${e(title)}</h2><p>${e(message)}</p>
  <div class="dialog-actions">${b("取消", "v2-cancel")}${b("確認", "v2-confirm", {kind:"primary"})}</div>`;
  dialog.showModal();
}
function closeDialog() {
  confirmation = null;
  if (dialog.open) dialog.close();
  dialog.replaceChildren();
}
function focusHeading() {
  const heading = main.querySelector("#screen-title,h1");
  if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({preventScroll:true}); }
}
function save(next) {
  persistProgress(storage, next);
  progress = next;
}
function firstUnansweredIndex() {
  if (!progress || !["pretest", "posttest"].includes(progress.step)) return 0;
  const phase=progress.step==="pretest"?"pre":"post";
  const answers=phase==="pre"?progress.preAnswers:progress.postAnswers;
  return Math.max(0, getAssessmentBank(progress.caseId)[phase].findIndex(q=>!Object.hasOwn(answers,q.id)));
}
function choosePracticeIndex(stage) {
  const pool=stage===1?stageOneCases:cases;
  const idx=pool.findIndex(entry=>entry.id===progress.caseId);
  // These are legacy practice cases; P2/P3 replace them with V2 cases.
  return idx>=0?idx:0;
}
function initializeStage() {
  const stage=progress.step==="stage1"?1:2;
  stageSession=createIndependentSession(progress.role,stage,1,
    progress.role==="patient"?choosePracticeIndex(stage):null);
}
function stageMarkup() {
  if (!stageSession || stageSession.stage !== (progress.step==="stage1"?1:2) ||
      stageSession.role !== progress.role) initializeStage();
  const pool=stageSession.stage===1?stageOneCases:cases;
  const matching=matches(stageSession.records,pool);
  let result;
  if (progress.role==="doctor") {
    result=doctor(stageSession,pool.map(entry=>({
      id:entry.id,disease:entry.disease,
      comparison:comparison(entry.evidence,stageSession.records),
    })),matching);
  } else {
    const entry=pool[stageSession.caseIndex];
    result=(stageSession.stage===2?patientQuestions(stageSession,entry.id):"")+
      patient(stageSession,{
        ...patientView(entry),
        artUrl:caseArtUrl(entry.id),
      },stageSession.stage===2?optionsFor(stageSession):[])+
      `<div class="patient-next-action">${b("下一位病患","next-patient",{kind:"primary"})}</div>`;
  }
  return stageHeader(progress)+result;
}
function render({focus=true}={}) {
  observer?.disconnect();
  if (teacher) return;
  if (!progress) main.innerHTML=restoreErrorPage();
  else if (screen==="home") main.innerHTML=home(portalArt,progress.step!=="choose");
  else if (screen==="teacher-login") main.innerHTML=login();
  else if (progress.step==="choose") main.innerHTML=chooseCasePage(progress,caseArtUrl);
  else if (["pretest","posttest"].includes(progress.step)) main.innerHTML=assessment(progress,questionIndex);
  else if (progress.step==="pre-result") main.innerHTML=preResult(progress);
  else if (progress.step==="stage1-ready") main.innerHTML=roleChoice(progress,portalArt);
  else if (["stage1","stage2"].includes(progress.step)) {
    main.innerHTML=stageMarkup();
    if (progress.role==="patient") observer=observeBodyMap(main);
    if (progress.role==="doctor" && window.matchMedia("(max-width:700px)").matches)
      main.querySelector(".candidate-details")?.removeAttribute("open");
  }
  else if (progress.step==="final") main.innerHTML=finalResult(progress);
  if (isStoreUnavailable && screen!=="teacher-login") main.insertAdjacentHTML(
    "afterbegin",'<p class="v2-storage-warning" role="status">此裝置無法使用暫存功能，重新整理後進度可能遺失。</p>');
  if (focus) focusHeading();
}
function goHome() {
  if (teacher) {
    teacher.dispose();
    teacher=null;
  }
  observer?.disconnect();
  screen="home";
  render();
}
function navigateToProgress() {
  if (!progress) return;
  screen="flow";
  questionIndex=firstUnansweredIndex();
  render();
}
function startOver() {
  try {
    storage?.removeItem(V2_STORAGE_KEY);
    progress=freshProgress();
    stageSession=null;
    questionIndex=0;
    screen="home";
    render();
  } catch {
    announce("清除資料失敗，請確認瀏覽器儲存設定。");
  }
}
function handleV2(action, target) {
  if (action==="music") {
    const enabled=setMusicEnabled(!isMusicEnabled());
    target.textContent=`♫ 音樂${enabled?"開":"關"}`;
    target.setAttribute("aria-pressed",String(enabled));
    target.setAttribute("aria-label",enabled?"關閉背景音樂":"開啟背景音樂");
    if(enabled) activateMusicOnGesture();
    return;
  }
  if (action==="v2-cancel") return closeDialog();
  if (action==="v2-confirm") {
    const done=confirmation;
    closeDialog();
    done?.();
    return;
  }
  if (action==="v2-continue") return navigateToProgress();
  if (action==="v2-teacher-login") { screen="teacher-login"; return render(); }
  if (action==="v2-reset-damaged") {
    return modal("重新開始？","將清除這個裝置上無法辨識的 V2 進度。教師紀錄不受影響。",startOver);
  }
  if (action==="v2-restart") {
    return modal("開始新的挑戰？","這個裝置的 V2 前後測進度將清除；教師紀錄不會變更。",startOver);
  }
  if (!progress) return;
  try {
    if (action==="choose-case") {
      save(chooseCase(progress,target.dataset.caseId));
      questionIndex=0;
      return render();
    }
    if (action==="answer") {
      const { questionId,optionId }=target.dataset;
      save(recordChoice(progress,questionId,optionId));
      render({focus:false});
      main.querySelector(`[data-v2-action="answer"][data-option-id="${optionId}"]`)?.focus({preventScroll:true});
      return;
    }
    if (action==="v2-prev" && questionIndex>0) {
      questionIndex--;
      return render();
    }
    if (action==="v2-next" && questionIndex<9) {
      questionIndex++;
      return render();
    }
    if (action==="v2-submit") {
      save(submitTest(progress));
      return render();
    }
    if (action==="v2-advance") {
      const before=progress.step;
      save(advance(progress));
      if (before==="stage1") stageSession=null;
      if (before==="stage2") {
        stageSession=null;
        questionIndex=firstUnansweredIndex();
      }
      return render();
    }
    if (action==="choose-role") {
      save(chooseRole(progress,target.dataset.role));
      stageSession=null;
      return render();
    }
  } catch (error) {
    announce(error.message||"操作失敗");
  }
}
function handleLegacy(action,target) {
  if (!stageSession || !["stage1","stage2"].includes(progress?.step)) return;
  if (action==="reset-doctor" && stageSession.role==="doctor") {
    initializeStage();
    render();
    return announce("醫師紀錄已清空。");
  }
  if (action==="next-patient" && stageSession.role==="patient") {
    const pool=stageSession.stage===1?stageOneCases:cases;
    const index=(stageSession.caseIndex+1)%pool.length;
    stageSession=createIndependentSession("patient",stageSession.stage,
      (stageSession.round%5)+1,index);
    render();
    return announce("已切換到下一位練習病患。");
  }
  if (action==="mark") {
    if (mark(stageSession,target.dataset.id,JSON.parse(target.dataset.value))) {
      const y=window.scrollY;
      render({focus:false});
      window.scrollTo({top:y,behavior:"instant"});
      main.querySelector(`[data-action="mark"][data-id="${target.dataset.id}"][data-value="${target.dataset.value}"]`)?.focus({preventScroll:true});
    }
  }
  if (action==="ask" && ask(stageSession,target.dataset.id)) {
    render({focus:false});
    announce("已紀錄這次提問。");
  }
  if (action==="answer" && selectAnswer(stageSession,target.dataset.id)) {
    const y=window.scrollY;
    render({focus:false});
    window.scrollTo({top:y,behavior:"instant"});
    main.querySelector(`[data-action="answer"][data-id="${target.dataset.id}"]`)?.focus({preventScroll:true});
  }
  if (action==="focus-note") {
    const note=main.querySelector(`#${CSS.escape(target.dataset.note)}`);
    const ids=(target.dataset.notes||target.dataset.note).split(" ");
    main.querySelectorAll(".body-note").forEach(el=>el.classList.toggle("highlighted",ids.includes(el.id)));
    note?.focus({preventScroll:true});
    note?.scrollIntoView({block:"center",behavior:window.matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth"});
  }
}
app.addEventListener("click",(event)=>{
  const target=event.target.closest("[data-v2-action],[data-action]");
  if (!target || target.disabled) return;
  const plain=target.dataset.action || "";
  const v2=target.dataset.v2Action ||
    (plain.startsWith("v2-") || (plain==="choose-role" && progress?.step==="stage1-ready")
      ? plain : null);
  if (v2) handleV2(v2,target);
  else if (!teacher && plain==="home") goHome();
  else if (!teacher && plain==="clear-pin") {
    const pin=main.querySelector("#teacher-pin");
    if(pin) { pin.value=""; pin.focus(); }
    const error=main.querySelector("#login-error");
    if(error) error.textContent="";
  }
  else if (!teacher) handleLegacy(plain,target);
  activateMusicOnGesture();
  playUiSound(target.dataset.action==="mark"?"mark":"tap");
});
app.addEventListener("submit",(event)=>{
  if (teacher) return;
  event.preventDefault();
  if (event.target.id==="login-form") {
    const pin=String(new FormData(event.target).get("pin")||"");
    if(pin!=="0709") {
      const error=main.querySelector("#login-error");
      if(error) error.textContent="密碼不正確。";
      return;
    }
    screen="teacher";
    teacher=new TeacherApp(main,dialog,{
      leave(destination) {
        teacher?.dispose();
        teacher=null;
        screen=destination==="lock"?"teacher-login":"home";
        render();
      }, announce,
    });
  }
});
app.addEventListener("change",(event)=>{
  if(teacher||!stageSession) return;
  if (event.target.id==="patient-question" && progress?.step==="stage2" &&
      progress.role==="patient") {
    const id=event.target.value;
    const entry=cases[stageSession.caseIndex];
    if(id && !questionsForCase(entry.id).some(q=>q.id===id)) return;
    stageSession.pending=id||null;
    stageSession.selectedAnswer=null;
    stageSession.submitted=false;
    render({focus:false});
    main.querySelector("#patient-question")?.focus({preventScroll:true});
  }
});
app.addEventListener("input",(event)=>{
  if(event.target.id==="music-volume-slider") {
    const value=setMusicVolume(event.target.value);
    app.querySelector("#music-volume-value").textContent=`${value}%`;
    activateMusicOnGesture();
  }
});
dialog.addEventListener("cancel",(event)=>{
  if (teacher) return;
  event.preventDefault();
  closeDialog();
});
app.querySelector("#v2-home-link").addEventListener("click",event=>{
  event.preventDefault();
  if(teacher) return goHome();
  if(screen==="home") return;
  goHome();
});
app.addEventListener("error",(event)=>{
  if(event.target.matches?.(".case-art img"))
    event.target.closest(".case-art-frame").innerHTML=artPlaceholder;
},true);

render({focus:false});
