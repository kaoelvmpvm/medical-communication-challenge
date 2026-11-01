import { button as b, escapeHtml as e, notice } from "../ui/components.js";
import { rankings } from "./model.js";
import { cases } from "../data/cases.js";
import { readCode } from "../game/codes.js";
export function teacherView(
  book,
  classId,
  stage,
  section,
  canUndo,
  undoLabel,
  query = "",
) {
  const current =
    book.classes.find((entry) => entry.id === classId) || book.classes[0];
  return `<div class="teacher-shell"><div class="teacher-title"><div><span class="eyebrow">正式競賽紀錄・教師手動登記</span><h1 id="screen-title" tabindex="-1">教室紀錄中心</h1><p>每次有效提問與疾病猜測都記一次；猜錯繼續累積。</p></div><div class="teacher-actions">${b("鎖定畫面", "t-lock")}${b("登出", "t-logout", { kind: "quiet" })}</div></div>
  <div class="storage-status" role="status">✓ 已保存於這台裝置。無雲端同步；清除瀏覽器資料會遺失，請定期備份。</div><p id="teacher-error" class="form-error" role="alert"></p>
  <section class="panel teacher-controls"><div class="class-selector-row"><label>目前班級<select id="class-select" ${book.classes.length ? "" : "disabled"}>${book.classes.map((entry) => `<option value="${entry.id}" ${entry.id === current?.id ? "selected" : ""}>${e(entry.name)} 班</option>`).join("")}</select></label><details class="teacher-tool-details" ${current?.groups.length ? "" : "open"}><summary>班級與備份工具</summary><div class="tools-inner"><form id="class-form"><label>新增班級<input name="className" maxlength="30" required placeholder="例如 815" autocomplete="off"></label><button class="button secondary" type="submit">新增班級</button></form><div class="backup-controls">${b("匯出 CSV", "t-csv")}${b("JSON 備份", "t-backup")}<label class="button secondary file-label">匯入 JSON<input id="import-file" type="file" accept=".json,application/json"></label></div></div></details>${b("復原最近操作", "t-undo", { disabled: !canUndo, extra: `title="${e(undoLabel)}"` })}</div></section>
  ${
    current
      ? `<div class="workspace-heading"><h2>${e(current.name)} 班 <span class="count-badge">${current.groups.length} 組</span></h2><label class="group-search">快速找組別／座號<input type="search" id="group-search" value="${e(query)}" placeholder="輸入組別或座號"><span id="filter-status" class="field-help" role="status"></span></label>${b("＋ 新增組別", "t-add-group", { kind: "primary" })}</div><div class="workspace-tabs"><nav class="teacher-tabs" aria-label="教師工作區">${b("競賽紀錄", "t-section", { kind: section === "scores" ? "primary" : "secondary", extra: 'data-section="scores"' })}${b("病例與病人輪替", "t-section", { kind: section === "plans" ? "primary" : "secondary", extra: 'data-section="plans"' })}</nav><div class="phase-tabs" role="group" aria-label="選擇教師階段">${[1, 2, ...(section === "plans" ? [3] : [])].map((n) => b(`第${["一", "二", "三"][n - 1]}階段`, "t-stage", { kind: stage === n ? "primary" : "secondary", extra: `data-stage="${n}" aria-pressed="${stage === n}"` })).join("")}</div></div>
    ${current.groups.length ? (section === "scores" ? scoreSheet(current, stage) : plans(current, stage)) : `<section class="panel empty-state"><h2>先建立第一組</h2><p>每組五位學生，只需要座號，不必輸入姓名。新增後會自動安排每階段五份不同病例。</p>${b("新增第一組", "t-add-group", { kind: "primary" })}</section>`}`
      : `<section class="panel empty-state"><h2>從一個班級開始</h2><p>在上方新增班級，再建立組別。不同班級的成績會分開保存。</p></section>`
  }
  ${notice("固定密碼僅供簡易教室管理，不是伺服器身分驗證。只在教師裝置保存座號與成績，不會上傳至 GitHub。")}
  </div>`;
}
function scoreSheet(entry, stage) {
  const ranks = rankings(entry.groups, stage);
  return `<section class="score-sheet" aria-label="競賽紀錄表"><div class="score-head"><span>組別與五位組員座號</span><span>累積問題數</span><span>完成疾病數</span><span>組別管理</span></div>${[
    ...entry.groups,
  ]
    .sort((a, b) => a.number - b.number)
    .map(
      (group) =>
        `<article class="record-row" data-group="${group.id}" aria-label="第${group.number}組紀錄"><div class="group-identity"><h3>第 ${group.number} 組 <span class="rank-label" data-rank>${ranks.find((item) => item.group.id === group.id).rank === null ? "進行中" : `第 ${ranks.find((item) => item.group.id === group.id).rank} 名`}</span></h3><p>座號 ${group.seats.map(e).join("、")}</p><span class="progress-label" data-progress>${group.scores[stage].completed}/5 已完成</span></div>${counter(group, stage, "questions", "問題數")}${counter(group, stage, "completed", "完成數")}<div class="group-actions">${b("修改", "t-edit-group", { extra: `data-id="${group.id}"` })}${b("刪除", "t-delete-group", { kind: "quiet", extra: `data-id="${group.id}"` })}</div></article>`,
    )
    .join(
      "",
    )}</section><section class="panel ranking-panel"><div class="section-heading"><h2>第${stage === 1 ? "一" : "二"}階段排名</h2><span class="subtle-badge">完成 5 份才列正式名次</span></div><ol data-ranking>${rankingList(entry, stage)}</ol><p class="muted small">排名涵蓋全班，不受搜尋影響。同提問數並列，採競賽名次（例如 1、1、3）。第三階段不納入排名。</p></section>`;
}
function counter(group, stage, field, label) {
  const value = group.scores[stage][field];
  return `<div class="score-counter" data-field="${field}"><span class="counter-label">${label}</span><div class="stepper"><button type="button" data-action="t-adjust" data-id="${group.id}" data-field="${field}" data-delta="-1" aria-label="第${group.number}組減少${label}" ${value === 0 ? "disabled" : ""}>−</button><output aria-label="第${group.number}組${label}">${value}</output><button type="button" data-action="t-adjust" data-id="${group.id}" data-field="${field}" data-delta="1" aria-label="第${group.number}組增加${label}" ${value === (field === "completed" ? 5 : Number.MAX_SAFE_INTEGER) ? "disabled" : ""}>＋</button></div></div>`;
}
export function rankingList(entry, stage) {
  return rankings(entry.groups, stage)
    .map(
      ({ group, rank }) =>
        `<li><strong>${rank === null ? "練習中" : `第 ${rank} 名`}</strong><span>第 ${group.number} 組</span><span>${group.scores[stage].completed}/5 完成</span><span>${group.scores[stage].questions} 次提問</span></li>`,
    )
    .join("");
}
function plans(entry, stage) {
  if (stage === 1)
    return `<section class="plan-area"><div class="notice"><p>第一階段由病人平板在開始新回合時，從六種既有病例等機率隨機抽取。各回合可能抽到相同病例；不分配病例碼，也不向教師或醫師自動揭露答案。重新整理沿用該分頁的同回合病例。</p></div>${[
      ...entry.groups,
    ]
      .sort((a, b) => a.number - b.number)
      .map(
        (group) =>
          `<section class="panel group-plan" data-plan-group="${group.id}"><h3>第 ${group.number} 組</h3><div class="round-plan-grid">${group.seats
            .map(
              (seat, index) =>
                `<article><span class="eyebrow">第 ${index + 1} 回合</span><strong>病人：${e(seat)} 號</strong><p>醫師：${group.seats
                  .filter((_, i) => i !== index)
                  .map(e)
                  .join(
                    "、",
                  )} 號</p><p>病人按開始後自行隨機載入；僅口頭回答是或否。</p></article>`,
            )
            .join("")}</div></section>`,
      )
      .join("")}</section>`;

  return `<section class="plan-area"><div class="notice"><p>每組本階段的五份病例不重複。請私下把「病例碼」交給當回合病人；醫師不需要輸入，也不要讓醫師觀看這張安排表。${stage === 3 ? "本階段僅練習，不建立競賽成績。" : ""}</p></div>${[
    ...entry.groups,
  ]
    .sort((a, b) => a.number - b.number)
    .map(
      (group) =>
        `<section class="panel group-plan" data-plan-group="${group.id}"><h3>第 ${group.number} 組</h3><div class="round-plan-grid">${group.plans[
          stage
        ]
          .map(
            (code, index) =>
              `<article><span class="eyebrow">第 ${index + 1} 回合</span><strong>病人：${e(group.seats[index])} 號</strong><p>醫師：${group.seats
                .filter((_, i) => i !== index)
                .map(e)
                .join(
                  "、",
                )} 號</p><label>病例碼<input readonly value="${code}" aria-label="第${group.number}組第${index + 1}回合病例碼"></label><details><summary>教師查看病例名稱</summary><p>${e(cases[readCode(code).caseIndex].disease)}</p></details></article>`,
          )
          .join("")}</div></section>`,
    )
    .join("")}</section>`;
}
export function groupForm(group) {
  return `<h2 id="dialog-title">${group ? "修改組別" : "新增五人組別"}</h2><p>同一班級的座號不能重複分配。修改不會清除成績或病例安排。</p><form id="group-form" data-id="${group?.id || ""}"><label>組別編號<input type="number" name="number" min="1" max="999" step="1" required value="${group?.number || ""}"></label><fieldset class="seat-inputs"><legend>五位學生的座號（依病人輪替順序）</legend>${Array.from({ length: 5 }, (_, i) => `<label>第 ${i + 1} 位<input name="seat${i}" type="number" min="1" max="999" required value="${group?.seats[i] || ""}"></label>`).join("")}</fieldset><p class="form-error" id="group-error" role="alert"></p><div class="dialog-actions">${b("取消", "t-cancel")}<button class="button primary" type="submit">儲存組別</button></div></form>`;
}
