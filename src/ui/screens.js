import { pictogram } from "./pictograms.js";
import { diseaseCatalog } from "../data/disease-catalog.js";
import { symptoms, systems } from "../data/symptoms.js";
import { stageOneSymptoms } from "../data/stage-one.js";
import { questions } from "../data/questions.js";
import { caseArt } from "./case-art.js";
import { bodyMap } from "./body-map.js";
import {
  button as b,
  escapeHtml as e,
  notice,
  stageLabels,
} from "./components.js";

export function lobby() {
  return `<section class="welcome"><div class="welcome-copy"><span class="eyebrow">醫病溝通・情境推理</span><h1>醫問到底！<br><span>病情解碼挑戰</span></h1><p class="lead">好問題，讓線索更清楚。<br>兩人輪流扮演醫師與病患，練習聽懂、問對、說清楚。</p><div class="welcome-tags"><span>雙人共用一台裝置</span><span>${diseaseCatalog.length} 個模擬病例</span></div>${notice("這是教學情境，不是真實診斷工具。線索比對只代表與模擬病例是否一致。")}</div><div class="welcome-graphic" aria-hidden="true"><div class="graphic-cross">＋</div><div class="graphic-message">哪裡不舒服？</div><div class="graphic-answer">多問一句，多懂一點。</div><span class="graphic-caption">從對話，走向理解。</span></div></section>
  <section aria-labelledby="start-title" class="start-section"><div class="section-heading"><div><span class="eyebrow">選擇練習</span><h2 id="start-title">三個階段，一步步解碼</h2></div><p>建議依序練習，也可以直接進入指定階段。</p></div><div class="stage-choices">${stageLabels.map((label, i) => `<article class="stage-choice"><span class="stage-number">0${i + 1}</span><h3>${label}</h3><p>${["自由口頭問答。病患看情境，醫師自行提問並記錄症狀。", "使用通用問診問題庫。病患選擇回答，確認後一起了解表達品質。", "病患主動整理病情，醫師練習傾聽與回述。不顯示競賽計分。"][i]}</p>${b(`進入第${["一", "二", "三"][i]}階段 <span aria-hidden="true">→</span>`, "start", { kind: i === 0 ? "primary" : "secondary", extra: `data-stage="${i + 1}"` })}</article>`).join("")}</div>${notice("每階段先由病患閱讀情境，再交給醫師。每次換手都會先遮住畫面，確認身分後才開啟。沒有跨裝置同步；重新整理網頁將重新開始。")}</section>`;
}

export function handoff(target, stage, number) {
  return `<section class="handoff-panel" aria-labelledby="handoff-title"><span class="handoff-symbol" aria-hidden="true">⇄</span><span class="eyebrow">安全交接裝置</span><h1 id="handoff-title" tabindex="-1">請將裝置交給${target === "doctor" ? "醫師" : "病患"}</h1><p class="lead">目前所有角色內容都已遮住。<br>請由下一位操作者確認後，再開啟畫面。</p><div class="handoff-meta"><span>第 ${stage} 階段 · ${stageLabels[stage - 1]}</span><span>第 ${number} 位病患</span></div>${b(`我是${target === "doctor" ? "醫師" : "病患"}，開啟畫面`, "enter", { kind: "primary" })}<p class="muted">確認前，請讓另一位同學移開視線。</p></section>`;
}

export function statusBar(s, candidateCount) {
  return `<div class="session-status" aria-label="練習狀態"><span class="role-tag ${s.role}">${s.role === "doctor" ? "＋ 醫師端" : "◎ 病患端"}</span><span class="status-stage">第 ${s.stage} 階段・${stageLabels[s.stage - 1]}</span><span>病患 <strong>${s.caseIndex + 1}</strong><span class="muted"> / ${diseaseCatalog.length}</span></span>${s.stage !== 3 ? `<span>已提問 <strong data-question-count>${s.questionCount}</strong> 次</span>${s.role === "doctor" ? `<span>符合 <strong data-match-count>${candidateCount}</strong> 個案例</span>` : ""}` : '<span class="practice-tag">敘述與傾聽練習</span>'}<div class="status-actions">${b(`<span class="switch-label">交給${s.role === "doctor" ? "病患" : "醫師"}</span><span class="switch-short" aria-hidden="true">交接</span><span aria-hidden="true">⇄</span>`, "switch", { kind: "secondary" })}</div></div>`;
}

export function candidateCards(diseases, matching) {
  return diseases.map((disease) => {
    const status = disease.comparison ||
      (matching.includes(disease.id) ? "insufficient" : "conflict");
    const label = {
      unrecorded: "？ 無法判斷",
      insufficient: "？ 無法判斷",
      consistent: "✓ 與線索相符",
      conflict: "× 與線索衝突",
    }[status];
    const appearance =
      status === "conflict" ? "inconsistent" :
      status === "consistent" ? "confirmed" : "uncertain";
    return `<article class="candidate ${appearance}" data-candidate="${disease.id}" data-comparison="${status}"><span class="candidate-icon" aria-hidden="true">${pictogram(disease.id)}</span><h3>${e(disease.disease)}</h3><span class="candidate-label">${label}</span></article>`;
  }).join("");
}

function symptomCard(symptom, value, level = 4) {
  return `<article class="symptom-card" data-symptom-card="${symptom.id}" data-state="${value === undefined ? "unknown" : value ? "yes" : "no"}"><div class="symptom-heading"><h${level}>${pictogram(symptom.id)}${symptom.name}</h${level}><span class="record-state" data-record-status>${value === undefined ? "— 未確認" : value ? "✓ 有" : "× 沒有"}</span></div><div class="record-controls" role="group" aria-label="${symptom.name}紀錄"><button type="button" class="record-button yes" data-action="mark" data-id="${symptom.id}" data-value="true" aria-pressed="${value === true}"><span aria-hidden="true">✓</span> 有</button><button type="button" class="record-button no" data-action="mark" data-id="${symptom.id}" data-value="false" aria-pressed="${value === false}"><span aria-hidden="true">×</span> 沒有</button><button type="button" class="record-clear" data-action="mark" data-id="${symptom.id}" data-value="null" aria-label="清除${symptom.name}紀錄">清除</button></div></article>`;
}

function candidatePanel(diseases, matching) {
  return `<section class="candidates-panel panel" aria-labelledby="candidate-title"><details class="candidate-details" open><summary><span><span id="candidate-title" class="summary-title">可能疾病 <span class="count-badge" data-match-summary>${matching.length} / ${diseases.length} 個未衝突</span></span></span><span class="collapse-label">展開／收合 <span aria-hidden="true">⌄</span></span></summary><div class="candidate-grid" data-candidates>${candidateCards(diseases, matching)}</div></details></section>`;
}

// Each second-stage oral question belongs to the symptom group in which it is displayed.
export const stageTwoQuestionGroups = Object.freeze({
  general: ["body"],
  head: ["head"],
  airway: ["nose", "throat", "chest"],
  gut: ["stomach"],
  urinary: ["bladder"],
  eyes: ["eyes"],
  skin: ["skin"],
  ears: ["ears"],
  period: ["period"],
});

function inlineQuestions(systemId, s) {
  const ids = stageTwoQuestionGroups[systemId] || [];
  const items = questions.filter((q) => ids.includes(q.id));
  return `<div class="inline-question-list" aria-label="${e(systemId)}部位的問診題目">${items.map((question) => {
    const selected = s.pending === question.id;
    const disabled = s.solved || (!s.independent && s.pending && !s.submitted);
    return `<div class="inline-question-item"><button type="button" id="question-${question.id}" class="question-button inline-question-button ${selected ? "is-selected" : ""}" data-action="ask" data-id="${question.id}" aria-pressed="${selected}" ${disabled ? "disabled" : ""}><span class="question-prompt-label">問診問題</span><span class="question-prompt-text">${e(question.title)}</span><span class="question-arrow" aria-hidden="true">↗</span></button>${selected ? '<p class="selected-question" role="status">✓ 已選這題：${e(question.title)}。請口頭詢問病人。</p>' : ""}</div>`;
  }).join("")}</div>`;
}

export function doctor(s, diseases, matching) {
  if (s.stage === 1)
    return `${candidatePanel(diseases, matching)}<section class="panel record-panel phase-one-record" aria-labelledby="screen-title"><div class="section-heading"><h1 id="screen-title" tabindex="-1">第一階段・症狀紀錄</h1></div><p class="section-intro">依病人的口頭回答，選擇「有」或「沒有」；需要修改時可直接切換或清除。</p><div class="symptom-grid phase-one-grid">${stageOneSymptoms.map((symptom) => symptomCard(symptom, s.records[symptom.id], 2)).join("")}</div></section>`;

  if (s.stage === 3)
    return `<section class="panel practice-panel"><span class="eyebrow">先聽完整，再確認理解</span><h1 tabindex="-1" id="screen-title">聽懂病情，再補問清楚</h1><p class="lead">先聽病人完整說明，再確認不舒服的位置、感覺、時間與生活影響。</p><ol class="practice-steps"><li><strong>整理四個重點</strong><p>哪裡不舒服、什麼感覺、持續多久、如何影響生活？</p></li><li><strong>確認自己的理解</strong><p>「我聽到你說……，這樣理解對嗎？」</p></li><li><strong>補問尚不清楚的地方</strong><p>「還有什麼沒說清楚，或是你最擔心的事？」</p></li></ol>${notice("這個階段重點是完整描述與確認理解，不進行疾病猜測或競賽計分。")}${s.independent ? `<section class="followup-panel"><h2>補充詢問</h2><p>選一句念給病人聽，或在下方整理自己的補充問題。不計分。</p>${["可以再說明不舒服的位置嗎？", "這種感覺怎麼影響你的日常生活？", "你最擔心的是哪一件事？"].map((text) => b(text, "followup", { extra: `data-text="${text}"` })).join("")}<label>我的補充問題<textarea id="followup-notes" rows="3" maxlength="2000" placeholder="例如：這種感覺持續多久？">${e(s.followupNotes || "")}</textarea></label><p class="followup-status" role="status">${e(s.lastFollowup || "")}</p></section>` : b("完成這位病患的練習", "practice-next", { kind: "primary" })}</section>`;
  return `${candidatePanel(diseases, matching)}
    <section class="panel record-panel stage-two-record" aria-labelledby="screen-title">
      <div class="section-heading"><div><span class="eyebrow">第二階段・問診與推理</span><h1 id="screen-title" tabindex="-1">選問題・記線索</h1></div>
      <span class="subtle-badge" data-record-progress>${Object.keys(s.records).length} / ${symptoms.length} 已確認</span></div>
      <p class="section-intro">選擇問題並詢問病人，再把聽到的症狀記錄下來。</p>
      ${systems.map((system) => `<section class="symptom-group" id="group-${system.id}" aria-labelledby="heading-${system.id}">
        <h3 id="heading-${system.id}"><span aria-hidden="true">${system.icon}</span> ${system.name}</h3>
        ${inlineQuestions(system.id, s)}
        <div class="symptom-grid">${symptoms.filter((symptom) => symptom.system === system.id).map((symptom) => symptomCard(symptom, s.records[symptom.id])).join("")}</div>
      </section>`).join("")}
      ${!s.independent && s.pending && !s.submitted ? `<div class="answer-handoff">${b("交給病患回答", "switch", { kind: "primary" })}</div>` : ""}
    </section>`;
}


export function patient(s, view, options) {
  const question = questions.find((item) => item.id === s.pending);
  const chosen = options.find((option) => option.id === s.selectedAnswer);
  return `<section class="patient-heading"><div><span class="eyebrow">${s.stage === 1 ? "讀懂感受，只回答是或否" : "感受在這裡，請用自己的話說"}</span><h1 id="screen-title" tabindex="-1">我的身體，怎麼了？</h1><p>${s.stage === 1 ? "先讀情境；醫師提問時，依已知內容口頭回答「是」或「否」，不要直接念出描述。" : s.stage === 2 ? "看看情境中的身體感受，再回應醫師提出的問題。" : "看著身體圖，整理重點，主動向醫師說出完整的身體感受。"}</p></div><div class="patient-identity"><span class="private-label">▣ 僅供病患閱讀</span></div></section>
  <div class="patient-visual-layout"><section class="panel patient-map-panel" aria-label="病情感受圖"><div class="map-heading"><span>情境中的身體感受</span><span class="map-instruction">點選編號，查看對應感受</span></div>${bodyMap(view)}${profileFacts(view.profile)}</section>${caseArt(view.artUrl)}</div>
  ${s.stage === 2 ? `<section class="panel answer-panel" aria-labelledby="answer-title"><div class="section-heading"><div><span class="eyebrow">${s.independent ? "先選擇，再確認回答" : "先選擇，再確認送出"}</span><h2 id="answer-title">回應醫師的問題</h2></div><span class="subtle-badge">${s.submitted ? (s.independent ? "✓ 已確認回答" : "✓ 已確認送出") : s.selectedAnswer ? (s.independent ? "已選擇・尚未確認" : "已選擇・尚未送出") : "等待選擇"}</span></div>${question ? `<blockquote class="current-question">${e(question.title)}</blockquote><div class="answer-options" role="group" aria-label="選擇病患回答">${options.map((option, index) => `<button type="button" class="answer-option ${s.selectedAnswer === option.id ? "selected" : ""}" data-action="answer" data-id="${option.id}" aria-pressed="${s.selectedAnswer === option.id}" ${s.submitted ? "disabled" : ""}><span class="option-number">${index + 1}</span><span>${e(option.text)}</span><span class="option-state">${s.selectedAnswer === option.id ? "✓ 已選擇" : "選擇"}</span></button>`).join("")}</div>${s.submitted ? `<div class="answer-analysis" role="status"><span class="eyebrow">${s.independent ? "已確認・表達品質解析" : "已送出・表達品質解析"}</span><h3>${e(chosen.quality)}</h3><p>${e(chosen.analysis)}</p></div>${s.independent ? `<p class="notice">請把確認的回答口頭告訴醫師。</p>` : b("交給醫師，查看回答", "switch", { kind: "primary" })}` : `<div class="answer-submit">${b(s.independent ? "確認回答" : "確認送出回答", "submit-answer", { kind: "primary", disabled: !s.selectedAnswer })}<p>${s.independent ? "確認後查看解析，再口頭回答醫師。" : "確認後才會顯示解析，醫師也才能看到你的回答。"}</p></div>`}` : `${s.independent ? `<p class="empty-state">先聽醫師口頭提問，再從上方選擇同一問題。</p>` : `<div class="empty-state">醫師還沒有選擇問題。先熟悉身體感受，再交給醫師選問。</div>${b("交給醫師選擇問題", "switch", { kind: "primary" })}`}`}</section>` : s.stage === 3 ? practicePanel(s) : `<div class="patient-bottom">${notice("已知內容只回答「是」或「否」。資料不足或不適用時，請教師判定並重新提問，不要猜成「否」。")}${s.independent ? `<p class="muted">讀完後請口頭回應醫師，不需交換平板。</p>` : b("我讀好了，交給醫師", "switch", { kind: "primary" })}</div>`}`;
}
function practicePanel(s) {
  return `<section class="panel practice-panel"><span class="eyebrow">第三階段・主動描述</span><h2>把病情說成一段完整的話</h2><p>可以依照下面的順序練習；勾選只用來提醒自己。</p><div class="practice-checks">${[
    ["where", "先說哪裡不舒服", "「我最近……，最不舒服的地方是……」"],
    [
      "how",
      "補上具體的感覺與細節",
      "說明怎麼不舒服，還有情境裡提供的時間、次數或測量。",
    ],
    [
      "concern",
      "說出你的擔心，邀請確認",
      "「我比較擔心……，還有哪裡需要我補充嗎？」",
    ],
  ]
    .map(
      ([id, title, text]) =>
        `<label><input type="checkbox" data-practice="${id}" ${s.practice.includes(id) ? "checked" : ""}><span><strong>${title}</strong><span>${text}</span></span></label>`,
    )
    .join(
      "",
    )}</div>${notice("情境沒有提供的資訊，可以說「我還不確定」，不需要編造細節。")}${s.independent ? `<p class="muted">準備好後，請直接向同組醫師完整描述。</p>` : b("我準備好了，交給醫師傾聽", "switch", { kind: "primary" })}</section>`;
}
export function summary(s) {
  return `<section class="handoff-panel"><span class="handoff-symbol" aria-hidden="true">✓</span><span class="eyebrow">階段練習完成</span><h1 id="screen-title" tabindex="-1">${diseaseCatalog.length} 段對話，持續練習理解。</h1><p class="lead">你已完成第 ${s.stage} 階段「${stageLabels[s.stage - 1]}」。</p>${s.stage !== 3 ? `<div class="summary-stat"><strong>${s.totalQuestions}</strong><span>累積提問次數</span></div><p>回想一下：哪一個問題，讓你更接近理解？</p>` : "<p>試著跟同學分享：怎樣的說法，最容易讓對方聽懂？</p>"}<div class="dialog-actions">${s.stage < 3 ? b("進入下一階段", "next-stage", { kind: "primary" }) : ""}${b("回到練習選單", "home")}</div></section>`;
}

function profileFacts(profile = {}) {
  const labels = {
    severity: "不舒服程度（滿分10分）",
    onset: "發病時間",
    onsetPattern: "開始的方式",
    change: "後來的變化",
    frequency: "出現的頻率",
    duration: "持續時間",
    aggravating: "加重因素",
    relieving: "比較舒服的情況",
    impact: "生活影響",
    temperature: "體溫",
    history: "過去類似經驗",
    trigger: "誘發原因",
    related: "相關事件",
  };
  return Object.keys(profile).length
    ? `<details class="profile-facts"><summary>整理我的病情資訊</summary><dl>${Object.entries(
        profile,
      )
        .map(
          ([key, value]) =>
            `<div><dt>${labels[key] || e(key)}</dt><dd>${e(value)}</dd></div>`,
        )
        .join("")}</dl></details>`
    : "";
}
