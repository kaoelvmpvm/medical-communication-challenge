import { AXES, CASE_CATALOG } from "./assessment/constants.js";
import { getAssessmentBank } from "./assessment/data/index.js";
import { scoreAssessment, compareAssessments } from "./assessment/scoring.js";
import { escapeHtml as e, button as b } from "../ui/components.js";

const labels = ["遊戲前測", "第一階段", "第二階段", "遊戲後測"];
const stepNo = { choose: -1, pretest: 0, "pre-result": 0,
  "stage1-ready": 1, stage1: 1, stage2: 2, posttest: 3, final: 4 };

export function stepIndicator(progress) {
  const active = stepNo[progress.step];
  return `<nav class="v2-progress" aria-label="學習進度"><ol>${labels.map((name, i) =>
    `<li class="${i < active ? "is-done" : i === active ? "is-active" : ""}"
      ${i === active ? 'aria-current="step"' : ""}><span class="v2-step-number">${i + 1}</span><span>${name}</span></li>`).join("")}</ol></nav>`;
}
export function home(art = {}, hasProgress = false) {
  return `<section class="v2-home" aria-labelledby="screen-title">
    <div class="v2-home-copy">
      <span class="v2-eyebrow">醫病溝通 × 病情表達</span>
      <h1 id="screen-title" tabindex="-1"><img src="${e(art.title || "")}" width="660" height="220" alt="醫問到底！" class="v2-home-logo"></h1>
      <p class="v2-lead">說清楚身體狀況，讓醫師更了解你的需要。</p>
      <div class="v2-home-actions">
        ${b(hasProgress ? "繼續我的學習" : "開始學習挑戰", "v2-continue", {kind:"primary"})}
        ${b("教師專用", "v2-teacher-login")}
      </div>
    </div>
    <div class="v2-home-art"><img src="${e(art.hero || "")}" width="1200" height="675" alt="醫師、病人與教師共同探索病情線索" decoding="async"></div>
  </section>
  <section class="v2-journey" aria-label="四步學習任務">
    ${labels.map((label, i)=>`<div class="v2-journey-item"><span>0${i+1}</span><strong>${label}</strong><small>${["認識自己的表達習慣","體驗資訊不足的困難","練習選擇清楚的說法","比較學習前後的改變"][i]}</small></div>`).join("")}
  </section>`;
}
export function chooseCasePage(progress, artUrl) {
  return `${stepIndicator(progress)}<section class="v2-panel" aria-labelledby="screen-title">
    <span class="v2-eyebrow">前測準備</span>
    <h1 id="screen-title" tabindex="-1">選擇一種你熟悉的疾病</h1>
    <p>請選擇自己曾經歷過，或比較熟悉的疾病。接下來會閱讀<strong>虛構病人的固定情境</strong>，不是填寫自己的真實病史。前測與後測會使用同一種疾病。</p>
    <div class="v2-case-grid">${CASE_CATALOG.map(item=>`<button type="button" class="v2-case-option" data-v2-action="choose-case" data-case-id="${e(item.id)}"><img src="${e(artUrl(item.id) || "")}" alt="" width="300" height="375" loading="lazy"><strong>${e(item.title)}</strong><span>選擇這個情境 →</span></button>`).join("")}</div>
  </section>`;
}
export function scenarioPanel(progress) {
  const bank=getAssessmentBank(progress.caseId);
  const title=CASE_CATALOG.find(item=>item.id===progress.caseId).title;
  return `<details class="v2-scenario" open>
    <summary><span>本次模擬病例｜${e(title)}</span><span class="v2-scenario-tip">可隨時展開／收合</span></summary>
    <p class="v2-scenario-body">${e(bank.scenario)}</p>
  </details>`;
}
export function assessment(progress, index) {
  const phase=progress.step==="pretest"?"pre":"post";
  const bank=getAssessmentBank(progress.caseId);
  const question=bank[phase][index];
  const answers=progress[phase==="pre"?"preAnswers":"postAnswers"];
  const chosen=answers[question.id] || null;
  const answered=Object.keys(answers).length;
  const completed=answered===10;
  return `${stepIndicator(progress)}<section class="v2-assessment" aria-labelledby="screen-title">
    <div class="v2-assessment-head"><div><span class="v2-eyebrow">${phase==="pre"?"遊戲前測":"遊戲後測"}</span>
    <h1 id="screen-title" tabindex="-1">如果是你，會怎麼說？</h1></div>
    <span class="v2-question-count">第 ${index+1} / 10 題</span></div>
    ${scenarioPanel(progress)}
    <div class="v2-question-card" aria-labelledby="v2-prompt">
      <div class="v2-question-tags"><span>${e(AXES.find(axis=>axis.id===question.axis).label)}</span><span>${answered} / 10 已作答</span></div>
      <h2 id="v2-prompt">${e(question.prompt)}</h2>
      <p>下面哪一個回答，最有可能是你平常會說的話？</p>
      <div class="v2-answers" role="group" aria-label="選擇一個最接近自己表達習慣的回答">
      ${question.options.map(option=>`<button type="button" class="v2-answer ${chosen===option.id?"is-selected":""}" data-v2-action="answer" data-question-id="${question.id}" data-option-id="${option.id}" aria-pressed="${chosen===option.id}"><span class="v2-choice-label">${option.id}</span><span>${e(option.text)}</span></button>`).join("")}
      </div>
      <div class="v2-question-controls">
      ${b("上一題","v2-prev",{disabled:index===0})}
      ${index<9?b("下一題","v2-next",{kind:"primary",disabled:!chosen}):b(phase==="pre"?"完成前測":"完成後測","v2-submit",{kind:"primary",disabled:!completed})}
      </div>
    </div>
    <p class="v2-footnote">不顯示答案或分數。可以返回更改選項，送出後才結算。</p>
  </section>`;
}
function dimensionList(result) {
  return `<div class="v2-dimensions">${result.dimensions.map(d=>`<div class="v2-dimension"><span>${e(d.label)}</span><strong>${d.radar} / 4</strong><div class="v2-meter" role="meter" aria-label="${e(d.label)}" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${d.radar}"><span style="width:${d.radar*25}%"></span></div></div>`).join("")}</div>`;
}
export function preResult(progress) {
  const bank=getAssessmentBank(progress.caseId);
  const result=scoreAssessment(bank,"pre",progress.preAnswers).result;
  return `${stepIndicator(progress)}<section class="v2-panel v2-result" aria-labelledby="screen-title"><span class="v2-eyebrow">遊戲前測完成</span>
    <h1 id="screen-title" tabindex="-1">你目前的病情表達習慣</h1>
    <p>這是你在虛構情境中選擇回答的表現，不代表真實就醫能力。完成遊戲後會以同一個病例進行後測。</p>
    ${dimensionList(result)}<div class="v2-action-end">${b("進入第一階段","v2-advance",{kind:"primary"})}</div>
  </section>`;
}
export function roleChoice(progress, art={}) {
  return `${stepIndicator(progress)}<section class="v2-panel" aria-labelledby="screen-title"><span class="v2-eyebrow">第一階段</span>
    <h1 id="screen-title" tabindex="-1">你要扮演哪個角色？</h1>
    <p>每人使用一台平板，依小組分工選擇醫師或病人。角色會沿用到第二階段，不再另外選擇回合。</p>
    <div class="v2-role-grid">${[["doctor","我是醫生","負責口頭問診與紀錄線索"],["patient","我是病人","閱讀病情並回答醫師"]].map(([id,label,desc])=>`<button type="button" class="v2-role-card" data-v2-action="choose-role" data-role="${id}"><img src="${e(art[id]||"")}" alt="" width="220" height="220"><strong>${label}</strong><small>${desc}</small></button>`).join("")}</div>
  </section>`;
}
export function stageHeader(progress) {
  const first=progress.step==="stage1";
  return `${stepIndicator(progress)}<div class="v2-stage-header">
    <div><span class="v2-eyebrow">${first?"第一階段":"第二階段"}・${progress.role==="doctor"?"醫師":"病人"}端</span>
    <p>${first?"體驗僅用有／沒有回答時的資訊限制。":"比較病情說法，找出更清楚的表達方式。"}</p></div>
    ${b(first?"完成第一階段 → 第二階段":"完成第二階段 → 後測","v2-advance",{kind:"primary"})}
  </div>
  <p class="v2-transitional-note">目前為 V2.0 P1 流程整合測試。此處暫沿用 V1.6 練習介面與病例，醫療決策和五項能力題庫將在 P2、P3 更新；前後測選定的疾病不會改變。</p>`;
}
export function finalResult(progress) {
  const bank=getAssessmentBank(progress.caseId);
  const pre=scoreAssessment(bank,"pre",progress.preAnswers);
  const post=scoreAssessment(bank,"post",progress.postAnswers);
  const changes=compareAssessments(pre,post);
  return `${stepIndicator(progress)}<section class="v2-panel v2-result" aria-labelledby="screen-title"><span class="v2-eyebrow">完成學習挑戰</span>
    <h1 id="screen-title" tabindex="-1">我的病情表達，有什麼改變？</h1>
    <p>前後測使用同一種虛構疾病，題目不同但都涵蓋五項能力。以下是情境選擇分數，不等於實際臨床能力。</p>
    <div class="v2-compare" role="table" aria-label="前後測五項能力比較">
      <div role="row" class="v2-compare-head"><span role="columnheader">能力</span><span role="columnheader">前測</span><span role="columnheader">後測</span><span role="columnheader">變化</span></div>
      ${changes.map(d=>`<div role="row"><span role="cell">${e(d.label)}</span><strong role="cell">${d.pre}/4</strong><strong role="cell">${d.post}/4</strong><strong role="cell">${d.change>0?"+":""}${d.change}</strong></div>`).join("")}
    </div>
    <p class="v2-footnote">雷達圖視覺化將在 P5 接入；目前先顯示經驗證的五項比較數值。</p>
    <div class="v2-action-end">${b("重新開始新的挑戰","v2-restart")}</div>
  </section>`;
}
export function restoreErrorPage() {
  return `<section class="v2-panel" aria-labelledby="screen-title"><h1 id="screen-title">學習進度無法讀取</h1><p>這台平板儲存的進度資料可能損壞。系統沒有自動清除，以免覆蓋原資料。</p>
  ${b("確認清除並重新開始","v2-reset-damaged",{kind:"primary"})}</section>`;
}
