import { cases } from "../data/cases.js";

export const PATIENT_ROUNDS_KEY = "medical-challenge-stage-one-patient-v1";
const validRound = (round) =>
  Number.isInteger(round) && round >= 1 && round <= 5;

// Reject the incomplete tail of uint32 space instead of introducing modulo bias.
export function drawCaseIndex(
  randomUint32 = () => crypto.getRandomValues(new Uint32Array(1))[0],
) {
  const size = cases.length;
  const limit = Math.floor(2 ** 32 / size) * size;
  let value;
  do {
    value = randomUint32();
    if (!Number.isInteger(value) || value < 0 || value >= 2 ** 32)
      throw new Error("隨機來源無效，尚未開始回合。");
  } while (value >= limit);
  return value % size;
}

// Per-tab persistence prevents refreshes from changing a case. Never store teacher data here.
export function createPatientRounds(storage, draw = drawCaseIndex) {
  function read() {
    const raw = storage.getItem(PATIENT_ROUNDS_KEY);
    if (raw === null) return { version: 1, rounds: {}, activeRound: null };
    let book;
    try {
      book = JSON.parse(raw);
    } catch {
      throw new Error(
        "這個分頁的回合資料無法讀取，為避免更換病例，沒有重新抽取。請保留畫面並請教師協助。",
      );
    }
    if (
      book?.version !== 1 ||
      !book.rounds ||
      typeof book.rounds !== "object" ||
      Array.isArray(book.rounds) ||
      (book.activeRound !== null && !validRound(book.activeRound))
    )
      throw new Error("回合資料無效，沒有重新抽取病例。");
    const rounds = {};
    for (const [key, index] of Object.entries(book.rounds)) {
      if (
        !/^[1-5]$/.test(key) ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= cases.length
      )
        throw new Error("回合病例資料無效，沒有重新抽取病例。");
      rounds[key] = index;
    }
    if (book.activeRound !== null && rounds[book.activeRound] === undefined)
      throw new Error("找不到保留的回合，沒有重新抽取病例。");
    return { version: 1, rounds, activeRound: book.activeRound };
  }
  function save(book) {
    try {
      storage.setItem(PATIENT_ROUNDS_KEY, JSON.stringify(book));
    } catch {
      throw new Error(
        "無法保存這個回合，尚未開始。請開放此分頁的儲存功能後再試，避免重新整理時更換病例。",
      );
    }
  }
  return {
    start(round) {
      if (!validRound(round)) throw new Error("請選擇第一至第五回合。");
      const book = read();
      if (book.rounds[round] === undefined) {
        const index = draw();
        if (!Number.isInteger(index) || index < 0 || index >= cases.length)
          throw new Error("病例抽取失敗，尚未開始回合。");
        book.rounds[round] = index;
      }
      book.activeRound = round;
      save(book); // Persist before exposing the case to the patient.
      return { round, caseIndex: book.rounds[round] };
    },
    resume() {
      const book = read();
      return book.activeRound === null
        ? null
        : { round: book.activeRound, caseIndex: book.rounds[book.activeRound] };
    },
    pause() {
      if (storage.getItem(PATIENT_ROUNDS_KEY) === null) return;
      const book = read();
      book.activeRound = null;
      save(book);
    },
  };
}
