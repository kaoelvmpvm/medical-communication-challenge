import "./style.css";
import { stages } from "./stages/index.js";

const icons = {
  listen:
    '<path d="M9 17v-5a7 7 0 0 1 14 0v5M9 14H6v8h5v-8Zm14 0h3v8h-5v-8ZM23 22v2a4 4 0 0 1-4 4h-3"/>',
  ask: '<path d="M27 15a11 11 0 0 1-11 11h-7l-5 3 2-7a11 11 0 1 1 21-7Z"/><path d="M13 11a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01"/>',
  explain:
    '<path d="M5 7h8a5 5 0 0 1 5 5v16a7 7 0 0 0-5-2H5Zm26 0h-8a5 5 0 0 0-5 5v16a7 7 0 0 1 5-2h8Z" transform="translate(-2 0)"/>',
};

const app = document.querySelector("#app");
app.innerHTML = `
  <a class="skip-link" href="#main">跳至主要內容</a>
  <header class="site-header wrap">
    <a class="brand" href="./" aria-label="醫問到底首頁"><span class="brand-mark" aria-hidden="true">＋</span> 醫問到底<span class="brand-dot">！</span></a>
    <nav aria-label="主要導覽"><a href="#journey">挑戰介紹 <span aria-hidden="true">↗</span></a><a href="#about">關於計畫</a></nav>
  </header>
  <main id="main">
    <section class="hero wrap" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="status-dot"></span> 醫病溝通練習計畫 <span class="version">VOL. 01</span></p>
        <h1 id="hero-title">醫問到底！<br><span>病情解碼挑戰</span></h1>
        <p class="hero-description">每一句描述，都藏著重要線索。<br>練習聽懂、問對、說清楚，<br>讓每一次醫病對話，更靠近理解。</p>
        <a class="primary-link" href="#journey">探索三階段挑戰 <span aria-hidden="true">↓</span></a>
        <p class="availability">開發中 · 遊戲關卡尚未開放</p>
      </div>
      <div class="hero-art" role="img" aria-label="以對話框、症狀線索卡和放大鏡呈現病情解碼的概念插圖">
        <div class="art-grid"></div>
        <div class="art-label">COMMUNICATION IS CARE</div>
        <div class="speech speech-question"><span aria-hidden="true">“</span> 哪裡不舒服？<i></i></div>
        <div class="case-card"><div class="case-top"><span>對話線索</span><span aria-hidden="true">＋</span></div><div class="case-line long"></div><div class="case-line"></div><div class="case-pills"><span>症狀</span><span>感受</span><span>疑問</span></div></div>
        <div class="magnifier"><span aria-hidden="true">?</span></div>
        <div class="speech speech-answer">多問一句，多懂一點。</div>
        <div class="art-caption"><span>01 — 03</span><span>讓理解，成為照護的開始。</span></div>
      </div>
    </section>
    <section id="journey" class="journey" aria-labelledby="journey-title">
      <div class="wrap">
        <div class="section-heading"><div><p class="eyebrow">THE JOURNEY / 挑戰路線</p><h2 id="journey-title">三個階段，一步步解碼。</h2></div><p>從聽見線索，到建立共識。<br>每一關，練習一種溝通能力。</p></div>
        <div class="stage-grid">${stages
          .map(
            (stage) => `
          <article class="stage-card" aria-labelledby="${stage.id}-title">
            <div class="stage-top"><span>STAGE ${stage.number}</span><span class="stage-status">尚未開放</span></div>
            <svg class="stage-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[stage.id]}</svg>
            <p class="stage-subtitle">${stage.subtitle}</p><h3 id="${stage.id}-title">${stage.title}</h3>
            <p class="stage-description">${stage.description}</p>
            <div class="stage-bottom"><span>${stage.skill}</span><span aria-hidden="true">↗</span></div>
          </article>`,
          )
          .join("")}
        </div>
      </div>
    </section>
    <section id="about" class="about wrap" aria-labelledby="about-title"><span class="about-symbol" aria-hidden="true">✳</span><div><p class="eyebrow">WHY WE ASK / 為什麼練習</p><h2 id="about-title">好的照護，從好的對話開始。</h2><p>這是一個以醫病溝通為主題的互動學習計畫。透過未來的情境挑戰，練習整理資訊、表達疑問與確認理解，讓對話多一點同理，也多一點清晰。</p></div><span class="about-note">先理解，<br>再一起向前。</span></section>
  </main>
  <footer class="site-footer wrap"><p>醫問到底！——病情解碼挑戰</p><p>本網站為學習用途，不提供醫療診斷或治療建議。</p><a href="#main">回到頂端 ↑</a></footer>
`;
