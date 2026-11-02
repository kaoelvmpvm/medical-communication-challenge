// Shared oral questions. Period questions are conditional in the patient picker, never a forced answer.
export const questions = [
  {
    id: "body",
    title: "這幾天的體溫和精神怎麼樣？身體有痠痛嗎？",
    parts: ["body"],
    symptoms: ["fever", "fatigue", "aches"],
    group: "全身感受",
  },
  {
    id: "head",
    title: "頭部有不舒服嗎？在哪裡？光線會影響嗎？",
    parts: ["head", "head_left", "head_right", "forehead"],
    symptoms: ["headache", "oneSide", "light", "bilateralPressure"],
    group: "頭部感受",
  },
  {
    id: "nose",
    title: "鼻子或眼睛有什麼和平常不一樣的感覺？",
    parts: ["nose", "eyes", "eye_left", "eye_right"],
    symptoms: ["runny", "sneeze", "itch", "redEye"],
    group: "鼻眼感受",
  },
  {
    id: "throat",
    title: "吞東西或呼吸時，有哪些不舒服的地方？",
    parts: ["throat", "chest"],
    symptoms: ["throat", "cough"],
    group: "喉部與呼吸",
  },
  {
    id: "stomach",
    title: "肚子或胃有什麼不舒服？吃東西和大便的情況呢？",
    parts: ["stomach", "upper_abdomen", "lower_abdomen"],
    symptoms: ["nausea", "vomit", "diarrhea", "belly", "lower"],
    group: "腸胃感受",
  },
  {
    id: "bladder",
    title: "上廁所小便的次數和感覺，跟平常有什麼不同？",
    parts: ["bladder"],
    symptoms: ["frequent", "burning"],
    group: "排尿感受",
  },
  {
    id: "eyes",
    title: "眼睛有哪些不舒服？有沒有分泌物，或看不清楚？",
    parts: ["eyes", "eye_left", "eye_right"],
    symptoms: ["redEye", "eyeDischarge", "light", "itch"],
    group: "眼睛感受",
  },
  {
    id: "skin",
    title: "皮膚有什麼變化？會癢嗎？疹子會怎麼改變？",
    parts: ["skin", "arm_left", "arm_right", "waist"],
    symptoms: ["wheals", "skinItch"],
    group: "皮膚感受",
  },
  {
    id: "ears",
    title: "耳朵有什麼感覺？聽聲音跟平常有什麼不同？",
    parts: ["ear_left", "ear_right"],
    symptoms: ["earPain", "muffledHearing"],
    group: "耳朵感受",
  },
  {
    id: "chest",
    title: "胸口不舒服是什麼感覺？和吃飯、躺下或嘴裡的味道有關嗎？",
    parts: ["chest", "throat", "upper_abdomen"],
    symptoms: ["heartburn", "sourTaste"],
    group: "胸口感受",
  },
  {
    id: "period",
    title: "若情境適用：不舒服的時間和月經有關係嗎？月經來的時候，哪裡不舒服？",
    parts: ["lower_abdomen", "lower_back"],
    symptoms: ["periodCramps"],
    applicableCaseIds: ["dysmenorrhea"],
    group: "經期相關（條件式）",
  },
];
export const questionApplies = (question, id) =>
  !question.applicableCaseIds || question.applicableCaseIds.includes(id);
export const questionsForCase = (id) =>
  questions.filter((question) => questionApplies(question, id));
const fallbackPhrases = {
  fever: ["量體溫有升高的情況。", "量過體溫，沒有升高的情況。"],
  fatigue: ["感覺比較沒精神或沒力氣。", "精神跟平常差不多。"],
  aches: ["全身有痠痛的感覺。", "沒有全身痠痛。"],
  headache: ["頭部有疼痛。", "沒有明顯頭痛。"],
  oneSide: ["只有一側頭部在痛。", "不是只有一側頭部痛。"],
  light: ["光線明亮時更不舒服。", "沒有怕光。"],
  throat: ["吞口水會痛。", "喉嚨沒有痛。"],
  runny: ["有流鼻水。", "沒有流鼻水。"],
  sneeze: ["有一直打噴嚏。", "沒有一直打噴嚏。"],
  cough: ["有咳嗽。", "沒有明顯咳嗽。"],
  itch: ["鼻子或眼睛會癢。", "鼻子和眼睛沒有明顯癢。"],
  nausea: ["有想吐的感覺。", "沒有想吐。"],
  vomit: ["有真的吐出來。", "沒有真的吐出來。"],
  diarrhea: ["有拉肚子。", "沒有拉肚子。"],
  belly: ["有肚子痛。", "沒有腹部絞痛。"],
  lower: ["肚子下面不舒服。", "沒有下腹不適。"],
  frequent: ["剛上完廁所又很想去。", "沒有比平常更常想小便。"],
  burning: ["小便時熱熱刺刺的。", "小便時不會刺痛。"],
  redEye: ["眼睛紅紅的。", "眼睛沒有紅。"],
  eyeDischarge: ["眼角的分泌物變多了。", "眼部分泌物沒有增加。"],
  wheals: ["皮膚有一塊塊凸起的紅疹。", "沒有凸起的紅疹。"],
  skinItch: ["皮膚會癢。", "皮膚不癢。"],
  heartburn: ["胸口熱熱燒燒的。", "沒有胸口灼熱的感覺。"],
  sourTaste: [
    "嘴巴裡會酸酸的，好像有酸的東西往上跑。",
    "沒有酸味或酸水往上跑。",
  ],
  earPain: ["耳朵裡面會痛。", "耳朵不會痛。"],
  muffledHearing: ["聽聲音悶悶的。", "聽聲音和平常一樣。"],
  bilateralPressure: [
    "兩邊頭部像被帶子箍住，緊緊悶悶的。",
    "沒有雙側壓迫的頭痛。",
  ],
  periodCramps: ["月經開始後下腹一陣一陣絞痛。", "沒有經期相關的腹部絞痛。"],
};
// Keep every candidate grounded in a fictional patient’s recorded facts. In
// particular, missing information is not evidence that a symptom is absent.
function shortClue(text, maxLength = 48) {
  const parts = String(text).trim().match(/[^，。；！？]+[，。；！？]?/gu) || [];
  let result = "";
  for (const part of parts) {
    if (result && result.length + part.length > maxLength) break;
    result += part;
  }
  return (result || String(text)).trim().replace(/[，。；！？\s]+$/u, "");
}

export function answerOptions(entry, question) {
  if (!questionApplies(question, entry.id)) return [];
  const related = entry.notes.filter((note) => question.parts.includes(note.part));
  const known = question.symptoms.filter((id) =>
    typeof entry.evidence[id] === "boolean",
  );
  const insufficient = question.symptoms.some((id) =>
    entry.evidence[id] === "unknown",
  );
  const hasSource = related.length > 0 || known.length > 0 ||
    Boolean(entry.responses?.[question.id]);
  const relevantFacts = entry.responses?.[question.id] ||
    (related.length
      ? related.map((note) => note.text).join(" ")
      : known.map((id) => fallbackPhrases[id][entry.evidence[id] ? 0 : 1]).join(""));
  let detail = hasSource
    ? shortClue(relevantFacts, 100).replace(/([^。！？])$/u, "$1。")
    : "這方面我還沒留意，現在不能確定有沒有，我可以再觀察一下。";
  if (insufficient && hasSource && !detail.includes("不確定"))
    detail += " 其他沒有注意到的部分，我還不確定。";
  // In the unasked ear domain of the conjunctivitis case, do not turn a
  // missing observation into a definite negative.
  if (entry.id === "viral_conjunctivitis" && question.id === "ears")
    detail = "耳朵有沒有疼痛或聽聲音悶悶的，我目前沒有注意到，所以還不確定。";
  if (detail.length < 23)
    detail = detail.replace(/。$/u, "") +
      "；其他沒有留意到的部分，我現在還不確定。";

  // Partial disclosure: it answers *some* of the question but leaves out
  // the differentiating details, unlike a one-word obviously-wrong choice.
  const briefSeed = hasSource
    ? shortClue(relevantFacts, 24)
    : "這方面我還沒特別注意";
  const style = [...(entry.id + question.id)].reduce(
    (sum, char) => sum + char.charCodeAt(0), 0,
  ) % 3;
  const briefEndings = [
    "，其他的部分我沒有仔細想過。",
    "，更詳細的感覺我一時說不清楚。",
    "，其他細節我還沒特別留意。",
  ];
  const brief = `${briefSeed}${briefEndings[style]}`;

  // Over-explaining: retains a real clue, then adds another *true* but
  // question-irrelevant observation. It is plausible speech rather than a
  // lengthy monologue about why the patient is describing their symptoms.
  const tangent = entry.notes.find((note) =>
    !question.parts.includes(note.part),
  )?.text;
  const relatedSeed = shortClue(
    related[0]?.text || relevantFacts || "這個部分我沒有特別注意",
    33,
  );
  const sideways = tangent ? shortClue(tangent, 43) :
    "最近幾天我一直在注意身體哪裡不舒服";
  const longwinded = [
    `${relatedSeed}。另外，${sideways}，我也不確定是不是有關係。`,
    `我比較記得${sideways}。至於你剛問的，${relatedSeed}，但不知道這些是不是一起發生的。`,
    `${relatedSeed}。還有${sideways}，我不太確定該先說哪一個。`,
  ][style];
  const options = [
    {
      id: "overlong",
      text: longwinded,
      quality: "說太多但沒用",
      analysis: "這個說法有提到部分真實線索，但又帶入醫師沒有問的其他感受，重要資訊反而不容易找到。試著先回答這一題，再補充必要細節。",
    },
    {
      id: "detail",
      text: detail,
      quality: "說得恰到好處",
      analysis: hasSource
        ? "回答直接對應醫師的問題，也說出具體可用的感受或變化；沒有注意到的細節應保留不確定，不必猜測。"
        : "沒有留意的資訊，清楚說明尚不確定，並願意再觀察；比含糊帶過或自行推測更能幫助醫師了解狀況。",
    },
    {
      id: "brief",
      text: brief,
      quality: "說得太少",
      analysis: "這不是完全沒回答，但只提到一小部分，醫師還不清楚症狀的特徵、位置或變化。再補一兩個與問題直接相關的細節會更有幫助。",
    },
  ];
  // Vary positions without varying facts or leaking the answer category.
  const offset = [...(entry.id + question.id)].reduce(
    (sum, char) => sum + char.charCodeAt(0), 0,
  ) % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}
