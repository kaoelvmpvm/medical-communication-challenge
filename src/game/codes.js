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
    caseIndex > 5 ||
    ![1, 2, 3].includes(stage) ||
    ![1, 2, 3, 4, 5].includes(round)
  )
    throw new Error("病例安排無效");
  const salt = String(
    crypto.getRandomValues(new Uint32Array(1))[0] % 10000000,
  ).padStart(7, "0");
  const payload = salt + stage + round + ((caseIndex + (Number(salt) % 6)) % 6);
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
    encoded > 5
  )
    throw new Error("病例碼內容無效。");
  return {
    code,
    stage,
    round,
    caseIndex: (encoded - (Number(code.slice(0, 7)) % 6) + 6) % 6,
  };
}
export function createPlan(stage) {
  const order = [0, 1, 2, 3, 4, 5];
  for (let i = 5; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order
    .slice(0, 5)
    .map((index, round) => makeCode(index, stage, round + 1));
}
