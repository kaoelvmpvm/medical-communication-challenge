import { escapeHtml as e } from "./components.js";
export const artPlaceholder =
  '<div class="art-placeholder" role="img" aria-label="病例情境美術圖預留"><span aria-hidden="true">▧</span><span>劇情圖片</span></div>';
export function caseArt(url = null) {
  const image = url
    ? `<img src="${e(url)}" alt="模擬病例的情境插畫" loading="lazy">`
    : artPlaceholder;
  return `<aside class="panel case-art" aria-label="病例情境美術圖"><h2>病例情境美術圖</h2><div class="case-art-frame">${image}</div><p>情境插畫預留區。請以人體圖與感受文字整理病情。</p></aside>`;
}
