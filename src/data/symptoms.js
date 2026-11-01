// The record sheet is intentionally separate from patient narratives.
export const systems = [
  { id: "general", name: "全身", icon: "◎" },
  { id: "head", name: "頭頸", icon: "◉" },
  { id: "airway", name: "呼吸道", icon: "≋" },
  { id: "gut", name: "腸胃", icon: "◈" },
  { id: "urinary", name: "排尿", icon: "◇" },
];
export const symptoms = [
  ["fever", "發燒", "general"],
  ["fatigue", "疲倦", "general"],
  ["aches", "全身痠痛", "general"],
  ["headache", "頭痛", "head"],
  ["oneSide", "單側頭痛", "head"],
  ["light", "怕光", "head"],
  ["throat", "喉嚨痛", "airway"],
  ["runny", "流鼻水", "airway"],
  ["sneeze", "打噴嚏", "airway"],
  ["cough", "咳嗽", "airway"],
  ["itch", "鼻子或眼睛癢", "airway"],
  ["nausea", "噁心", "gut"],
  ["vomit", "嘔吐", "gut"],
  ["diarrhea", "腹瀉", "gut"],
  ["belly", "腹痛", "gut"],
  ["frequent", "頻尿", "urinary"],
  ["burning", "排尿灼熱", "urinary"],
  ["lower", "下腹不適", "urinary"],
].map(([id, name, system]) => Object.freeze({ id, name, system }));
