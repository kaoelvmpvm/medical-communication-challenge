import { stageOneIdentifier } from "./disease-catalog.js";
// V1.6 first-stage *fictional patients*, independent of stages 2–3.
// Complete 20-bit yes/no records describe a specific patient, NOT disease rules.
export const stageOneSymptoms = Object.freeze([
  {
    "id": "well",
    "name": "身體不舒服",
    "question": "你現在有覺得身體不舒服嗎？"
  },
  {
    "id": "daily",
    "name": "影響日常活動",
    "question": "有沒有因為不舒服，影響到平常做的事情？"
  },
  {
    "id": "blocked",
    "name": "鼻塞",
    "question": "你有鼻塞嗎？"
  },
  {
    "id": "runny",
    "name": "流鼻水",
    "question": "你有流鼻水嗎？"
  },
  {
    "id": "cough",
    "name": "咳嗽",
    "question": "你有咳嗽嗎？"
  },
  {
    "id": "nasalThroat",
    "name": "鼻子或喉嚨不舒服",
    "question": "你的鼻子或喉嚨有不舒服嗎？"
  },
  {
    "id": "belly",
    "name": "肚子不舒服",
    "question": "你的肚子有不舒服嗎？"
  },
  {
    "id": "nausea",
    "name": "想吐",
    "question": "你有覺得噁心、想吐嗎？"
  },
  {
    "id": "fever",
    "name": "發燒",
    "question": "你量體溫有到38度或更高嗎？"
  },
  {
    "id": "aches",
    "name": "全身痠痛",
    "question": "你有覺得全身肌肉痠痛嗎？"
  },
  {
    "id": "chills",
    "name": "身體發冷",
    "question": "你有覺得身體發冷嗎？"
  },
  {
    "id": "headache",
    "name": "頭痛",
    "question": "你有頭痛嗎？"
  },
  {
    "id": "fatigue",
    "name": "特別疲倦",
    "question": "你有覺得比平常更累嗎？"
  },
  {
    "id": "sudden",
    "name": "突然變嚴重",
    "question": "你的不舒服有沒有突然變得更嚴重？"
  },
  {
    "id": "stop",
    "name": "難受到要休息",
    "question": "你有沒有難受到必須停下手邊的事情？"
  },
  {
    "id": "repeated",
    "name": "一天內反覆加重",
    "question": "一天之內，有沒有好幾次突然變得更難受？"
  },
  {
    "id": "rapid",
    "name": "短時間內惡化",
    "question": "你有沒有在很短的時間內，從一點點不舒服變得很難受？"
  },
  {
    "id": "threeDays",
    "name": "超過三天",
    "question": "你這樣不舒服已經超過三天了嗎？"
  },
  {
    "id": "sleep",
    "name": "影響睡眠",
    "question": "你有沒有因為不舒服，晚上睡不好？"
  },
  {
    "id": "recurring",
    "name": "好幾天反覆不適",
    "question": "這幾天是不是反覆出現這種不舒服？"
  }
].map(Object.freeze));

const definitions = [
  {
    "id": "cold",
    "disease": "一般感冒",
    "group": "A",
    "positive": [
      "well",
      "daily",
      "blocked",
      "runny",
      "cough",
      "nasalThroat"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "我鼻子塞塞的，一直流鼻水，偶爾咳嗽，鼻子和喉嚨都不太舒服。"
      },
      {
        "part": "stomach",
        "text": "肚子沒有不舒服，也不會反胃想吐。"
      },
      {
        "part": "body",
        "text": "量到的體溫是36.7°C，沒有明顯全身痠痛、發冷或頭痛，精神也沒有比平常特別疲倦。"
      },
      {
        "part": "body",
        "text": "今天剛開始覺得不舒服，情況沒有突然變得很嚴重，一整天也沒有反覆突然加重；還能繼續上課，沒有難受到需要停下所有活動。"
      },
      {
        "part": "body",
        "text": "不舒服還沒有超過三天，晚上睡得還可以，也沒有連續好幾天反覆發作。"
      }
    ]
  },
  {
    "id": "flu",
    "disease": "流行性感冒",
    "group": "A",
    "positive": [
      "well",
      "daily",
      "blocked",
      "runny",
      "cough",
      "nasalThroat",
      "fever",
      "aches",
      "chills",
      "headache",
      "fatigue",
      "sudden",
      "stop",
      "repeated",
      "rapid",
      "threeDays",
      "sleep",
      "recurring"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "鼻子塞住、流鼻水，會咳嗽，鼻子和喉嚨也不舒服。"
      },
      {
        "part": "stomach",
        "text": "肚子沒有不舒服，也沒有想吐。"
      },
      {
        "part": "body",
        "text": "量到最高38.6°C，會肌肉痠痛、發冷、頭痛，而且比平常疲倦很多。"
      },
      {
        "part": "body",
        "text": "今天上課時症狀突然明顯加重，短短一會兒就從輕微變得很難受；今天已好幾次突然加重，最嚴重時得停下活動休息。"
      },
      {
        "part": "body",
        "text": "已經不舒服第四天了，這幾天反覆出現難受的感覺，晚上也常被症狀吵醒。"
      }
    ]
  },
  {
    "id": "covid",
    "disease": "COVID-19",
    "group": "A",
    "positive": [
      "well",
      "daily",
      "blocked",
      "runny",
      "cough",
      "nasalThroat",
      "fever",
      "aches",
      "chills",
      "headache",
      "fatigue",
      "threeDays",
      "sleep",
      "recurring"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "鼻子塞塞的、有流鼻水、會咳嗽，鼻子和喉嚨都不太舒服。"
      },
      {
        "part": "stomach",
        "text": "沒有肚子不舒服，也不會想吐。"
      },
      {
        "part": "body",
        "text": "量到最高38.6°C，會肌肉痠痛、發冷、頭痛，而且比平常疲倦很多。"
      },
      {
        "part": "body",
        "text": "情況是慢慢出現的，沒有在短時間突然加重；今天也沒有幾次突然變得更嚴重，仍能勉強完成平常的活動。"
      },
      {
        "part": "body",
        "text": "不舒服已經第四天，這幾天每天都會反覆不舒服，晚上常因此睡不好。"
      }
    ]
  },
  {
    "id": "allergy",
    "disease": "過敏性鼻炎",
    "group": "A",
    "positive": [
      "well",
      "daily",
      "blocked",
      "runny",
      "cough",
      "nasalThroat",
      "sudden",
      "stop",
      "repeated",
      "rapid"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "鼻子塞住、流鼻水、會咳嗽，鼻子和喉嚨都不舒服，尤其接觸灰塵後更明顯。"
      },
      {
        "part": "stomach",
        "text": "肚子沒有不舒服，也沒有想吐。"
      },
      {
        "part": "body",
        "text": "量到的體溫是36.7°C，沒有明顯全身痠痛、發冷或頭痛，精神也沒有比平常特別疲倦。"
      },
      {
        "part": "body",
        "text": "碰到灰塵時症狀會突然變得很嚴重，今天已好幾次短時間內迅速加重；最難受時會暫時停下活動，離開灰塵多的地方就比較舒服。"
      },
      {
        "part": "body",
        "text": "是這兩天才有的狀況，晚上還算好睡，還沒有連續好幾天反覆發作。"
      }
    ]
  },
  {
    "id": "gastro",
    "disease": "病毒性腸胃炎",
    "group": "B",
    "positive": [
      "well",
      "daily",
      "belly",
      "nausea",
      "fever",
      "aches",
      "chills",
      "headache",
      "fatigue"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "沒有鼻塞、流鼻水或咳嗽，鼻子和喉嚨也沒有特別不舒服。"
      },
      {
        "part": "stomach",
        "text": "肚子一直不舒服，也有反胃想吐的感覺。"
      },
      {
        "part": "body",
        "text": "量到最高38.6°C，會肌肉痠痛、發冷、頭痛，而且比平常疲倦很多。"
      },
      {
        "part": "body",
        "text": "不舒服是逐漸出現的，沒有突然嚴重到得停下手邊的事，也沒有在一天內好幾次突然惡化。"
      },
      {
        "part": "body",
        "text": "是昨天開始不舒服，晚上沒有因此睡不好，也還沒有好幾天反覆發作。"
      }
    ]
  },
  {
    "id": "bacterial_gastro",
    "disease": "細菌性腸胃炎",
    "group": "B",
    "positive": [
      "well",
      "daily",
      "belly",
      "nausea",
      "fever",
      "aches",
      "chills",
      "headache",
      "fatigue",
      "sudden",
      "stop",
      "repeated",
      "rapid"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "鼻子沒有塞，也沒有流鼻水、咳嗽或鼻喉不舒服。"
      },
      {
        "part": "stomach",
        "text": "肚子不舒服，常有反胃想吐的感覺。"
      },
      {
        "part": "body",
        "text": "量到最高38.6°C，會肌肉痠痛、發冷、頭痛，而且比平常疲倦很多。"
      },
      {
        "part": "body",
        "text": "今天早上症狀在很短的時間內明顯變嚴重，今天已幾次突然加重，最不舒服時只能先放下手邊的事休息。"
      },
      {
        "part": "body",
        "text": "是這兩天才開始，晚上目前還可以睡，也沒有跨很多天反覆發作。"
      }
    ]
  },
  {
    "id": "functional_dyspepsia",
    "disease": "功能性消化不良",
    "group": "B",
    "positive": [
      "well",
      "daily",
      "belly",
      "nausea",
      "threeDays",
      "sleep",
      "recurring"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "沒有鼻塞、流鼻水或咳嗽，鼻子和喉嚨沒有不舒服。"
      },
      {
        "part": "stomach",
        "text": "肚子上半部常悶悶脹脹的，吃一點就覺得飽，也常覺得反胃想吐。"
      },
      {
        "part": "body",
        "text": "量到的體溫是36.7°C，沒有明顯全身痠痛、發冷或頭痛，精神也沒有比平常特別疲倦。"
      },
      {
        "part": "body",
        "text": "不舒服是慢慢出現的，沒有突然急速變嚴重，也沒有一天內好幾次突然加重；還能做完平常的事。"
      },
      {
        "part": "body",
        "text": "已經不舒服一段時間，超過三天了，這幾天都會反覆不舒服，有時也影響晚上睡覺。"
      }
    ]
  },
  {
    "id": "gerd",
    "disease": "胃食道逆流",
    "group": "B",
    "positive": [
      "well",
      "daily",
      "belly",
      "nausea",
      "sudden",
      "stop",
      "repeated",
      "rapid",
      "threeDays",
      "sleep",
      "recurring"
    ],
    "notes": [
      {
        "part": "body",
        "text": "最近有身體不舒服的情況，做平常的事比以前費力，已經影響日常活動。"
      },
      {
        "part": "nose",
        "text": "沒有鼻塞、流鼻水或咳嗽，鼻子與喉嚨不會特別不舒服。"
      },
      {
        "part": "stomach",
        "text": "上腹部不舒服，也會反胃，飯後有時感覺酸酸的往喉嚨上來。"
      },
      {
        "part": "body",
        "text": "量到的體溫是36.7°C，沒有明顯全身痠痛、發冷或頭痛，精神也沒有比平常特別疲倦。"
      },
      {
        "part": "body",
        "text": "吃完飯躺下時症狀可能突然加重，今天好幾次在短時間內變得非常難受，最難受時得停下活動。"
      },
      {
        "part": "body",
        "text": "這種不舒服已超過三天，很多天都會反覆發作，晚上躺下也常被不舒服的感覺影響睡眠。"
      }
    ]
  }
];
export const stageOneCases = Object.freeze(definitions.map((entry) => {
  const positives = new Set(entry.positive);
  const evidence = Object.freeze(Object.fromEntries(stageOneSymptoms.map((symptom) => [
    symptom.id, positives.has(symptom.id),
  ])));
  return Object.freeze({
    id: entry.id, disease: entry.disease, group: entry.group,
    diseaseCode: stageOneIdentifier(entry.id).diseaseCode,
    evidence,
    notes: Object.freeze(entry.notes.map((note, i) => Object.freeze({
      ...note, id: `stage1-${entry.id}-${i}`,
    }))),
    profile: Object.freeze({}), context: "",
    applicability: Object.freeze({ period: false }),
  });
}));
