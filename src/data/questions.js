// General questions are offered in stage 2 only. Never recommended or ranked.
export const questions = [
  {
    id: "body",
    title: "這幾天的體溫和精神怎麼樣？身體有痠痛嗎？",
    parts: ["body"],
    group: "全身感受",
  },
  {
    id: "head",
    title: "頭部有不舒服嗎？在哪裡？光線會影響嗎？",
    parts: ["head"],
    group: "頭部感受",
  },
  {
    id: "nose",
    title: "鼻子或眼睛有什麼和平常不一樣的感覺？",
    parts: ["nose"],
    group: "鼻眼感受",
  },
  {
    id: "throat",
    title: "吞東西或呼吸時，有哪些不舒服的地方？",
    parts: ["throat", "chest"],
    group: "喉部與呼吸",
  },
  {
    id: "stomach",
    title: "肚子或胃有什麼不舒服？吃東西和大便的情況呢？",
    parts: ["stomach"],
    group: "腸胃感受",
  },
  {
    id: "bladder",
    title: "上廁所小便的次數和感覺，跟平常有什麼不同？",
    parts: ["bladder"],
    group: "排尿感受",
  },
];

export function answerOptions(view, question) {
  const related = view.notes.filter((note) =>
    question.parts.includes(note.part),
  );
  const detail = related.length
    ? related.map((note) => note.text).join(" ")
    : "你問的這個部位，目前沒有特別不舒服的感覺。";
  return [
    {
      id: "vague",
      text: "就是不太舒服，我也不知道怎麼說。",
      quality: "可以再具體一點",
      analysis:
        "只說不舒服，對方還不知道位置、時間或感覺。試著補上一個具體細節。",
    },
    {
      id: "detail",
      text: detail,
      quality: "具體且切合問題",
      analysis:
        "這個回答描述了被問到的身體感受。說出位置、感覺、次數或實際測量，能讓對方更容易理解。",
    },
    {
      id: "guess",
      text: "我想大概是生病了，你直接告訴我怎麼辦吧。",
      quality: "先描述，再一起討論",
      analysis: "先說出實際感受，能幫助醫師釐清資訊；不用急著猜原因。",
    },
    {
      id: "brief",
      text: related.length ? "這個地方跟平常感覺不太一樣。" : "還好。",
      quality: "方向正確，可以補充",
      analysis:
        "回答有回應問題，但還能說明哪裡、怎麼不舒服，或清楚說目前沒有異常感受。",
    },
  ];
}
