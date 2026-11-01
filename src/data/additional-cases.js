// C07–C12: user-supplied V1.4 source facts, kept separate from UI and matching logic.
export const additionalCases = [
  {
    id: "viral_conjunctivitis",
    responses: {
      eyes: "兩眼紅紅的、會流眼淚，眼角是透明水樣分泌物，不會明顯癢或怕光，也沒有看不清楚。",
      stomach: "沒有嘔吐、腹瀉或腹痛；目前主要是不舒服的眼睛。",
    },
    profile: {
      severity: 4,
      onset: "昨天早上",
      onsetPattern: "先有右眼不適，隔天左眼也開始出現症狀",
      change: "眼部不適逐漸增加",
      frequency: "眼睛持續有異物感，不時流眼淚",
      aggravating: "沒有觀察到特定加重因素",
      relieving: "輕輕擦掉眼角水樣分泌物後，暫時比較舒服",
      impact: "上課時經常需要擦眼角，影響專注",
      temperature: "36.7°C，已測量",
      history: "沒有印象曾發生過",
    },
    notes: [
      ["eye_right", "昨天早上開始，右眼紅紅的，總覺得像有小沙子卡在裡面。"],
      ["eye_left", "今天早上起床，發現左眼也開始有點紅。"],
      [
        "eyes",
        "眼睛一直流眼淚，眼角有透明、水水的分泌物。早上睫毛附近有一點結痂。",
      ],
      ["eyes", "眼睛沒有明顯發癢，也不怕光，看東西沒有變模糊。"],
      [
        "body",
        "量過體溫是36.7°C，沒有流鼻水、打噴嚏，也沒有嘔吐、腹瀉或腹痛。上課時一直想擦眼角。",
      ],
    ],
    guidance:
      "眼部分泌物為水樣，而非大量濃稠膿性分泌物。不能只憑眼睛紅就判定為病毒性結膜炎。若真實生活發生明顯眼痛、怕光或視力變化，應就醫評估。",
  },
  {
    id: "urticaria",
    responses: {
      throat:
        "嘴唇和舌頭沒有腫，也沒有呼吸困難。其他吞嚥的感受情境沒有提供，我還不確定。",
      skin: "皮膚有一塊塊凸起的紅疹，很癢；有些變淡後其他地方又冒出來，抓了更不舒服。",
    },
    profile: {
      severity: 6,
      onset: "今天上午約十點",
      onsetPattern: "突然出現",
      change: "部分皮疹消退，其他位置又出現新的皮疹",
      frequency: "搔癢反覆持續",
      aggravating: "抓癢後感覺更不舒服",
      relieving: "暫時不抓時，刺激感稍微降低",
      impact: "上課難以專心",
      temperature: "36.6°C，已測量",
      history: "以前偶爾有皮膚癢的經驗，但沒有出現過這麼多凸起的皮疹",
      trigger: "目前不確定，不能自行認定是某種食物引起",
    },
    notes: [
      [
        "arm_left",
        "今天上午突然長出一塊塊凸起的疹子，摸起來比旁邊皮膚高一些。",
      ],
      ["waist", "腰附近也出現類似的疹子，有些地方紅紅的，真的很癢。"],
      ["arm_right", "有些疹子過一段時間就變淡了，其他地方卻又出現新的。"],
      ["skin", "一直想抓，抓完反而覺得更不舒服。鼻子和眼睛倒是不癢。"],
      [
        "body",
        "體溫36.6°C，沒有流鼻水、打噴嚏或想吐。嘴唇和舌頭沒有腫，也沒有呼吸困難。",
      ],
    ],
    guidance:
      "沒有足夠資料判定過敏原。不能直接把蕁麻疹等同於食物過敏。真實情況如果伴隨嘴唇、舌頭、喉嚨腫脹或呼吸困難，應立即尋求緊急醫療協助。",
  },
  {
    id: "gerd",
    responses: {
      stomach:
        "沒有想吐、真正嘔吐、腹部絞痛或腹瀉；吃飽馬上躺下時，胸口那種燒燒的感覺會更明顯。",
      chest:
        "晚餐後胸口會熱熱燒燒的，躺下更明顯，坐著休息會緩解，有時嘴巴會酸酸的。",
    },
    profile: {
      severity: 5,
      onset: "大約三週前開始",
      onsetPattern: "反覆出現",
      change: "最近一週比較頻繁",
      frequency: "每週約三至四天，常發生在晚餐後",
      aggravating: "吃飽後很快躺下",
      relieving: "保持坐姿一段時間，症狀逐漸減輕",
      impact: "晚上有時會不舒服，影響準備睡覺",
      temperature: "36.8°C，已測量",
      history: "最近三週反覆發生，之前沒有特別注意過",
    },
    notes: [
      ["chest", "這三週常常在吃完晚餐後，覺得胸口正中央有熱熱、燒燒的感覺。"],
      [
        "throat",
        "有時候感覺酸酸的東西往上跑，嘴巴裡會出現酸味，但吞口水不會痛。",
      ],
      ["upper_abdomen", "吃飽後如果馬上躺下，胸口那種燒燒的感覺就更明顯。"],
      ["chest", "通常坐著休息一陣子後會慢慢比較舒服，並沒有一直咳嗽。"],
      [
        "body",
        "最近一週大約有三四天會發生。量過體溫36.8°C，沒有想吐、真正嘔吐、腹部絞痛或腹瀉。",
      ],
    ],
    guidance:
      "胸口灼熱與酸水逆流是重要線索，但不能直接排除其他造成胸部不適的疾病。真實生活中的嚴重或不明原因胸痛，不能單純當成胃食道逆流。",
  },
  {
    id: "tension_headache",
    responses: {
      head: "兩邊頭部緊緊悶悶的，像被帶子箍住。每月約四次，一次兩三小時，休息會減輕，不怕光。",
    },
    profile: {
      severity: 4,
      onset: "今天下午三點",
      onsetPattern: "逐漸出現",
      change: "慢慢變明顯，沒有突然劇烈發作",
      frequency: "過去四個月，平均每個月約四天會發生類似頭痛",
      duration: "通常每次約兩至三小時",
      aggravating: "沒有確定的加重因素；正常走路不會讓疼痛明顯增加",
      relieving: "休息後通常逐漸減輕",
      impact: "寫功課速度變慢",
      temperature: "36.6°C，已測量",
      history: "過去四個月反覆出現相似型態",
    },
    notes: [
      ["head_left", "左邊頭部像被什麼東西壓住，悶悶緊緊的。"],
      ["head_right", "右邊也有一樣的感覺，好像整個頭被一條帶子箍住。"],
      [
        "forehead",
        "今天下午三點開始慢慢痛起來，走路時不會變得更痛，也不會因為光線明亮而更不舒服。",
      ],
      [
        "head",
        "這幾個月每個月大約會發生四次，每次通常持續兩三個小時，休息後會逐漸減輕。",
      ],
      [
        "body",
        "沒有發燒、想吐或真正吐出來，也沒有全身肌肉痠痛。但頭痛時寫功課會比較慢。",
      ],
    ],
    guidance:
      "此病例為反覆發作的緊縮型頭痛情境，用來與偏頭痛比較。不得將「雙側頭痛」單獨視為確定診斷依據。真實生活中的突發劇烈頭痛或合併神經功能異常需要立即醫療評估。",
  },
  {
    id: "dysmenorrhea",
    responses: {
      stomach: "月經開始後，下腹會一陣一陣抽痛；沒有噁心、嘔吐或腹瀉。",
      period:
        "月經今天開始後，下腹一陣一陣抽痛，下背也痠；近半年經期前一兩天常發生，熱敷和休息會減輕。",
      bladder: "小便時不會刺痛，也沒有比平常更常想小便。",
    },
    profile: {
      severity: 6,
      onset: "今天早上月經開始後",
      onsetPattern: "逐漸出現下腹部絞痛",
      change: "一陣一陣，疼痛程度會有起伏",
      frequency: "近半年每次月經開始的一至兩天常有類似情況",
      aggravating: "沒有觀察到確定的加重因素",
      relieving: "休息與使用溫熱敷墊時稍微舒服",
      impact: "上課難以專心，不太想活動",
      temperature: "36.7°C，已測量",
      history: "有，近半年每次經期前段常發生",
    },
    notes: [
      [
        "lower_abdomen",
        "今天早上月經開始後，肚子下面慢慢出現一陣一陣抽痛的感覺。",
      ],
      ["lower_back", "腰的下方也痠痠的，坐在教室裡會覺得不太舒服。"],
      [
        "lower_abdomen",
        "這半年每次月經開始的前一兩天，都比較容易有類似的感覺。",
      ],
      [
        "body",
        "量過體溫36.7°C，沒有頭痛、噁心、嘔吐或腹瀉，小便時也不會刺痛。",
      ],
      [
        "lower_abdomen",
        "休息或用溫熱敷墊會舒服一點，但今天還是痛到很難專心上課；沒有比平常更常想小便。",
      ],
    ],
    guidance:
      "本情境明確設定有月經經驗，經期問題適用；不設定性別稱謂或性別認同，不詢問性經驗、懷孕等與本課無關的私密資訊。「經痛」為教學預設答案，不確診為原發性經痛。真實生活中經痛嚴重、逐漸惡化或影響日常活動，應由醫療專業人員評估。",
  },
  {
    id: "otitis_media",
    responses: {
      head: "沒有明顯頭痛。光線或其他頭部感受沒有設定，我還不確定。",
      body: "今天早上量體溫是38.1°C，昨晚右耳痛睡不好，今天上課比較難聽清楚。精神或全身痠痛的其他細節沒有設定，我還不確定。",
      ears: "右耳從昨天晚上開始一陣一陣痛，聽聲音悶悶的，睡不好，上課也比較難聽清楚，沒有看到流液體。",
    },
    profile: {
      severity: 6,
      onset: "昨天晚上",
      onsetPattern: "逐漸出現耳內疼痛",
      change: "昨天晚上開始，到今天仍持續",
      frequency: "右耳疼痛反覆出現，聽聲音持續感覺悶悶的",
      aggravating: "沒有觀察到確定的加重因素",
      relieving: "沒有發現明顯有效的緩解方式",
      impact: "昨天晚上睡不好，今天聽課比較吃力",
      temperature: "38.1°C，已測量",
      history: "沒有印象曾出現相同情況",
      related: "前三天曾有鼻塞與流鼻水",
    },
    notes: [
      [
        "ear_right",
        "昨天晚上開始，右邊耳朵裡面一陣一陣地痛，睡覺時也覺得不舒服。",
      ],
      ["ear_right", "別人講話的聲音好像隔著一層東西，右耳聽起來悶悶的。"],
      ["forehead", "今天早上量體溫是38.1°C。"],
      [
        "nose",
        "前三天曾經鼻塞、流很多鼻水，現在還有一點鼻水，但已經比之前少。",
      ],
      [
        "body",
        "昨天晚上睡得不太好，今天上課比較難聽清楚。沒有明顯頭痛、喉嚨痛或咳嗽，也沒有看到耳朵流出液體。",
      ],
    ],
    guidance:
      "不能以耳朵痛就確定為急性中耳炎。真正診斷仍需醫師檢查耳膜與中耳情況。",
  },
];

// Column order: C07, C08, C09, C10, C11, C12. Every ? and — is explicit source data.
const matrix = {
  fever: "NNNNNY",
  fatigue: "??????",
  aches: "???N??",
  headache: "???YNN",
  oneSide: "???N??",
  light: "N??N??",
  throat: "??N??N",
  runny: "NN???Y",
  sneeze: "NN????",
  cough: "??N??N",
  itch: "NN????",
  nausea: "?NNNN?",
  vomit: "N?NNN?",
  diarrhea: "N?N?N?",
  belly: "N?N?Y?",
  frequent: "????N?",
  burning: "????N?",
  lower: "????Y?",
  redEye: "YN????",
  eyeDischarge: "Y?????",
  wheals: "?Y????",
  skinItch: "?Y????",
  heartburn: "??Y???",
  sourTaste: "??Y???",
  earPain: "?????Y",
  muffledHearing: "?????Y",
  bilateralPressure: "???Y??",
  periodCramps: "----Y-",
};
const states = { Y: true, N: false, "?": "unknown", "-": "not_applicable" };
export function additionalEvidence(index, symptoms) {
  return Object.fromEntries(
    symptoms.map(({ id }) => {
      const symbol = matrix[id]?.[index];
      if (!(symbol in states)) throw new Error(`病例判定表缺少 ${id}`);
      return [id, states[symbol]];
    }),
  );
}
