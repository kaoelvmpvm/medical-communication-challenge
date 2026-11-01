import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { cases } from "../src/data/cases.js";
import { makeCode } from "../src/game/codes.js";

async function loaded(image, width, height) {
  await expect(image).toBeVisible();
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  expect(
    await image.evaluate((img) => [img.naturalWidth, img.naturalHeight]),
  ).toEqual([width, height]);
  const shape = await image.evaluate((img) => {
    const r = img.getBoundingClientRect();
    return { ratio: r.width / r.height, fit: getComputedStyle(img).objectFit };
  });
  expect(Math.abs(shape.ratio - width / height)).toBeLessThan(0.01);
  expect(shape.fit).not.toBe("cover");
}
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function patient(page, index, stage = 2) {
  await page.goto("./");
  await page.getByRole("button", { name: "我是病人", exact: true }).click();
  await page.locator(`[data-action="choose-stage"][data-stage="${stage}"]`).click();
  await page
    .getByLabel("教師提供的病例碼", { exact: true })
    .fill(makeCode(index, stage, 1));
  await page.getByRole("button", { name: "載入病例", exact: true }).click();
}
async function snap(page, info, name) {
  await page.evaluate(() => scrollTo(0, 0));
  const path = info.outputPath(name + ".png");
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
}
const removed = [
  "五人一組・每人一台平板",
  "病情解碼挑戰",
  "教學模擬 · 1.4",
  "各平板獨立操作，不會自動同步。教師手動登記的數字才是正式成績；第二、三階段的病例碼只交給當回合的病人。",
];

test("supplied logo, hero and three role cards load with compact layout, keyboard entry and correct footer", async ({
  page,
}, info) => {
  await page.goto("./");
  await loaded(page.locator(".home-logo"), 2172, 724);
  await loaded(page.locator(".home-illustration img"), 1600, 900);
  await expect(
    page.getByRole("heading", { name: "醫問到底！", exact: true }),
  ).toHaveCount(1);
  for (const role of ["doctor", "patient", "teacher"])
    await loaded(page.locator(`.role-entry.${role} img`), 1024, 1024);
  expect(
    await page
      .locator(".role-entry")
      .evaluateAll((entries) =>
        entries.map((e) => e.querySelectorAll("button,a,input").length),
      ),
  ).toEqual([0, 0, 0]);
  const cards = await page
    .locator(".role-entry")
    .evaluateAll((items) =>
      items.map((el) => el.getBoundingClientRect().height),
    );
  expect(Math.max(...cards) - Math.min(...cards)).toBeLessThan(1);
  if (page.viewportSize().width >= 1024) {
    const bottoms = await page
      .locator(".role-entry")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
    expect(Math.max(...bottoms)).toBeLessThan(page.viewportSize().height);
  }
  for (const text of removed)
    await expect(page.locator("body")).not.toContainText(text);
  await expect(page.locator(".app-footer")).toHaveText(
    "版本 V1.5板橋國中 高勳頊老師設計開發",
  );
  await expect(page.locator(".app-header")).not.toContainText("1.5");
  await expect(page.locator(".sound-toggle")).toHaveCount(0);
  await expect(page.locator(".music-toggle")).toHaveCount(1);
  await expect(page.locator(".app-header")).not.toContainText("角色入口");
  for (const text of ["開始問診", "開始描述", "進入教師紀錄"])
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await noOverflow(page);
  await snap(page, info, "v15-home");
  await page.getByRole("button", { name: "我是醫生", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "準備開始推理" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回角色入口", exact: true }).click();
  await page.getByRole("button", { name: "我是病人", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "準備揭開身體線索" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回角色入口", exact: true }).click();
  await page.getByRole("button", { name: "教師專用", exact: true }).click();
  await expect(page.getByLabel("教師密碼", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
});

test("all twelve patient illustrations decode from Pages subpaths, match case IDs and retain body map and identifier", async ({
  page,
}, info) => {
  const errors = [];
  page.on("response", (r) => {
    if (r.url().includes("/art/") && r.status() >= 400) errors.push(r.url());
  });
  for (let index = 0; index < cases.length; index++) {
    const entry = cases[index];
    await patient(page, index);
    const art = page.locator(".case-art img");
    await expect(art).toHaveAttribute(
      "src",
      new RegExp(
        `/medical-communication-challenge/art/cases/${entry.id}\\.webp$`,
      ),
    );
    await loaded(art, 800, 1000);
    await expect(art).toHaveAttribute("alt", "模擬病例的情境插畫");
    await expect(page.locator(".body-svg")).toBeVisible();
    await expect(page.locator(".body-note")).toHaveCount(entry.notes.length);
    await expect(page.locator(".disease-code")).toHaveCount(0);
    for (const disease of cases)
      await expect(page.locator("body")).not.toContainText(disease.disease);
    await expect(page.locator(".case-art")).not.toContainText("預留");
    const boxes = await page
      .locator(".patient-map-panel,.case-art")
      .evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }),
      );
    const [a, b] = boxes;
    expect(
      Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 ||
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
    ).toBe(true);
    await noOverflow(page);
    if (index === 0) await snap(page, info, "v15-patient");
  }
  expect(errors).toEqual([]);
});

test("failed homepage art retains readable controls and failed case art falls back without leaking an answer", async ({
  page,
}, info) => {
  await page.route("**/art/**/*.webp", (route) => route.abort());
  await page.goto("./");
  await expect(page.locator(".logo-text")).toBeVisible();
  await expect(page.locator(".home-logo")).toBeHidden();
  await expect(page.locator(".home-art-fallback")).toBeVisible();
  await expect(page.locator(".role-art-fallback:visible")).toHaveCount(3);
  await noOverflow(page);
  await patient(page, 6);
  await expect(page.locator(".case-art")).toContainText("劇情圖片");
  await expect(page.locator(".case-art img")).toHaveCount(0);
  await expect(page.locator(".body-note")).toHaveCount(cases[6].notes.length);
  await expect(page.locator("body")).not.toContainText(cases[6].disease);
  await noOverflow(page);
  await snap(page, info, "v15-fallback");
});
