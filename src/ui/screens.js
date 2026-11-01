import { diseaseCatalog } from "../data/disease-catalog.js";
import { symptoms, systems } from "../data/symptoms.js";
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
  return diseases
    .map((disease) => {
      const status =
        disease.comparison ||
        (matching.includes(disease.id) ? "consistent" : "conflict");
      const label = {
        unrecorded: "— 尚無比較線索",
        consistent: "✓ 與線索一致",
        insufficient: "？ 資訊不足以比較",
        conflict: "− 與線索衝突",
      }[status];
      return `<article class="candidate ${status === "conflict" ? "inconsistent" : "consistent"} ${status === "insufficient" ? "uncertain" : ""}" data-candidate="${disease.id}" data-comparison="${status}"><span class="candidate-icon" aria-hidden="true">${status === "conflict" ? "−" : status === "insufficient" ? "?" : "◈"}</span><h3>${e(disease.disease)}</h3><span class="candidate-label">${label}</span></article>`;
    })
    .join("");
}

function symptomCard(symptom, value, level = 4) {
  return `<article class="symptom-card" data-symptom-card="${symptom.id}" data-state="${value === undefined ? "unknown" : value ? "yes" : "no"}"><div class="symptom-heading"><h${level}>${symptom.name}</h${level}><span class="record-state" data-record-status>${value === undefined ? "— 未確認" : value ? "✓ 有" : "× 沒有"}</span></div><div class="record-controls" role="group" aria-label="${symptom.name}紀錄"><button type="button" class="record-button yes" data-action="mark" data-id="${symptom.id}" data-value="true" aria-pressed="${value === true}"><span aria-hidden="true">✓</span> 有</button><button type="button" class="record-button no" data-action="mark" data-id="${symptom.id}" data-value="false" aria-pressed="${value === false}"><span aria-hidden="true">×</span> 沒有</button><button type="button" class="record-clear" data-action="mark" data-id="${symptom.id}" data-value="null" aria-label="清除${symptom.name}紀錄">清除</button></div></article>`;
}

function candidatePanel(diseases, matching) {
  return `<section class="candidates-panel panel" aria-labelledby="candidate-title"><details class="candidate-details" open><summary><span><span class="eyebrow">只比對模擬情境</span><span id="candidate-title" class="summary-title">可能疾病 <span class="count-badge" data-match-summary>${matching.length} / ${diseases.length} 個未衝突</span></span></span><span class="collapse-label">展開／收合 <span aria-hidden="true">⌄</span></span></summary><div class="candidate-grid" data-candidates>${candidateCards(diseases, matching)}</div></details><p class="candidate-disclaimer">只比對已設定的教材線索；資料不足或不適用不參與排除。未衝突不代表確診，也不能用來排除真實疾病。</p></section>`;
}

export function doctor(s, diseases, matching) {
  if (s.stage === 1)
    return `${candidatePanel(diseases, matching)}<section class="panel record-panel phase-one-record" aria-labelledby="screen-title"><div class="section-heading"><h1 id="screen-title" tabindex="-1">症狀紀錄</h1>${b("清空症狀紀錄", "open-clear", { kind: "secondary" })}</div><p class="section-intro">依病人的口頭回答，選擇「有」或「沒有」；需要修改時可直接切換或清除。</p><div class="symptom-grid phase-one-grid">${symptoms.map((symptom) => symptomCard(symptom, s.records[symptom.id], 2)).join("")}</div></section>`;

  if (s.stage === 3)
    return `<section class="panel practice-panel"><span class="eyebrow">先聽完整，再確認理解</span><h1 tabindex="-1" id="screen-title">把理解，說給對方聽。</h1><p class="lead">請病患先完整描述，不急著猜疾病。你可以先傾聽，再用自己的話回述。</p><ol class="practice-steps"><li><strong>聽位置與感覺</strong><p>對方說了哪些身體感受？不要自行加入沒聽到的資訊。</p></li><li><strong>回述重點</strong><p>「我聽到你說……，我理解得對嗎？」</p></li><li><strong>邀請補充</strong><p>「還有什麼讓你擔心，或想再補充的？」</p></li></ol>${notice("這個階段重點是完整描述與確認理解，不進行疾病猜測或競賽計分。")}${s.independent ? `<section class="followup-panel"><h2>補充詢問</h2><p>選一句念給病人聽，或在下方整理自己的補充問題。不計分。</p>${["可以再說明不舒服的位置嗎？", "這種感覺怎麼影響你的日常生活？", "你最擔心的是哪一件事？"].map((text) => b(text, "followup", { extra: `data-text="${text}"` })).join("")}<label>我的補充問題<textarea id="followup-notes" rows="3" maxlength="2000" placeholder="只保留在此平板，不會傳送給其他裝置。">${e(s.followupNotes || "")}</textarea></label><p class="followup-status" role="status">${e(s.lastFollowup || "")}</p></section>` : b("完成這位病患的練習", "practice-next", { kind: "primary" })}</section>`;
  return `${candidatePanel(diseases, matching)}
  <div class="doctor-layout"><section class="panel record-panel" aria-labelledby="screen-title"><div class="section-heading"><div><span class="eyebrow">${s.stage === 1 ? "聽完口頭回答，再記錄" : "聽完病患回答，再記錄"}</span><h1 id="screen-title" tabindex="-1">症狀紀錄</h1></div><span class="subtle-badge" data-record-progress>${Object.keys(s.records).length} / ${symptoms.length} 已確認</span></div><p class="section-intro">用「有／沒有」整理聽到的線索。沒問到的項目，先留在未確認。</p><nav class="system-nav" aria-label="症狀分組">${systems.map((system) => `<a href="#group-${system.id}">${system.name}</a>`).join("")}</nav>${systems
    .map(
      (system) =>
        `<section class="symptom-group" id="group-${system.id}" aria-labelledby="heading-${system.id}"><h3 id="heading-${system.id}"><span aria-hidden="true">${system.icon}</span> ${system.name}</h3><div class="symptom-grid">${symptoms
          .filter((symptom) => symptom.system === system.id)
          .map((symptom) => symptomCard(symptom, s.records[symptom.id]))
          .join("")}</div></section>`,
    )
    .join("")}</section>
  <aside class="doctor-aside">
    ${s.solved ? `<section class="panel result-panel"><span class="success-symbol" aria-hidden="true">✓</span><h2>這次推理符合模擬病例！</h2><p>你用了 ${s.questionCount} 次提問。接著換位思考，練習下一個情境。</p>${b(s.caseIndex === 5 ? "查看階段回顧" : "下一位病患", "next", { kind: "primary" })}</section>` : `<section class="panel decision-panel"><span class="eyebrow">整理線索，再做決定</span><h2>準備好提出猜測了嗎？</h2><p>不必只剩一個候選，也可以先繼續問。猜測前會再次確認。</p>${b("猜測疾病", "open-guess", { kind: "primary" })}${b("清空症狀紀錄", "open-clear", { kind: "quiet" })}</section>`}
    ${questionPanel(s)}
    ${s.stage === 2 && !s.independent ? historyPanel(s) : ""}
    <section class="tip-card"><span aria-hidden="true">ⓘ</span><p>紀錄的是你聽到的資訊，不是病患的原始答案。可以切換、清除，再重新整理。</p></section>
  </aside></div>`;
}

function questionPanel(s) {
  return `<section class="panel question-panel"><span class="eyebrow">第二階段限定</span><h2>通用問診問題庫</h2><p>${s.independent ? "選好問題後念給病人聽，請病人在自己的平板選擇同一個問題。此處只累計本機輔助提問數。" : "選一個問題，再交給病患回答。每次選問都會計入提問數。"}</p>${!s.independent && s.pending && !s.submitted ? `${notice("還有一個問題等待病患回答。")}${b("交給病患回答", "switch", { kind: "primary" })}` : ""}${s.independent && s.pending ? `<p class="selected-question" role="status">已選問題：${e(questions.find((item) => item.id === s.pending).title)}。請口頭提問，這台裝置不會接收另一台的回答。</p>` : ""}<div class="question-list">${questions.map((question) => `<button type="button" class="question-button" data-action="ask" data-id="${question.id}" ${s.solved || (!s.independent && s.pending && !s.submitted) ? "disabled" : ""}><span>${question.group}</span>${question.title}<span class="question-arrow" aria-hidden="true">↗</span></button>`).join("")}</div></section>`;
}
function historyPanel(s) {
  return `<section class="panel history-panel"><h2>已確認的對話 <span class="count-badge">${s.history.length}</span></h2>${s.history.length ? `<ol>${s.history.map((entry, index) => `<li><span class="history-number">第 ${index + 1} 次對話</span><p><strong>醫師：</strong>${e(entry.question)}</p><p><strong>病患：</strong>${e(entry.answer)}</p></li>`).join("")}</ol>` : '<p class="empty-state">病患確認送出後，回答會出現在這裡。</p>'}</section>`;
}

export function patient(s, view, options) {
  const question = questions.find((item) => item.id === s.pending);
  const chosen = options.find((option) => option.id === s.selectedAnswer);
  return `<section class="patient-heading"><div><span class="eyebrow">${s.stage === 1 ? "讀懂感受，只回答是或否" : "感受在這裡，請用自己的話說"}</span><h1 id="screen-title" tabindex="-1">我的身體，怎麼了？</h1><p>${s.stage === 1 ? "先讀一讀身體周圍的感受。醫師提問時，已知內容只口頭回答「是」或「否」，不要直接念出情境。未設定或不適用的資訊，請示意教師判定問題無效後重新提問。" : s.stage === 2 ? "看看情境中的身體感受，再回應醫師提出的問題。" : "看著身體圖，整理重點，主動向醫師說出完整的身體感受。"}</p></div><div class="patient-identity"><span class="private-label">▣ 僅供病患閱讀</span><span class="disease-code">疾病代碼 <strong>${e(view.diseaseCode)}</strong></span><span class="field-help">教材內部識別碼，非醫療診斷代碼。</span></div></section>
  <div class="patient-visual-layout"><section class="panel patient-map-panel" aria-label="病情感受圖"><div class="map-heading"><span>情境中的身體感受</span><span class="map-instruction">點選編號，查看對應感受</span></div>${bodyMap(view)}${profileFacts(view.profile)}<p class="patient-context">${s.stage === 1 ? "已設定的內容依情境回答；資料不足或不適用不等於沒有症狀，請示意教師判定並重新提問。" : e(view.context)}</p></section>${caseArt(view.artUrl)}</div>
  ${s.stage === 2 ? `<section class="panel answer-panel" aria-labelledby="answer-title"><div class="section-heading"><div><span class="eyebrow">${s.independent ? "先選擇，再確認回答" : "先選擇，再確認送出"}</span><h2 id="answer-title">回應醫師的問題</h2></div><span class="subtle-badge">${s.submitted ? (s.independent ? "✓ 已在本機確認" : "✓ 已確認送出") : s.selectedAnswer ? (s.independent ? "已選擇・尚未確認" : "已選擇・尚未送出") : "等待選擇"}</span></div>${question ? `<blockquote class="current-question">${e(question.title)}</blockquote><div class="answer-options" role="group" aria-label="選擇病患回答">${options.map((option, index) => `<button type="button" class="answer-option ${s.selectedAnswer === option.id ? "selected" : ""}" data-action="answer" data-id="${option.id}" aria-pressed="${s.selectedAnswer === option.id}" ${s.submitted ? "disabled" : ""}><span class="option-number">${index + 1}</span><span>${e(option.text)}</span><span class="option-state">${s.selectedAnswer === option.id ? "✓ 已選擇" : "選擇"}</span></button>`).join("")}</div>${s.submitted ? `<div class="answer-analysis" role="status"><span class="eyebrow">${s.independent ? "已在本機確認・表達品質解析" : "已送出・表達品質解析"}</span><h3>${e(chosen.quality)}</h3><p>${e(chosen.analysis)}</p></div>${s.independent ? `<p class="notice">已在這台平板確認；請把選擇的回答口頭告訴醫師，沒有自動傳送。</p>` : b("交給醫師，查看回答", "switch", { kind: "primary" })}` : `<div class="answer-submit">${b(s.independent ? "確認回答" : "確認送出回答", "submit-answer", { kind: "primary", disabled: !s.selectedAnswer })}<p>${s.independent ? "確認後才顯示解析；請口頭告訴醫師，不會自動傳送。" : "確認後才會顯示解析，醫師也才能看到你的回答。"}</p></div>`}` : `${s.independent ? `<p class="empty-state">先聽醫師口頭提問，再從上方選擇同一問題。</p>` : `<div class="empty-state">醫師還沒有選擇問題。先熟悉身體感受，再交給醫師選問。</div>${b("交給醫師選擇問題", "switch", { kind: "primary" })}`}`}</section>` : s.stage === 3 ? practicePanel(s) : `<div class="patient-bottom">${notice("已知內容只回答「是」或「否」。未知或不適用時請教師判定問題無效，不要猜成「否」；已登記的無效問題可由教師減一或復原。")}${s.independent ? `<p class="muted">讀完後請口頭回應醫師，不需交換平板。</p>` : b("我讀好了，交給醫師", "switch", { kind: "primary" })}</div>`}`;
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
