import { diseaseCatalog } from "../data/disease-catalog.js";
import { cases } from "../data/cases.js";
// Portable, non-secret classroom codes. No names, seats or diagnoses are encoded as text.
// This is error detection/obfuscation, not authentication or encryption.
const check = (text) =>
  String(
    [...text].reduce(
      (sum, digit, i) => (sum * 17 + Number(digit) * (i + 3)) % 97,
      0,
    ),
  ).padStart(2, "0");
export function makeCode(caseIndex, stage, round) {
  if (
    !Number.isInteger(caseIndex) ||
    caseIndex < 0 ||
    caseIndex >= diseaseCatalog.length ||
    ![1, 2, 3].includes(stage) ||
    ![1, 2, 3, 4, 5].includes(round)
  )
    throw new Error("病例安排無效");
  let salt = String(
    crypto.getRandomValues(new Uint32Array(1))[0] % 10000000,
  ).padStart(7, "0");
  let encoded;
  if (caseIndex < 6) {
    // Preserve every pre-V1.4 twelve-digit code exactly: legacy indices use modulo six.
    encoded = (caseIndex + (Number(salt) % 6)) % 6;
  } else {
    // Reserved encoded digits 6..9 identify extension cases. Salt parity carries the high bit.
    // Length and checksum stay compatible; four-digit teaching identifiers are never load codes.
    const offset = caseIndex - 6;
    if (offset > 5) throw new Error("病例安排超出載入碼支援範圍。");
    salt =
      String(Math.floor(Number(salt[0]) / 2) * 2 + Math.floor(offset / 4)) +
      salt.slice(1);
    encoded = 6 + (offset % 4);
  }
  const payload = salt + stage + round + encoded;
  return payload + check(payload);
}
export function readCode(value) {
  const code = String(value).replace(/[\s-]/g, "");
  if (!/^\d{12}$/.test(code) || check(code.slice(0, 10)) !== code.slice(10))
    throw new Error("病例碼不正確，請確認教師提供的 12 位數字。");
  const stage = Number(code[7]),
    round = Number(code[8]),
    encoded = Number(code[9]);
  if (
    ![1, 2, 3].includes(stage) ||
    ![1, 2, 3, 4, 5].includes(round) ||
    encoded > 9
  )
    throw new Error("病例碼內容無效。");
  const caseIndex =
    encoded < 6
      ? (encoded - (Number(code.slice(0, 7)) % 6) + 6) % 6
      : 6 + encoded - 6 + (Number(code[0]) % 2) * 4;
  if (caseIndex >= diseaseCatalog.length)
    throw new Error("這份載入碼的病例資料尚未提供。");
  return { code, stage, round, caseIndex };
}
export function createPlan(stage) {
  const order = cases.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order
    .slice(0, 5)
    .map((index, round) => makeCode(index, stage, round + 1));
}
