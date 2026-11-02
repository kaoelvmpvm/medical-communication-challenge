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
export function answerOptions(entry, question) {
  if (!questionApplies(question, entry.id)) return [];
  const related = entry.notes.filter((note) =>
    question.parts.includes(note.part),
  );
  const known = question.symptoms.filter(
    (id) => typeof entry.evidence[id] === "boolean",
  );
  const insufficient = question.symptoms.some(
    (id) => entry.evidence[id] === "unknown",
  );
  const hasSource =
    related.length > 0 || known.length > 0 || !!entry.responses?.[question.id];
  let detail =
    entry.responses?.[question.id] ||
    (related.length
      ? related.map((note) => note.text).join(" ")
      : known
          .map((id) => fallbackPhrases[id][entry.evidence[id] ? 0 : 1])
          .join(""));
  if (!hasSource)
    detail =
      "這部分我還沒有注意到，情境也沒有提供，我還不確定，不能直接當作沒有。";
  else if (insufficient && !detail.includes("不確定"))
    detail += " 問題中沒有設定的其他細節，我還不確定。";
  const detailed = {
    id: "detail",
    text: detail,
    quality: "說得恰到好處",
    analysis: hasSource
      ? "具體且切合問題：使用情境已有的感受、位置、時間或變化；沒有設定的資訊，清楚說明不確定。"
      : "具體且切合問題：情境沒有提供這方面的資訊，坦白說不確定，比憑空猜測更適當。",
  };
  // The overlong choice uses another *actual* case note, but avoids the asked
  // anatomical region. No invented symptoms or diagnoses enter the scenario.
  const tangent = entry.notes.find((note) => !question.parts.includes(note.part))?.text;
  const longwinded = [
    "嗯，這個問題讓我想到好多事情，我不知道要先從哪裡開始說。",
    tangent ? `我先想到的是：${tangent}` : "我覺得自己可以先說很多其他事情。",
    "而且每次有人問我身體的感覺，我都會想把各種事情一起講完，因為我覺得有好多東西值得提起。",
    "我還會想到以前自己怎麼描述不舒服、別人通常怎麼問問題，想到很多方向。",
    "所以我想先把這些念頭都說完，再想想你剛才究竟問的是什麼。",
  ].join(" ");
  const options = [
    {
      id: "overlong",
      text: longwinded,
      quality: "說太多但沒用",
      analysis: "雖然說了很多，卻沒有直接回答醫師當下的問題。請挑出相關的身體感受，減少離題內容。",
    },
    detailed,
    {
      id: "brief",
      text: hasSource ? "就是有點不舒服。" : "不知道。",
      quality: "說得太少",
      analysis: hasSource
        ? "內容太少，醫師無法了解身體哪裡、怎麼不舒服，以及時間或變化；可補上已有的具體線索。"
        : "資訊不足時應清楚說出「這個部分還沒注意到，情境沒有提供」，不要只用一句「不知道」帶過。",
    },
  ];
  // Shuffle the 3 positions deterministically for each case–question pair.
  // Never mark the correct category before the student confirms an answer.
  const offset =
    [...(entry.id + question.id)].reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    ) % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}
