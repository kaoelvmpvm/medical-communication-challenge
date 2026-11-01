import { escapeHtml as e } from "./components.js";
export const artPlaceholder =
  '<div class="art-placeholder" role="img" aria-label="劇情圖片"><span aria-hidden="true">▧</span><span>劇情圖片</span></div>';
export function caseArt(url = null) {
  const image = url
    ? `<img src="${e(url)}" alt="模擬病例的情境插畫" width="800" height="1000" decoding="async">`
    : artPlaceholder;
  return `<aside class="panel case-art" aria-label="病例情境美術圖"><h2>這一回合的情境</h2><div class="case-art-frame">${image}</div></aside>`;
}
