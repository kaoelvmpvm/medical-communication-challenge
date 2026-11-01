import { createPlan, readCode } from "../game/codes.js";
export const emptyBook = () => ({ version: 1, classes: [] });
const id = () => crypto.randomUUID();
const integer = (n, min, max) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
export function addClass(book, name) {
  name = String(name).trim();
  if (!name || name.length > 30) throw new Error("班級名稱需為 1 至 30 字。");
  if (book.classes.some((item) => item.name === name))
    throw new Error("這個班級已存在，請直接切換班級。");
  const entry = { id: id(), name, groups: [] };
  book.classes.push(entry);
  return entry.id;
}
export function saveGroup(entry, groupId, number, seats) {
  number = Number(number);
  seats = seats.map((value) => String(Number(value)));
  if (
    !integer(number, 1, 999) ||
    entry.groups.some(
      (group) => group.number === number && group.id !== groupId,
    )
  )
    throw new Error("組別編號需為不重複的 1 至 999 整數。");
  if (
    seats.length !== 5 ||
    seats.some(
      (seat) => !/^\d+$/.test(seat) || !integer(Number(seat), 1, 999),
    ) ||
    new Set(seats).size !== 5
  )
    throw new Error("請輸入五個不重複的座號（1 至 999）。");
  if (
    entry.groups.some(
      (group) =>
        group.id !== groupId &&
        group.seats.some((seat) => seats.includes(seat)),
    )
  )
    throw new Error("這個班級有座號已分配到其他組別，請先修正。");
  const group = entry.groups.find((item) => item.id === groupId);
  if (groupId && !group) throw new Error("找不到組別。");
  if (group) {
    group.number = number;
    group.seats = seats;
  } else
    entry.groups.push({
      id: id(),
      number,
      seats,
      scores: {
        1: { questions: 0, completed: 0 },
        2: { questions: 0, completed: 0 },
      },
      plans: { 1: createPlan(1), 2: createPlan(2), 3: createPlan(3) },
    });
}
export function adjust(group, stage, field, delta) {
  if (
    ![1, 2].includes(stage) ||
    !["questions", "completed"].includes(field) ||
    ![-1, 1].includes(delta)
  )
    throw new Error("無效的計分操作。");
  const score = group.scores[stage];
  const next = Math.max(
    0,
    Math.min(
      field === "completed" ? 5 : Number.MAX_SAFE_INTEGER,
      score[field] + delta,
    ),
  );
  if (score[field] === next) return false;
  score[field] = next;
  return true;
}
export function rankings(groups, stage) {
  if (![1, 2].includes(stage)) throw new Error("第三階段不計分。");
  const sorted = [...groups].sort((a, b) => {
    const x = a.scores[stage],
      y = b.scores[stage];
    return (
      (y.completed === 5) - (x.completed === 5) ||
      y.completed - x.completed ||
      x.questions - y.questions ||
      a.number - b.number
    );
  });
  let previous = null,
    rank = 0;
  return sorted.map((group, index) => {
    const score = group.scores[stage];
    if (score.completed !== 5) return { group, rank: null };
    if (previous !== score.questions) rank = index + 1;
    previous = score.questions;
    return { group, rank };
  });
}
// Reconstruct a whitelisted schema. Never apply partial/invalid imports.
export function validateBook(value) {
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.classes) ||
    value.classes.length > 100
  )
    throw new Error("不支援的備份格式。");
  const seenClasses = new Set(),
    seenIds = new Set();
  function safeId(value) {
    if (
      typeof value !== "string" ||
      !/^[\w-]{1,80}$/.test(value) ||
      seenIds.has(value)
    )
      throw new Error("備份識別碼重複或無效。");
    seenIds.add(value);
    return value;
  }
  return {
    version: 1,
    classes: value.classes.map((entry) => {
      if (
        typeof entry.name !== "string" ||
        !entry.name.trim() ||
        entry.name.length > 30 ||
        seenClasses.has(entry.name.trim()) ||
        !Array.isArray(entry.groups) ||
        entry.groups.length > 100
      )
        throw new Error("班級資料無效或重複。");
      seenClasses.add(entry.name.trim());
      const numbers = new Set(),
        seats = new Set();
      return {
        id: safeId(entry.id),
        name: entry.name.trim(),
        groups: entry.groups.map((group) => {
          if (
            !integer(group.number, 1, 999) ||
            numbers.has(group.number) ||
            !Array.isArray(group.seats) ||
            group.seats.length !== 5
          )
            throw new Error("組別資料無效或重複。");
          numbers.add(group.number);
          const members = group.seats.map((seat) => {
            if (
              typeof seat !== "string" ||
              !/^[1-9]\d{0,2}$/.test(seat) ||
              seats.has(seat)
            )
              throw new Error("備份座號無效或重複分配。");
            seats.add(seat);
            return seat;
          });
          const scores = {};
          for (const stage of [1, 2]) {
            const score = group.scores?.[stage];
            if (
              !score ||
              !integer(score.questions, 0, Number.MAX_SAFE_INTEGER) ||
              !integer(score.completed, 0, 5)
            )
              throw new Error("備份成績範圍不正確。");
            scores[stage] = {
              questions: score.questions,
              completed: score.completed,
            };
          }
          const plans = {};
          for (const stage of [1, 2, 3]) {
            const plan = group.plans?.[stage];
            if (!Array.isArray(plan) || plan.length !== 5)
              throw new Error("每階段需有五份病例安排。");
            const indices = new Set();
            plans[stage] = plan.map((code, index) => {
              const decoded = readCode(code);
              if (
                decoded.stage !== stage ||
                decoded.round !== index + 1 ||
                indices.has(decoded.caseIndex)
              )
                throw new Error("病例安排重複或階段／回合不正確。");
              indices.add(decoded.caseIndex);
              return decoded.code;
            });
          }
          return {
            id: safeId(group.id),
            number: group.number,
            seats: members,
            scores,
            plans,
          };
        }),
      };
    }),
  };
}
function csvCell(value) {
  let text = String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function exportCsv(book) {
  const rows = [
    [
      "班級",
      "階段",
      "組別",
      "座號1",
      "座號2",
      "座號3",
      "座號4",
      "座號5",
      "累積提問數",
      "完成疾病數",
      "正式名次",
      "進度",
    ],
  ];
  for (const entry of book.classes)
    for (const stage of [1, 2])
      for (const { group, rank } of rankings(entry.groups, stage))
        rows.push([
          entry.name,
          stage,
          group.number,
          ...group.seats,
          group.scores[stage].questions,
          group.scores[stage].completed,
          rank ?? "",
          `${group.scores[stage].completed}/5`,
        ]);
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
