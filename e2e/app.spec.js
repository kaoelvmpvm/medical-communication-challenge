import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { cases } from "../src/data/cases.js";
import { symptoms } from "../src/data/symptoms.js";
import { stageOneCases, stageOneSymptoms } from "../src/data/stage-one.js";
import { STORAGE_KEY } from "../src/teacher/store.js";
const root = "http://127.0.0.1:4173/medical-communication-challenge/";
async function login(page) {
  await page.goto("./");
  await page.getByRole("button", { name: "教師專用", exact: false }).click();
  await page.getByLabel("教師密碼", { exact: true }).fill("0709");
  await page.getByRole("button", { name: "解鎖紀錄中心" }).click();
  await expect(
    page.getByRole("heading", { name: "教室紀錄中心" }),
  ).toBeVisible();
}
async function openTools(page) {
  const tools = page.locator(".teacher-tool-details");
  if ((await tools.getAttribute("open")) === null)
    await tools.locator("summary").click();
}
async function addClass(page, name) {
  await openTools(page);
  await page.getByLabel("新增班級", { exact: true }).fill(name);
  await page.getByRole("button", { name: "新增班級", exact: true }).click();
  await expect(page.locator("#class-select")).toContainText(`${name} 班`);
}
async function group(page, number, seats) {
  await page.getByRole("button", { name: "＋ 新增組別", exact: true }).click();
  await fillGroup(page, number, seats);
}
async function fillGroup(page, number, seats) {
  await page.locator('#group-form [name="number"]').fill(String(number));
  for (let i = 0; i < 5; i++)
    await page.locator(`#group-form [name="seat${i}"]`).fill(String(seats[i]));
  await page.getByRole("button", { name: "儲存組別", exact: true }).click();
}
async function startStudent(page, role, stage = 1, round = 1, index = 0) {
  await page.goto(root);
  if (role === "patient" && stage !== 1) {
    // Deterministic browser test case selection without exposing a student entry code.
    await page.evaluate(({ stage, index }) => {
      sessionStorage.removeItem(`medical-challenge-stage-one-patient-v16-stage-${stage}`);
      const original = crypto.getRandomValues.bind(crypto);
      Object.defineProperty(crypto, "getRandomValues", {
        configurable: true,
        value: (array) => {
          if (array instanceof Uint32Array && array.length === 1) {
            array[0] = index;
            return array;
          }
          return original(array);
        },
      });
    }, { stage, index });
  }
  await page.getByRole("button", {
    name: role === "doctor" ? "我是醫生" : "我是病人",
    exact: false,
  }).click();
  await page.locator(`[data-action="choose-stage"][data-stage="${stage}"]`).click();
  await expect(page.locator('[name="round"],[name="code"]')).toHaveCount(0);
  await page.getByRole("button", {
    name: role === "doctor" ? "進入醫師端" : "開始回合",
    exact: true,
  }).click();
}
async function layout(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const overlaps = await page
    .locator(
      ".body-note,.symptom-card,.candidate,.answer-option,.record-row,.role-entry,.body-marker",
    )
    .evaluateAll((elements) => {
      const rects = elements
        .filter((el) => el.checkVisibility({ contentVisibilityAuto: true }))
        .map((el) => el.getBoundingClientRect());
      return rects.flatMap((a, i) =>
        rects
          .slice(i + 1)
          .filter(
            (b) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
          ),
      );
    });
  expect(overlaps).toHaveLength(0);
}
async function axe(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}
async function snap(page, info, name) {
  await page.evaluate(() => scrollTo(0, 0));
  const path = info.outputPath(name + ".png");
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
}

test("role entry, PIN, class/group edits, duplicate seats, delete undo and locking", async ({
  page,
}, info) => {
  await page.goto("./");
  await expect(page.locator(".role-entry")).toHaveCount(3);
  await layout(page);
  await axe(page);
  await snap(page, info, "role-portal");
  await page.getByRole("button", { name: "教師專用", exact: false }).click();
  await expect(page.locator("#teacher-pin")).toHaveAttribute(
    "type",
    "password",
  );
  await page.locator("#teacher-pin").fill("1111");
  await page.getByRole("button", { name: "解鎖紀錄中心" }).click();
  await expect(page.locator("#login-error")).toContainText("密碼不正確");
  await page.getByRole("button", { name: "清除重輸" }).click();
  await expect(page.locator("#teacher-pin")).toHaveValue("");
  await page.locator("#teacher-pin").fill("0709");
  await page.getByRole("button", { name: "解鎖紀錄中心" }).click();
  await addClass(page, "815");
  await group(page, 1, [1, 2, 3, 4, 5]);
  await expect(page.locator(".record-row")).toHaveCount(1);
  await group(page, 2, [1, 6, 7, 8, 9]);
  await expect(page.locator("#group-error")).toContainText("已分配");
  await fillGroup(page, 2, [6, 7, 8, 9, 10]);
  await expect(page.locator(".record-row")).toHaveCount(2);
  await page
    .locator(".record-row")
    .first()
    .getByRole("button", { name: "修改", exact: true })
    .click();
  await fillGroup(page, 3, [1, 2, 3, 4, 5]);
  await expect(page.locator(".record-row").last()).toContainText("第 3 組");
  await page.locator("#group-search").fill("3");
  await expect(page.locator(".record-row:visible")).toHaveCount(1);
  await expect(page.locator(".record-row:visible")).toContainText("第 3 組");
  await page.locator("#group-search").fill("");
  await expect(page.locator(".record-row:visible")).toHaveCount(2);
  await addClass(page, "816");
  await group(page, 1, [1, 2, 3, 4, 5]);
  await expect(page.locator(".record-row")).toHaveCount(1);
  await page.locator("#class-select").selectOption({ label: "815 班" });
  await expect(page.locator(".record-row")).toHaveCount(2);
  await page
    .locator(".record-row")
    .first()
    .getByRole("button", { name: "刪除", exact: true })
    .click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.locator(".record-row")).toHaveCount(1);
  await page.getByRole("button", { name: "復原最近操作" }).click();
  await expect(page.locator(".record-row")).toHaveCount(2);
  await layout(page);
  await axe(page);
  await snap(page, info, "teacher-records");
  await page.getByRole("button", { name: "鎖定畫面" }).click();
  await expect(page.locator(".record-row")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("815");
  await expect(page.locator("#teacher-pin")).toHaveValue("");
});

test("official counters, bounds, tied ranks, independent stages, persistence, CSV and JSON restore", async ({
  page,
  browser,
}, info) => {
  await login(page);
  await addClass(page, "815");
  await group(page, 1, [1, 2, 3, 4, 5]);
  await group(page, 2, [6, 7, 8, 9, 10]);
  const row = page.locator(".record-row").first();
  await expect(
    row.getByRole("button", { name: "第1組減少問題數" }),
  ).toBeDisabled();
  await row
    .getByRole("button", { name: "第1組增加問題數" })
    .click({ clickCount: 3 });
  await expect(row.locator('[data-field="questions"] output')).toHaveText("3");
  await page.getByRole("button", { name: "復原最近操作" }).click();
  await expect(
    page
      .locator(".record-row")
      .first()
      .locator('[data-field="questions"] output'),
  ).toHaveText("2");
  for (const n of [1, 2]) {
    const current = page.locator(".record-row").nth(n - 1);
    if (n === 2)
      await current
        .getByRole("button", { name: "第2組增加問題數" })
        .click({ clickCount: 2 });
    await current
      .getByRole("button", { name: `第${n}組增加完成數` })
      .click({ clickCount: 8 });
    await expect(current.locator('[data-field="completed"] output')).toHaveText(
      "5",
    );
    await expect(
      current.getByRole("button", { name: `第${n}組增加完成數` }),
    ).toBeDisabled();
  }
  await expect(page.locator("[data-ranking] li").first()).toContainText(
    "第 1 名",
  );
  await expect(page.locator("[data-ranking] li").last()).toContainText(
    "第 1 名",
  );
  await page.getByRole("button", { name: "第二階段", exact: true }).click();
  await expect(
    page
      .locator(".record-row")
      .first()
      .locator('[data-field="questions"] output'),
  ).toHaveText("0");
  await page
    .locator(".record-row")
    .first()
    .getByRole("button", { name: "第1組增加問題數" })
    .click();
  await page.getByRole("button", { name: "第一階段", exact: true }).click();
  await expect(
    page
      .locator(".record-row")
      .first()
      .locator('[data-field="questions"] output'),
  ).toHaveText("2");
  await layout(page);
  await axe(page);
  await snap(page, info, "teacher-ranking");
  await openTools(page);
  const csvWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 CSV" }).click();
  const csv = await csvWait;
  const fs = await import("node:fs/promises");
  const csvText = await fs.readFile(await csv.path(), "utf8");
  expect(csvText).toContain("815");
  expect(csvText).toContain("累積提問數");
  expect(csvText.split("\r\n")).toHaveLength(5);
  const backupWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON 備份" }).click();
  const backup = await backupWait;
  const backupPath = await backup.path();
  const json = JSON.parse(await fs.readFile(backupPath, "utf8"));
  expect(json.classes[0].groups[0].scores[2].questions).toBe(1);
  await page.reload();
  await expect(page.locator(".teacher-shell")).toHaveCount(0);
  await login(page);
  await expect(
    page
      .locator(".record-row")
      .first()
      .locator('[data-field="completed"] output'),
  ).toHaveText("5");
  const context = await browser.newContext({ viewport: page.viewportSize() });
  const restored = await context.newPage();
  await restored.goto(root);
  await restored
    .getByRole("button", { name: "教師專用", exact: false })
    .click();
  await restored.locator("#teacher-pin").fill("0709");
  await restored.getByRole("button", { name: "解鎖紀錄中心" }).click();
  await restored.locator("#import-file").setInputFiles(backupPath);
  await restored.getByRole("button", { name: "確認", exact: true }).click();
  await expect(restored.locator(".record-row")).toHaveCount(2);
  await expect(
    restored
      .locator(".record-row")
      .first()
      .locator('[data-field="completed"] output'),
  ).toHaveText("5");
  await restored.locator("#import-file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":9}'),
  });
  await expect(restored.locator("#teacher-error")).toContainText("未匯入");
  await expect(restored.locator(".record-row")).toHaveCount(2);
  await context.close();
  await page
    .getByRole("button", { name: "病人輪替", exact: true })
    .click();
  await expect(page.locator(".group-plan input")).toHaveCount(0);
  await expect(page.locator(".group-plan details")).toHaveCount(0);
  await page.getByRole("button", { name: "第二階段", exact: true }).click();
  await expect(page.locator(".group-plan input")).toHaveCount(0);
  await expect(page.locator(".round-plan-grid article").first()).toContainText("自行載入");
  await page.getByRole("button", { name: "第三階段", exact: true }).click();
  await expect(page.locator(".score-sheet")).toHaveCount(0);
  await layout(page);
  await axe(page);
  await snap(page, info, "teacher-case-plans");
});

test("twelve source patient maps and doctor twenty-eight-state filtering with manual guesses", async ({
  page,
}, info) => {
  for (let index = 0; index < cases.length; index++) {
    await startStudent(page, "patient", 2, 1, index);
    await expect(page.locator(".body-note")).toHaveCount(
      cases[index].notes.length,
    );
    for (const note of cases[index].notes)
      await expect(page.locator(`#${note.id}`)).toContainText(note.text);
    for (const entry of cases)
      await expect(page.locator("body")).not.toContainText(entry.disease);
    if (info.project.use.hasTouch)
      await page.locator(".body-marker").first().tap();
    else await page.locator(".body-marker").first().click();
    await expect(page.locator(".body-note").first()).toBeFocused();
    await layout(page);
    if (index === 0) {
      await axe(page);
      await snap(page, info, "patient-body");
    }
  }
  await startStudent(page, "doctor");
  await expect(page.locator(".question-panel")).toHaveCount(0);
  await expect(page.locator(".symptom-card")).toHaveCount(stageOneSymptoms.length);
  if (
    !((await page.locator(".candidate-details").getAttribute("open")) !== null)
  )
    await page.locator(".candidate-details summary").click();
  for (const symptom of stageOneSymptoms) {
    const card = page.locator(`[data-symptom-card="${symptom.id}"]`);
    for (const value of [true, false]) {
      const button = card.locator(`[data-value="${value}"]`);
      if (info.project.use.hasTouch) await button.tap();
      else await button.click({ clickCount: 2 });
      await expect(card).toHaveAttribute("data-state", value ? "yes" : "no");
      await expect(page.locator(".candidate:not(.inconsistent)")).toHaveCount(
        stageOneCases.filter(
          (entry) =>
            typeof entry.evidence[symptom.id] !== "boolean" ||
            entry.evidence[symptom.id] === value,
        ).length,
      );
    }
    await card.locator('[data-value="null"]').click();
    await expect(card).toHaveAttribute("data-state", "unknown");
  }
  await expect(
    page.locator(
      ".oral-panel,.decision-panel,.system-nav,.symptom-group,[data-record-progress],[data-question-count],.mobile-tools",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".phase-one-grid > .symptom-card")).toHaveCount(
    stageOneSymptoms.length,
  );
  await page.getByRole("button", { name: "一鍵清空" }).click();
  await expect(page.locator('.symptom-card[data-state="unknown"]')).toHaveCount(
    stageOneSymptoms.length,
  );
  await layout(page);
  if (
    (await page.locator(".candidate-details").getAttribute("open")) === null
  ) {
    await expect(page.locator(".candidate").first()).toBeHidden();
    await page.locator(".candidate-details summary").click();
    await expect(page.locator(".candidate")).toHaveCount(stageOneCases.length);
    await layout(page);
  }
  await axe(page);
  await snap(page, info, "stage-one-doctor");
  await startStudent(page, "doctor", 2);
  await expect(page.locator(".decision-panel,.question-panel,[data-action='open-guess']")).toHaveCount(0);
  await expect(page.locator(".inline-question-list")).toHaveCount(9);
  await expect(page.locator(".inline-question-button")).toHaveCount(11);
  await expect(page.locator(".symptom-card")).toHaveCount(symptoms.length);
  await page.locator('#group-general [data-action="ask"][data-id="body"]').click();
  await expect(page.locator('#group-general .selected-question')).toContainText("已選這題");
  await expect(page.locator("[data-question-count]")).toHaveText("1");
  await page.getByRole("button", { name: "一鍵清空" }).click();
  await expect(page.locator("[data-question-count]")).toHaveText("0");
  await layout(page);
  await axe(page);
  await snap(page, info, "independent-doctor");
});

test("five independent tablets, manual stage-two question selection, stage-three followups", async ({
  browser,
  page,
}, info) => {
  const contexts = [];
  try {
    const pages = [];
    for (let i = 0; i < 5; i++) {
      const context = await browser.newContext({
        viewport: page.viewportSize(),
        hasTouch: !!info.project.use.hasTouch,
      });
      contexts.push(context);
      pages.push(await context.newPage());
    }
    for (let i = 0; i < 4; i++) await startStudent(pages[i], "doctor", 2, 3);
    await startStudent(pages[4], "patient", 2, 3, 4);
    await pages[0].locator('[data-id="fever"][data-value="true"]').click();
    for (let i = 1; i < 4; i++)
      await expect(
        pages[i].locator('[data-symptom-card="fever"]'),
      ).toHaveAttribute("data-state", "unknown");
    await pages[0].locator('[data-action="ask"][data-id="head"]').click();
    await expect(pages[0].locator(".selected-question")).toContainText("頭部");
    await expect(pages[4].locator("#patient-question")).toHaveValue("");
    await pages[4].locator("#patient-question").selectOption("head");
    await expect(pages[4].locator(".answer-option")).toHaveCount(4);
    await pages[4].locator('[data-action="answer"][data-id="detail"]').click();
    await expect(pages[4].locator(".answer-analysis")).toHaveCount(0);
    await pages[4].getByRole("button", { name: "確認回答" }).click();
    await expect(pages[4].locator(".answer-analysis")).toContainText(
      "具體且切合問題",
    );
    await expect(
      pages[0].locator(".history-panel,.body-note,.answer-analysis"),
    ).toHaveCount(0);
    await layout(pages[4]);
    await axe(pages[4]);
    await snap(pages[4], info, "patient-local-answer");
    await startStudent(page, "doctor", 3, 5);
    await expect(
      page.locator(
        '.score-counter,[data-question-count],[data-action="open-guess"]',
      ),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "可以再說明不舒服的位置嗎？" })
      .click();
    await expect(page.locator(".followup-status")).toContainText("準備詢問");
    await page.getByLabel("我的補充問題").fill("這種感覺持續多久了？");
    await layout(page);
    await axe(page);
    await snap(page, info, "doctor-followup");
    await startStudent(page, "patient", 3, 5, 2);
    await expect(page.locator("[data-practice]")).toHaveCount(3);
    await page.locator('[data-practice="where"]').check();
    await expect(page.locator("[data-question-count]")).toHaveCount(0);
  } finally {
    for (const context of contexts) await context.close();
  }
});

test("all stages omit case-code inputs; unavailable or corrupt teacher storage remains safe", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "我是病人", exact: false }).click();
  for (const stage of [1, 2, 3]) {
    await page.locator(`[data-action="choose-stage"][data-stage="${stage}"]`).click();
    await expect(page.locator('[name="code"]')).toHaveCount(0);
    await expect(page.locator("#student-start")).toHaveText("開始回合");
  }
  await page.evaluate(
    (key) => localStorage.setItem(key, "broken backup"),
    STORAGE_KEY,
  );
  await loginCorrupt(page);
  await expect(page.locator("body")).toContainText("原資料不會被自動覆寫");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe("broken backup");
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  await login(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("quota", "QuotaExceededError");
    };
  });
  await page.getByLabel("新增班級", { exact: true }).fill("815");
  await page.getByRole("button", { name: "新增班級", exact: true }).click();
  await expect(page.locator("#teacher-error")).toContainText("未保存");
  await expect(page.locator(".record-row")).toHaveCount(0);
});
async function loginCorrupt(page) {
  await page.goto(root);
  await page.getByRole("button", { name: "教師專用", exact: false }).click();
  await page.locator("#teacher-pin").fill("0709");
  await page.getByRole("button", { name: "解鎖紀錄中心" }).click();
}

test("stage-one random cases persist on refresh; next patient draws and round selection is absent", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto);
    window.__caseDraws = 0;
    window.__nextCase = 4;
    Object.defineProperty(crypto, "getRandomValues", {
      value: (array) => {
        if (array instanceof Uint32Array && array.length === 1) {
          window.__caseDraws++;
          array[0] = window.__nextCase;
          return array;
        }
        return original(array);
      },
    });
  });
  await startStudent(page, "patient", 1);
  await expect(page.locator('[name="round"],[name="code"]')).toHaveCount(0);
  await expect(page.locator(`#${stageOneCases[4].notes[0].id}`)).toContainText(stageOneCases[4].notes[0].text);
  await expect(page.locator(".disease-code strong")).toHaveText(/^[0-9]{4}$/);
  expect(await page.evaluate(() => window.__caseDraws)).toBe(1);
  await page.reload();
  await expect(page.locator(`#${stageOneCases[4].notes[0].id}`)).toContainText(stageOneCases[4].notes[0].text);
  expect(await page.evaluate(() => window.__caseDraws)).toBe(0);
  await page.evaluate(() => { window.__nextCase = 2; });
  await page.getByRole("button", { name: "下一位病患" }).click();
  await expect(page.locator(`#${stageOneCases[2].notes[0].id}`)).toContainText(stageOneCases[2].notes[0].text);
  expect(await page.evaluate(() => window.__caseDraws)).toBe(1);
  await page.reload();
  await expect(page.locator(".disease-code strong")).toHaveText(/^[0-9]{4}$/);
  await layout(page);
  await axe(page);
  await snap(page, info, "stage-one-patient");
  await page.getByRole("button", { name: "更換階段" }).click();
  await expect(page.locator('[name="round"]')).toHaveCount(0);
  await page.locator('[data-action="choose-stage"][data-stage="2"]').click();
  await expect(page.locator('[name="code"]')).toHaveCount(0);
  await page.getByRole("button", { name: "開始回合", exact: true }).click();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.locator(".disease-code strong")).toHaveText(/^[0-9]{4}$/);
  await page.getByRole("button", { name: "下一位病患" }).click();
  await expect(page.locator(".body-note")).not.toHaveCount(0);
  await expect(page.locator(".disease-code strong")).toHaveText(/^[0-9]{4}$/);
});

test("teacher can query all twelve internal codes; patient sees only stable identifier and supplied case art", async ({
  page,
}, info) => {
  const { diseaseCatalog } = await import("../src/data/disease-catalog.js");
  await login(page);
  await page.getByRole("button", { name: "疾病代碼查詢", exact: true }).click();
  for (const entry of diseaseCatalog) {
    await page
      .getByLabel("四位數疾病代碼", { exact: true })
      .fill(entry.diseaseCode);
    await page.getByRole("button", { name: "查詢", exact: true }).click();
    await expect(page.locator("#code-lookup-result")).toContainText(
      entry.disease,
    );
    await expect(page.locator("#code-lookup-result")).toContainText(
      entry.caseNumber,
    );
  }
  await page.getByLabel("四位數疾病代碼", { exact: true }).fill("0000");
  await page.getByRole("button", { name: "查詢", exact: true }).click();
  await expect(page.locator("#code-lookup-result")).toHaveText("查無對應疾病");
  await axe(page);
  await snap(page, info, "teacher-code-lookup");
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await page.getByRole("button", { name: "登出", exact: true }).click();
  const failures = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  await startStudent(page, "patient", 2, 1, 0);
  await expect(page.locator(".disease-code strong")).toHaveText(/^[0-9]{4}$/);
  await expect(page.locator(".case-art img")).toHaveAttribute(
    "src",
    /\/medical-communication-challenge\/art\/cases\/cold\.webp$/,
  );
  await expect(page.locator(".case-art img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".case-art img")
        .evaluate((img) => img.complete && img.naturalWidth === 800),
    )
    .toBe(true);
  for (const entry of diseaseCatalog)
    await expect(page.locator("body")).not.toContainText(entry.disease);
  await expect(
    page.getByRole("button", { name: "疾病代碼查詢", exact: true }),
  ).toHaveCount(0);
  await layout(page);
  await axe(page);
  await snap(page, info, "patient-code-art");
  expect(failures).toEqual([]);
});

test("new cases answer source-based questions, preserve unknown facts and conditionally offer period questions", async ({
  page,
}, info) => {
  const topics = ["eyes", "skin", "chest", "head", "period", "ears"];
  for (let index = 6; index < cases.length; index++) {
    await startStudent(page, "patient", 2, 1, index);
    const entry = cases[index],
      topic = topics[index - 6];
    await expect(page.locator(".disease-code strong")).toHaveText(/^[0-9]{4}$/);
    const periodOptions = page.locator(
      '#patient-question option[value="period"]',
    );
    await expect(periodOptions).toHaveCount(
      entry.id === "dysmenorrhea" ? 1 : 0,
    );
    await page.locator("#patient-question").selectOption(topic);
    await expect(page.locator(".answer-option")).toHaveCount(4);
    const chosen = page.locator('[data-action="answer"][data-id="detail"]');
    await expect(chosen).toContainText(entry.responses[topic]);
    await chosen.click();
    await expect(page.locator(".answer-analysis")).toHaveCount(0);
    await page.getByRole("button", { name: "確認回答", exact: true }).click();
    await expect(page.locator(".answer-analysis")).toContainText(
      "具體且切合問題",
    );
    await layout(page);
    if (index === 6 || index === 10) {
      await axe(page);
      await snap(page, info, `case-${entry.caseNumber}-answer`);
    }
    for (const disease of cases)
      await expect(page.locator("body")).not.toContainText(disease.disease);
  }
  for (const [index, topic] of [
    [7, "throat"],
    [8, "stomach"],
    [10, "stomach"],
    [11, "head"],
    [11, "body"],
  ]) {
    await startStudent(page, "patient", 2, 1, index);
    await page.locator("#patient-question").selectOption(topic);
    await expect(
      page.locator('[data-action="answer"][data-id="detail"]'),
    ).toContainText(cases[index].responses[topic]);
  }
  await startStudent(page, "patient", 2, 1, 6);
  await page.locator("#patient-question").selectOption("ears");
  await expect(page.locator('[data-id="detail"]')).toContainText("不確定");
  await page.locator('[data-id="detail"]').click();
  await page.getByRole("button", { name: "確認回答", exact: true }).click();
  await expect(page.locator(".answer-analysis")).toContainText(
    "清楚說明資料不足",
  );
  await startStudent(page, "doctor", 2, 1);
  if ((await page.locator(".candidate-details").getAttribute("open")) === null)
    await page.locator(".candidate-details summary").click();
  await page.locator('[data-id="redEye"][data-value="true"]').click();
  await expect(
    page.locator('[data-candidate="viral_conjunctivitis"]'),
  ).toHaveAttribute("data-comparison", "insufficient");
  await expect(page.locator('[data-candidate="urticaria"]')).toHaveAttribute(
    "data-comparison",
    "conflict",
  );
  await expect(page.locator('[data-candidate="cold"]')).toHaveAttribute(
    "data-comparison",
    "insufficient",
  );
  await expect(page.locator('[data-candidate="cold"]')).toContainText(
    "無法判斷",
  );
  await page.locator('[data-id="periodCramps"][data-value="true"]').click();
  await expect(
    page.locator('[data-candidate="viral_conjunctivitis"]'),
  ).toHaveAttribute("data-comparison", "insufficient");
  await expect(page.locator('[data-candidate="urticaria"]')).toHaveAttribute(
    "data-comparison",
    "conflict",
  );
  await layout(page);
  await axe(page);
  await snap(page, info, "four-state-candidates");
});

test("conjunctivitis remains among candidates when reported fever, vomiting, diarrhea and belly pain are absent", async ({ page }) => {
  await startStudent(page, "doctor", 2);
  if ((await page.locator(".candidate-details").getAttribute("open")) === null)
    await page.locator(".candidate-details summary").click();
  for (const symptom of ["fever", "vomit", "diarrhea", "belly"])
    await page.locator(`[data-symptom-card="${symptom}"] [data-value="false"]`).click();
  await expect(page.locator('[data-candidate="viral_conjunctivitis"]'))
    .toHaveAttribute("data-comparison", "insufficient");
  await expect(page.locator('[data-candidate="viral_conjunctivitis"]'))
    .toContainText("無法判斷");
  await page.locator('[data-symptom-card="redEye"] [data-value="true"]').click();
  await expect(page.locator('[data-candidate="viral_conjunctivitis"]'))
    .toHaveAttribute("data-comparison", "insufficient");
  await expect(page.locator(".candidate-disclaimer")).toHaveCount(0);
});

test("flu turns gray after fever=no, returns green when unresolved, and confirms only after all defined facts", async ({ page }) => {
  await startStudent(page, "doctor", 1);
  if ((await page.locator(".candidate-details").getAttribute("open")) === null)
    await page.locator(".candidate-details summary").click();
  const flu = page.locator('[data-candidate="flu"]');
  await expect(flu).toHaveAttribute("data-comparison", "unrecorded");
  await expect(flu).toHaveClass(/uncertain/);
  await page.locator('[data-symptom-card="fever"] [data-value="false"]').click();
  await expect(flu).toHaveAttribute("data-comparison", "conflict");
  await expect(flu).toHaveClass(/inconsistent/);
  await page.locator('[data-symptom-card="fever"] [data-value="true"]').click();
  await expect(flu).toHaveAttribute("data-comparison", "insufficient");
  await expect(flu).toHaveClass(/uncertain/);
  const data = stageOneCases.find(c => c.id === "flu");
  for (const [id, value] of Object.entries(data.evidence))
    if (typeof value === "boolean")
      await page.locator(`[data-symptom-card="${id}"] [data-value="${value}"]`).click();
  await expect(flu).toHaveAttribute("data-comparison", "consistent");
  await expect(flu).toHaveClass(/confirmed/);
  await expect(flu).toContainText("與線索相符");
});

test("possible diseases show pale green, conflicts gray, and the music volume slider updates in place", async ({ page }) => {
  await page.goto(root);
  const volume = page.getByRole("slider", { name: "背景音樂音量" });
  await expect(volume).toBeVisible();
  await volume.evaluate(input => {
    input.value = "35";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#music-volume-value")).toHaveText("35%");
  await page.reload();
  await expect(volume).toHaveValue("35");
  await startStudent(page, "doctor", 1);
  const cold = page.locator('[data-candidate="cold"]');
  await expect(cold).toHaveClass(/uncertain/);
  const green = await cold.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(green).toBe("rgb(237, 248, 243)");
  await page.locator('[data-symptom-card="fever"] [data-value="false"]').click();
  const flu = page.locator('[data-candidate="flu"]');
  await expect(flu).toHaveClass(/inconsistent/);
  const gray = await flu.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(gray).toBe("rgb(236, 239, 241)");
  await expect(page.locator(".candidate.uncertain").first()).toHaveCSS("border-top-style", "solid");
});

test("doctor candidate board stays aligned across tablet and desktop widths", async ({ page }) => {
  await startStudent(page, "doctor", 1);
  const grid = page.locator(".candidate-grid");
  const cards = page.locator(".candidate");
  await expect(cards).toHaveCount(8);
  const width = page.viewportSize()?.width || 1440;
  const expectedCols = width <= 540 ? 1 : width <= 980 ? 2 : 4;
  const columns = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(expectedCols);
  const boxes = await cards.evaluateAll(elements => elements.map(el => {
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), height: Math.round(b.height), left: Math.round(b.left) };
  }));
  expect(boxes.slice(0, expectedCols).every(box => box.height === boxes[0].height)).toBe(true);
  await startStudent(page, "doctor", 2);
  await expect(page.locator(".candidate")).toHaveCount(12);
  const columns2 = await page.locator(".candidate-grid").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(columns2).toBe(expectedCols);
});
