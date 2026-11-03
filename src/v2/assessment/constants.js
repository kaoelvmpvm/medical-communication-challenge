// V2 assessment: learner-facing names are the approved P0 labels.
export const AXES = Object.freeze([
  Object.freeze({ id: "symptoms", label: "哪裡不舒服" }),
  Object.freeze({ id: "timing", label: "何時開始" }),
  Object.freeze({ id: "allergies", label: "過敏情況" }),
  Object.freeze({ id: "medications", label: "吃過什麼藥" }),
  Object.freeze({ id: "needs", label: "自己的需求" }),
]);
export const PHASES = Object.freeze(["pre", "post"]);
export const CHOICE_SCORES = Object.freeze([-1, 0, 1, 2]);
export const QUESTIONS_PER_PHASE = 10;
export const QUESTIONS_PER_AXIS = 2;
export const OPTIONS_PER_QUESTION = 4;
export const CASE_CATALOG = Object.freeze([
  Object.freeze({ id: "cold", title: "一般感冒", image: "cold.webp", status: "approved" }),
  Object.freeze({ id: "allergy", title: "過敏性鼻炎", image: "allergy.webp", status: "approved" }),
  Object.freeze({ id: "gastro", title: "急性腸胃炎", image: "gastro.webp", status: "approved" }),
  Object.freeze({ id: "tension_headache", title: "緊縮型頭痛", image: "tension_headache.webp", status: "approved" }),
]);
