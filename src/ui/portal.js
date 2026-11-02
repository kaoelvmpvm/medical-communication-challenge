import {
  button as b,
  notice,
  stageLabels,
  escapeHtml as e,
} from "./components.js";
import { questions, questionsForCase } from "../data/questions.js";
export function portal(art = {}) {
  const roles = [
    ["doctor", "我是醫生", "聽回答、記線索，和夥伴一起推理。", "開始問診"],
    ["patient", "我是病人", "讀懂身體感受，練習清楚說明。", "開始描述"],
    ["teacher", "教師專用", "管理班級與組別，記錄進度與成績。", "進入教師紀錄"],
  ];
  return `<section class="home-hero" aria-labelledby="screen-title"><div class="home-copy"><h1 id="screen-title" class="home-title" tabindex="-1"><span class="sr-only logo-text">醫問到底！</span><img class="home-logo" data-art-kind="logo" src="${e(art.title || "")}" width="2172" height="724" alt="" fetchpriority="high"></h1></div><div class="home-illustration"><img data-art-kind="hero" src="${e(art.hero || "")}" width="1600" height="900" alt="醫生、病人和教師一起討論身體的線索" decoding="async"><span class="home-art-fallback" hidden>一起練習聽懂、問對、說清楚。</span></div></section><section class="role-grid" aria-label="選擇你的角色">${roles.map(([role, title, text, cta]) => `<button class="role-entry ${role}" type="button" data-action="choose-role" data-role="${role}" aria-labelledby="role-${role}-title" aria-describedby="role-${role}-description"><span class="role-art"><img data-art-kind="role" src="${e(art[role] || "")}" width="1024" height="1024" alt="" decoding="async"><span class="role-art-fallback" hidden>${title}</span></span><span class="role-copy"><strong id="role-${role}-title">${title}</strong><span id="role-${role}-description">${text}</span></span><span class="role-cta"><span>${cta}</span><span aria-hidden="true">→</span></span></button>`).join("")}</section>`;
}
export function setup(role, s = null) {
  return `<section class="panel student-setup"><span class="eyebrow">${role === "doctor" ? "醫師任務" : "病人任務"}</span><h1 id="screen-title" tabindex="-1">${role === "doctor" ? "準備開始推理" : "準備揭開身體線索"}</h1><p>${role === "doctor" ? "請選擇本次練習階段。" : "選擇練習階段後，直接開始新的病患情境。"}</p><form id="student-form" data-role="${role}"><div class="stage-button-grid" role="group" aria-label="選擇練習階段"><input type="hidden" name="stage" value="${s?.stage || 1}">${stageLabels.map((label, i) => `<button type="button" class="stage-pick" data-action="choose-stage" data-stage="${i + 1}" aria-pressed="${(s?.stage || 1) === i + 1}"><span class="stage-pick-number">0${i + 1}</span><strong>第${["一", "二", "三"][i]}階段</strong><span class="stage-pick-description">${label}</span></button>`).join("")}</div>${role === "patient" ? `<div id="patient-loading">${patientLoading(s?.stage || 1)}</div>` : ""}<p id="student-error" class="form-error" role="alert"></p><div class="dialog-actions">${b("返回角色入口", "home")}<button id="student-start" type="submit" class="button primary">${role === "doctor" ? "進入醫師端" : "開始回合"}</button></div></form></section>`;
}
export function login() {
  return `<section class="handoff-panel teacher-login"><span class="handoff-symbol" aria-hidden="true">▣</span><h1 id="screen-title" tabindex="-1">教師專用入口</h1><p>輸入四位數字密碼，開啟這台裝置的班級紀錄。</p><form id="login-form"><label>教師密碼<input id="teacher-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" required aria-describedby="login-error"></label><p id="login-error" class="form-error" role="alert"></p><div class="dialog-actions">${b("清除重輸", "clear-pin")}<button type="submit" class="button primary">解鎖紀錄中心</button></div></form>${b("回到角色入口", "home", { kind: "quiet" })}</section>`;
}
export function studentStatus(s, count) {
  return `<div class="session-status"><span class="role-tag ${s.role}">${s.role === "doctor" ? "＋ 醫師端" : "◎ 病人端"}</span><span>第 ${s.stage} 階段・${stageLabels[s.stage - 1]}</span>${s.role === "doctor" && s.stage !== 3 ? `${s.stage === 2 ? `<span>練習提問 <strong data-question-count>${s.questionCount}</strong></span>` : ""}<span>候選 <strong data-match-count>${count}</strong> 個</span>` : ""}<div class="status-actions">${s.role === "doctor" ? b("一鍵清空", "reset-doctor", { kind: "secondary" }) : ""}${b("更換階段", "change-stage")}</div></div>`;
}
export function patientQuestions(s, caseId) {
  return `<section class="stage-two-question-bar" aria-labelledby="patient-question-title">
    <label for="patient-question" id="patient-question-title">選擇聽到的問題</label>
    <select id="patient-question" aria-label="選擇聽到的問題">
      <option value="">請選擇醫師剛才提出的問題</option>
      ${questionsForCase(caseId).map((question) =>
        `<option value="${question.id}" ${s.pending === question.id ? "selected" : ""}>${e(question.title)}</option>`
      ).join("")}
    </select>
  </section>`;
}

export function patientLoading(_stage) {
  return '<p class="stage-patient-hint">按「開始回合」，揭曉這次的身體線索！</p>';
}
