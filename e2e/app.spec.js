import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { cases } from "../src/data/cases.js";
import { symptoms } from "../src/data/symptoms.js";

async function start(page, stage = 1) {
  await page.goto("./");
  await page.locator(`[data-action="start"][data-stage="${stage}"]`).click();
  await expect(page.locator(".handoff-panel")).toBeVisible();
  await page.getByRole("button", { name: "我是病患，開啟畫面" }).click();
}
async function swap(page, role) {
  await page.locator('[data-action="switch"]').first().click();
  await expect(page.locator(".body-note")).toHaveCount(0);
  await expect(page.locator(".symptom-card")).toHaveCount(0);
  await expect(page.locator(".candidate")).toHaveCount(0);
  await page.getByRole("button", { name: `我是${role}，開啟畫面` }).click();
}
async function layout(page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  const overlaps = await page
    .locator(
      ".body-note, .symptom-card, .candidate, .answer-option, .body-marker",
    )
    .evaluateAll((elements) => {
      const boxes = elements
        .filter((el) => el.getClientRects().length)
        .map((el) => ({
          kind: el.className,
          rect: el.getBoundingClientRect(),
        }));
      const errors = [];
      for (let a = 0; a < boxes.length; a++)
        for (let b = a + 1; b < boxes.length; b++) {
          const x = boxes[a].rect,
            y = boxes[b].rect;
          if (
            Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 &&
            Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
          )
            errors.push([boxes[a].kind, boxes[b].kind]);
        }
      return errors;
    });
  expect(overlaps).toEqual([]);
}
async function a11y(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}
async function screenshot(page, info, name) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
}
async function correctGuess(page, entry) {
  await page.getByRole("button", { name: "猜測疾病", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "確認這次猜測" }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: entry.disease, exact: true }).check();
  await page.getByRole("button", { name: "確認這次猜測" }).click();
}

test("all six body maps, anchors, handoffs and role rotation", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await start(page);
  for (const [index, entry] of cases.entries()) {
    if (index > 0)
      await page.getByRole("button", { name: "我是病患，開啟畫面" }).click();
    await expect(page.locator(".body-note")).toHaveCount(entry.notes.length);
    for (const note of entry.notes)
      await expect(page.locator(`#${note.id}`)).toContainText(note.text);
    for (const candidate of cases)
      await expect(page.locator("body")).not.toContainText(candidate.disease);
    await expect(page.locator(".record-button")).toHaveCount(0);
    await layout(page);
    if (info.project.use.hasTouch)
      await page.locator(".body-marker").first().tap();
    else await page.locator(".body-marker").first().click();
    await expect(page.locator(".body-note").first()).toBeFocused();
    await expect(page.locator(".body-note").first()).toHaveClass(/highlighted/);
    if (page.viewportSize().width > 700) {
      const lines = await page.locator(".body-connectors").evaluate((svg) => {
        const map = svg.closest(".body-map").getBoundingClientRect();
        return [...svg.querySelectorAll("polyline")].map((line, i) => {
          const card = svg
            .closest(".body-map")
            .querySelectorAll(".body-note")
            [i].getBoundingClientRect();
          const marker = svg
            .closest(".body-map")
            .querySelectorAll(".body-marker")
            [i].getBoundingClientRect();
          const start = line.points[0],
            end = line.points[line.points.length - 1];
          return (
            Math.abs(end.x - (marker.left + marker.width / 2 - map.left)) < 2 &&
            Math.abs(end.y - (marker.top + marker.height / 2 - map.top)) < 2 &&
            Math.abs(start.y - (card.top + card.height / 2 - map.top)) < 2
          );
        });
      });
      expect(lines).toHaveLength(entry.notes.length);
      expect(lines.every(Boolean)).toBe(true);
    }
    await screenshot(page, info, `patient-${index + 1}`);
    if (index === 0) await a11y(page);
    await swap(page, "醫師");
    for (const note of entry.notes)
      await expect(page.locator("body")).not.toContainText(note.text);
    await correctGuess(page, entry);
    await page.locator('[data-action="next"]').click();
    if (index < 5) {
      await expect(page.locator(".body-note")).toHaveCount(0);
      await expect(page.locator(".result-panel")).toHaveCount(0);
    }
  }
  await expect(page.locator("#screen-title")).toHaveText(
    "六段對話，六次理解。",
  );
  await page.getByRole("button", { name: "進入下一階段" }).click();
  await expect(page.locator(".handoff-meta")).toContainText("第 2 階段");
  expect(errors).toEqual([]);
});

test("eighteen tri-state records, live candidates, fast input and retry preserve counts", async ({
  page,
}, info) => {
  await start(page);
  await swap(page, "醫師");
  await expect(page.locator(".question-panel")).toHaveCount(0);
  await expect(page.locator(".symptom-card")).toHaveCount(18);
  const details = page.locator(".candidate-details");
  if (!((await details.getAttribute("open")) !== null))
    await details.locator("summary").click();
  await expect(page.locator(".candidate.consistent")).toHaveCount(6);
  for (const symptom of symptoms) {
    const card = page.locator(`[data-symptom-card="${symptom.id}"]`);
    await expect(card).toHaveAttribute("data-state", "unknown");
    for (const value of [true, false]) {
      if (info.project.use.hasTouch) {
        await card.locator(`[data-value="${value}"]`).tap();
        await card.locator(`[data-value="${value}"]`).tap();
      } else
        await card.locator(`[data-value="${value}"]`).click({ clickCount: 2 });
      await expect(card).toHaveAttribute("data-state", value ? "yes" : "no");
      await expect(card.locator(`[data-value="${value}"]`)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      const expected = cases.filter(
        (entry) => entry.evidence[symptom.id] === value,
      ).length;
      await expect(page.locator(".candidate.consistent")).toHaveCount(expected);
    }
    await card.locator('[data-value="null"]').click();
    await expect(card).toHaveAttribute("data-state", "unknown");
  }
  await page.locator('[data-id="fever"][data-value="true"]').click();
  await page.locator('[data-id="frequent"][data-value="true"]').click();
  await expect(page.locator("[data-match-count]")).toHaveText("0");
  await page
    .getByRole("button", { name: "＋ 記錄一次提問" })
    .click({ clickCount: 3 });
  await correctGuess(page, cases[1]);
  await expect(page.locator("dialog")).toContainText("這次猜測與模擬病例不同");
  await page.getByRole("button", { name: "清空紀錄，重新整理" }).click();
  await expect(page.locator("[data-question-count]")).toHaveText("3");
  await expect(page.locator('.symptom-card[data-state="unknown"]')).toHaveCount(
    18,
  );
  await expect(page.locator(".candidate.consistent")).toHaveCount(6);
  await layout(page);
  await a11y(page);
  await screenshot(page, info, "doctor-records");
  await page.getByRole("button", { name: "猜測疾病", exact: true }).click();
  await expect(page.getByRole("button", { name: "先繼續問" })).toBeFocused();
  await a11y(page);
  await screenshot(page, info, "guess-confirmation");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "猜測疾病", exact: true }),
  ).toBeFocused();
  await correctGuess(page, cases[0]);
  await expect(page.locator(".result-panel")).toContainText("3 次提問");
  await swap(page, "病患");
  await swap(page, "醫師");
  await expect(page.locator("[data-question-count]")).toHaveText("3");
});

test("stage two question, selection, confirmation, analysis and delivered conversation", async ({
  page,
}, info) => {
  await start(page, 2);
  await swap(page, "醫師");
  await expect(page.locator(".question-button")).toHaveCount(6);
  await page.locator('[data-action="ask"][data-id="body"]').click();
  await expect(page.locator(".question-button")).toHaveCount(0);
  await expect(page.locator(".body-note")).toHaveCount(0);
  await screenshot(page, info, "handoff");
  await page.getByRole("button", { name: "我是病患，開啟畫面" }).click();
  await expect(page.locator(".answer-option")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "確認送出回答" }),
  ).toBeDisabled();
  await expect(page.locator(".answer-analysis")).toHaveCount(0);
  await page.locator('[data-action="answer"][data-id="vague"]').click();
  await page.locator('[data-action="answer"][data-id="detail"]').click();
  await expect(page.locator(".answer-option.selected")).toHaveCount(1);
  await expect(page.locator(".answer-analysis")).toHaveCount(0);
  await expect(page.locator(".answer-panel")).toContainText("已選擇・尚未送出");
  await layout(page);
  await a11y(page);
  await screenshot(page, info, "patient-answer-selected");
  await page.getByRole("button", { name: "確認送出回答" }).click();
  await expect(page.locator(".answer-analysis")).toContainText(
    "具體且切合問題",
  );
  await expect(page.locator(".answer-option:disabled")).toHaveCount(4);
  await expect(page.locator(".answer-analysis")).toBeFocused();
  await a11y(page);
  await screenshot(page, info, "patient-answer-confirmed");
  await swap(page, "醫師");
  await expect(page.locator(".history-panel")).toContainText(
    cases[0].notes.find((note) => note.part === "body").text,
  );
  await expect(page.locator("[data-question-count]")).toHaveText("1");
  await expect(page.locator(".body-note")).toHaveCount(0);
  await page.locator('[data-action="ask"][data-id="nose"]').click();
  await page.getByRole("button", { name: "我是病患，開啟畫面" }).click();
  await expect(page.locator(".answer-analysis")).toHaveCount(0);
  await expect(page.locator(".answer-option.selected")).toHaveCount(0);
  await swap(page, "醫師");
  await expect(page.locator("[data-question-count]")).toHaveText("2");
  await expect(page.locator(".question-button:disabled")).toHaveCount(6);
});

test("stage three narrative practice, keyboard handoff, no competition and responsive lobby", async ({
  page,
}, info) => {
  await page.goto("./");
  await layout(page);
  await a11y(page);
  await screenshot(page, info, "lobby");
  await start(page, 3);
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(3);
  await page.getByLabel("先說哪裡不舒服", { exact: false }).check();
  await expect(
    page.locator(
      '[data-question-count], [data-match-count], [data-action="open-guess"]',
    ),
  ).toHaveCount(0);
  await layout(page);
  await a11y(page);
  await screenshot(page, info, "stage-three-patient");
  await page.locator('[data-action="switch"]').first().click();
  await expect(page.locator(".handoff-panel")).toBeVisible();
  await expect(page.locator(".body-note")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(cases[0].notes[0].text);
  await expect(page.locator("#handoff-title")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "我是醫師，開啟畫面" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#screen-title")).toBeFocused();
  await expect(
    page.locator(
      '[data-question-count], [data-action="open-guess"], .candidate, .symptom-card',
    ),
  ).toHaveCount(0);
  await layout(page);
  await a11y(page);
  await screenshot(page, info, "stage-three-doctor");
  await swap(page, "病患");
  await expect(page.locator('[data-practice="where"]')).toBeChecked();
  await swap(page, "醫師");
  await page.getByRole("button", { name: "完成這位病患的練習" }).click();
  await page.getByRole("button", { name: "確認完成", exact: true }).click();
  await expect(page.locator(".handoff-meta")).toContainText("第 2 位病患");
});
