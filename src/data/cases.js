import { additionalCases, additionalEvidence } from "./additional-cases.js";
import { diseaseIdentifier } from "./disease-catalog.js";
import { symptoms } from "./symptoms.js";

export const bodyParts = Object.freeze({
  head: { name: "頭部", x: 50, y: 12 },
  head_left: { name: "左側頭部", x: 60, y: 12 },
  head_right: { name: "右側頭部", x: 40, y: 12 },
  forehead: { name: "額頭", x: 50, y: 9 },
  eye_right: { name: "右眼", x: 44, y: 14 },
  eye_left: { name: "左眼", x: 56, y: 14 },
  eyes: { name: "眼睛", x: 50, y: 14 },
  ear_right: { name: "右耳", x: 36, y: 14 },
  ear_left: { name: "左耳", x: 64, y: 14 },
  arm_left: { name: "左手臂", x: 75, y: 42 },
  arm_right: { name: "右手臂", x: 25, y: 42 },
  skin: { name: "皮膚", x: 75, y: 42 },
  waist: { name: "腰部", x: 35, y: 52 },
  upper_abdomen: { name: "上腹", x: 50, y: 43 },
  lower_abdomen: { name: "下腹", x: 50, y: 60 },
  lower_back: { name: "下背（背側投影）", x: 36, y: 57 },
  nose: { name: "鼻眼", x: 50, y: 14.5 },
  throat: { name: "喉部", x: 50, y: 26 },
  chest: { name: "胸口", x: 50, y: 38 },
  body: { name: "全身", x: 25, y: 42 },
  stomach: { name: "腹部", x: 50, y: 48 },
  bladder: { name: "下腹", x: 50, y: 60 },
});

// Fictional learning examples, not clinical diagnostic criteria or real patient data.
// No pre-existing cases were present in the V1 scaffold.
const definitions = [
  {
    id: "cold",
    disease: "一般感冒",
    positive: ["fatigue", "throat", "runny", "sneeze", "cough"],
    notes: [
      ["nose", "鼻水一直流，今天帶的衛生紙快用完了，也常常哈啾。"],
      ["throat", "吞口水的時候感覺刺刺的。"],
      ["chest", "說話說到一半，常會忍不住咳幾聲。"],
      ["body", "今天有點沒精神。量過體溫是 36.8°C，身體沒有特別痠痛。"],
    ],
  },
  {
    id: "flu",
    disease: "流行性感冒",
    positive: ["fever", "fatigue", "aches", "headache", "throat", "cough"],
    notes: [
      ["head", "從昨天開始整個頭悶悶地痛，不是只有一邊。"],
      ["throat", "吞東西會刺痛，喝水也覺得不太舒服。"],
      ["chest", "一直乾咳，沒有什麼鼻水，也不太會打噴嚏。"],
      ["body", "昨晚量體溫是 39.1°C，全身痠得像跑完很長的路，只想躺著。"],
    ],
  },
  {
    id: "allergy",
    disease: "過敏性鼻炎",
    positive: ["runny", "sneeze", "itch"],
    notes: [
      ["nose", "鼻子跟眼睛好癢，早上連打好幾個噴嚏，鼻水透明又像水一樣。"],
      ["throat", "吞東西不會痛，也沒有咳。"],
      ["body", "量體溫是 36.6°C，精神跟平常一樣，身體沒有痠痛。"],
    ],
  },
  {
    id: "gastro",
    disease: "急性腸胃炎",
    positive: ["fatigue", "nausea", "vomit", "diarrhea", "belly"],
    notes: [
      ["stomach", "肚臍附近一陣一陣絞著痛，今天已經跑了四次廁所，都是水水的。"],
      ["throat", "一直反胃，早上吃的東西剛剛都吐出來了。"],
      ["body", "感覺整個人沒什麼力氣。量體溫是 36.9°C，沒有全身痠痛。"],
      ["bladder", "小便跟平常差不多，不會痛，也沒有一直想去。"],
    ],
  },
  {
    id: "migraine",
    disease: "偏頭痛",
    positive: ["headache", "oneSide", "light", "nausea"],
    notes: [
      [
        "head",
        "頭的右邊一跳一跳地痛，教室的燈亮起來會更難受，想待在暗一點的地方。",
      ],
      ["stomach", "胃裡翻翻的，很想吐，但還沒有真的吐，也沒有拉肚子。"],
      ["body", "量體溫是 36.7°C，沒有全身痠痛，也沒有特別沒力氣。"],
    ],
  },
  {
    id: "uti",
    disease: "下泌尿道感染",
    positive: ["frequent", "burning", "lower"],
    notes: [
      [
        "bladder",
        "才剛上完廁所，又很想去；每次只有一點點，小便的時候熱熱刺刺的。",
      ],
      ["stomach", "肚子最下面悶悶脹脹的，不是肚臍附近絞著痛。"],
      ["body", "量體溫是 36.8°C，精神跟平常差不多，也沒有全身痠痛。"],
    ],
  },
];

const explicitNegatives = {
  cold: ["fever", "aches"],
  flu: ["oneSide"],
  allergy: ["fever", "fatigue", "aches", "throat", "cough"],
  gastro: ["fever", "aches", "frequent", "burning"],
  migraine: ["fever", "fatigue", "aches", "vomit", "diarrhea"],
  uti: ["fever", "fatigue", "aches"],
};
function buildCase(entry, evidence) {
  const identifier = diseaseIdentifier(entry.id);
  return Object.freeze({
    id: entry.id,
    disease: identifier.disease,
    caseNumber: identifier.caseNumber,
    diseaseCode: identifier.diseaseCode,
    evidence: Object.freeze(evidence),
    notes: Object.freeze(
      entry.notes.map(([part, text], index) =>
        Object.freeze({ id: `${entry.id}-${index}`, part, text }),
      ),
    ),
    profile: Object.freeze(entry.profile || {}),
    responses: Object.freeze(entry.responses || {}),
    guidance: entry.guidance || "",
    applicability: Object.freeze({ period: entry.id === "dysmenorrhea" }),
    context:
      "這是固定的模擬情境。未提及或不適用的資訊，不等於確定沒有症狀，也不代表真實醫療判斷。",
  });
}
export const cases = [
  ...definitions.map((entry) =>
    buildCase(
      entry,
      Object.fromEntries(
        symptoms.map(({ id }) => [
          id,
          entry.positive.includes(id)
            ? true
            : explicitNegatives[entry.id].includes(id)
              ? false
              : id === "periodCramps"
                ? "not_applicable"
                : "unknown",
        ]),
      ),
    ),
  ),
  ...additionalCases.map((entry, index) =>
    buildCase(entry, additionalEvidence(index, symptoms)),
  ),
];

// Only this safe projection is passed to the patient renderer.
export function patientView(entry) {
  return {
    notes: entry.notes,
    context: entry.context,
    diseaseCode: entry.diseaseCode,
    artId: entry.id,
    profile: entry.profile,
    applicability: entry.applicability,
  };
}
