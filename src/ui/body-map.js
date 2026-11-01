import { bodyParts } from "../data/cases.js";
import { escapeHtml as e } from "./components.js";

export function bodyMap(view) {
  const notes = view.notes;
  // Pair from head to toe; place a side-of-body anchor on its nearest side.
  const ordered = [...notes].sort(
    (a, b) => bodyParts[a.part].y - bodyParts[b.part].y,
  );
  const positions = new Map();
  for (let index = 0; index < ordered.length; index += 2) {
    const pair = ordered.slice(index, index + 2);
    if (
      pair.length === 2 &&
      bodyParts[pair[1].part].x < bodyParts[pair[0].part].x
    )
      pair.reverse();
    pair.forEach((note, side) =>
      positions.set(note.id, {
        side: side ? "right" : "left",
        row: Math.floor(index / 2) + 1,
      }),
    );
  }
  return `<div class="body-map" >
    <div class="body-figure"><svg viewBox="0 0 240 480" role="img" aria-label="正面人體示意圖，依編號查看身體感受" class="body-svg">
      <defs><linearGradient id="body-fill" x1="0" x2="1"><stop stop-color="#d8e9e6"/><stop offset="1" stop-color="#eaf3f1"/></linearGradient></defs>
      <ellipse cx="120" cy="458" rx="69" ry="9" fill="#dce8e8"/>
      <circle cx="120" cy="58" r="32" fill="url(#body-fill)" stroke="#789e9b" stroke-width="2"/>
      <path d="M105 89v17l-35 14q-11 5-15 20L31 242q-4 17 7 21t17-11l24-83 6 88-8 177q0 14 13 14t15-13l15-135 15 135q2 13 15 13t13-14l-8-177 6-88 24 83q6 15 17 11t7-21l-24-102q-4-15-15-20l-35-14V89" fill="url(#body-fill)" stroke="#789e9b" stroke-width="2" stroke-linejoin="round"/>
      <path d="M104 145q16 8 32 0M120 164v72M101 252h38" fill="none" stroke="#bdd4d1" stroke-width="2" stroke-linecap="round"/>
    </svg><span class="figure-caption">正面示意 · 非解剖圖</span></div>
    <svg class="body-connectors" preserveAspectRatio="none" aria-hidden="true"></svg>
    <div class="body-markers">${notes
      .map((note, index) => {
        const part = bodyParts[note.part];
        // Separate nearby anchors with small horizontal offsets while retaining the body region.
        const offset =
          notes.slice(0, index).filter((item) => item.part === note.part)
            .length * 5;
        return `<button class="body-marker" type="button" data-action="focus-note" data-note="${note.id}" style="--x:${part.x + offset}%;--y:${part.y}%" aria-label="感受 ${index + 1}：${part.name}">${index + 1}</button>`;
      })
      .join("")}</div>
    <div class="body-notes">${notes.map((note, index) => `<article tabindex="-1" id="${note.id}" class="body-note ${positions.get(note.id).side}" style="--row:${positions.get(note.id).row}"><div class="note-meta"><span class="note-number">${index + 1}</span><span>${bodyParts[note.part].name}的感受</span></div><p>${e(note.text)}</p></article>`).join("")}</div>
  </div>`;
}
