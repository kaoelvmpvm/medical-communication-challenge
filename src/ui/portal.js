import {
  button as b,
  notice,
  stageLabels,
  escapeHtml as e,
} from "./components.js";
import { questions } from "../data/questions.js";
export function portal() {
  return `<section class="role-intro"><span class="eyebrow">五人一組・每人一台平板</span><h1 id="screen-title" tabindex="-1">醫問到底！<br><span>一起問，一起解碼。</span></h1><p class="lead">四位醫師合作推理，一位病人描述感受。<br>教師掌握全班紀錄，每回合交換任務。</p></section><section class="role-grid" aria-label="選擇你的角色">${[
    ["doctor", "＋", "我是醫生", "記錄線索、討論推理，用好問題理解病情。"],
    ["patient", "◎", "我是病人", "輸入教師提供的病例碼，讀懂感受並練習表達。"],
    [
      "teacher",
      "▣",
      "教師專用",
      "管理班級與五人小組，安排病例、登記成績與排名。",
    ],
  ]
    .map(
      ([role, icon, title, text]) =>
        `<button class="role-entry ${role}" type="button" data-action="choose-role" data-role="${role}"><span class="role-entry-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><span>${text}</span><span class="role-entry-arrow" aria-hidden="true">→</span></button>`,
    )
    .join(
      "",
    )}</section>${notice("各平板獨立操作，不會自動同步。教師手動登記的數字才是正式成績；病例碼只交給當回合的病人。")}`;
}
export function setup(role, s = null) {
  return `<section class="panel student-setup"><span class="eyebrow">${role === "doctor" ? "醫師平板・獨立紀錄" : "病人平板・病例碼載入"}</span><h1 id="screen-title" tabindex="-1">${role === "doctor" ? "準備開始推理" : "載入這一回合的感受"}</h1><p>${role === "doctor" ? "請跟教師確認階段與回合。不需要輸入病例碼，也不會在這裡取得正確答案。" : "請先確認現在的階段與回合，再私下向教師取得 12 位數字病例碼。"}</p><form id="student-form" data-role="${role}"><div class="setup-fields"><label>練習階段<select name="stage">${stageLabels.map((label, i) => `<option value="${i + 1}" ${s?.stage === i + 1 ? "selected" : ""}>第${i + 1}階段・${label}</option>`).join("")}</select></label><label>病人回合<select name="round">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${s?.round === n ? "selected" : ""}>第 ${n} 回合 / 5</option>`).join("")}</select></label></div>${role === "patient" ? '<label>教師提供的病例碼<input aria-label="教師提供的病例碼" name="code" inputmode="numeric" autocomplete="off" maxlength="16" required placeholder="12 位數字" aria-describedby="code-help"><span id="code-help" class="field-help">只交給病人閱讀，不要向醫師展示病例碼或這個畫面。</span></label>' : ""}<p id="student-error" class="form-error" role="alert"></p><div class="dialog-actions">${b("返回角色入口", "home")}<button type="submit" class="button primary">${role === "doctor" ? "進入醫師端" : "載入病例"}</button></div></form></section>`;
}
export function login() {
  return `<section class="handoff-panel teacher-login"><span class="handoff-symbol" aria-hidden="true">▣</span><h1 id="screen-title" tabindex="-1">教師專用入口</h1><p>輸入四位數字密碼，開啟這台裝置的班級紀錄。</p><form id="login-form"><label>教師密碼<input id="teacher-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" required aria-describedby="login-error"></label><p id="login-error" class="form-error" role="alert"></p><div class="dialog-actions">${b("清除重輸", "clear-pin")}<button type="submit" class="button primary">解鎖紀錄中心</button></div></form><p class="small muted">固定密碼為簡易教室管理用途，不是伺服器身分驗證，無法防止技術性繞過。</p>${b("回到角色入口", "home", { kind: "quiet" })}</section>`;
}
export function studentStatus(s, count) {
  return `<div class="session-status"><span class="role-tag ${s.role}">${s.role === "doctor" ? "＋ 醫師端" : "◎ 病人端"}</span><span>第 ${s.stage} 階段・${stageLabels[s.stage - 1]}</span><span>第 <strong>${s.round}</strong> / 5 回合</span>${s.role === "doctor" && s.stage !== 3 ? `<span>本機輔助提問 <strong data-question-count>${s.questionCount}</strong></span><span>符合 <strong data-match-count>${count}</strong> 個案例</span>` : ""}<div class="status-actions">${b("更換階段／回合", "change-round")}</div></div>`;
}
export function patientQuestions(s) {
  return `<section class="panel patient-question-picker"><h2>醫師現在問的是哪一題？</h2><p>依口頭問題選擇。沒有跨平板傳送，選好後再到下方選擇回答。</p><label>選擇聽到的問題<select id="patient-question"><option value="">尚未選擇</option>${questions.map((question) => `<option value="${question.id}" ${s.pending === question.id ? "selected" : ""}>${e(question.title)}</option>`).join("")}</select></label></section>`;
}
