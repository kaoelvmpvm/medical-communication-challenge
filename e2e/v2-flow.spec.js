import { test, expect } from "@playwright/test";

async function begin(page, disease="cold") {
  await page.goto("./");
  await expect(page.getByRole("heading",{name:"醫問到底！"})).toBeVisible();
  await page.getByRole("button",{name:"開始學習挑戰"}).click();
  await expect(page.locator('[data-v2-action="choose-case"]')).toHaveCount(4);
  await page.locator(`[data-v2-action="choose-case"][data-case-id="${disease}"]`).click();
}
async function answerTen(page) {
  for (let i=0;i<10;i++) {
    await expect(page.locator(".v2-question-count")).toContainText(`第 ${i+1} / 10 題`);
    await page.locator('[data-v2-action="answer"]').first().click();
    await expect(page.locator(".v2-answer.is-selected")).toHaveCount(1);
    if(i<9) await page.locator('[data-action="v2-next"]').click();
    else await page.locator('[data-action="v2-submit"]').click();
  }
}
test("P1 doctor progression: same case from pre to post, only two practice stages", async({page})=>{
  await begin(page,"cold");
  await answerTen(page);
  await expect(page.getByRole("heading",{name:"你目前的病情表達習慣"})).toBeVisible();
  await page.locator('[data-action="v2-advance"]').click();
  await page.locator('[data-v2-action="choose-role"][data-role="doctor"]').click();
  await expect(page.locator(".symptom-card").first()).toBeVisible();
  await expect(page.locator('[data-action="v2-advance"]')).toContainText("完成第一階段");
  await page.locator('[data-action="v2-advance"]').click();
  await expect(page.locator('[data-action="v2-advance"]')).toContainText("完成第二階段");
  await page.locator('[data-action="v2-advance"]').click();
  await expect(page.locator(".v2-scenario summary")).toContainText("一般感冒");
  await answerTen(page);
  await expect(page.getByRole("heading",{name:"我的病情表達，有什麼改變？"})).toBeVisible();
  await expect(page.locator(".v2-compare [role=row]")).toHaveCount(6);
  await expect(page.locator(".v2-progress")).not.toContainText("第三階段");
});
test("P1 patient progression: role persists; legacy stage two answers remain usable", async({page})=>{
  await begin(page,"allergy");
  await answerTen(page);
  await page.locator('[data-action="v2-advance"]').click();
  await page.locator('[data-v2-action="choose-role"][data-role="patient"]').click();
  await expect(page.locator(".case-art img")).toHaveCount(1);
  await expect(page.getByRole("button",{name:"下一位病患"})).toBeVisible();
  await page.locator('[data-action="v2-advance"]').click();
  await expect(page.locator("#patient-question")).toBeVisible();
  await page.locator("#patient-question").selectOption({index:1});
  await expect(page.locator(".stage-two-speech-choice")).toHaveCount(3);
  await page.locator('.stage-two-speech-choice').first().click();
  await expect(page.locator(".stage-two-speech-detail")).toBeVisible();
  await page.locator('[data-action="v2-advance"]').click();
  await expect(page.locator(".v2-scenario summary")).toContainText("過敏性鼻炎");
});
test("P1 resume keeps same case and answers without touching teacher data",async({page})=>{
  await begin(page,"gastro");
  await page.locator('[data-v2-action="answer"]').first().click();
  await page.reload();
  await expect(page.getByRole("button",{name:"繼續我的學習"})).toBeVisible();
  await page.locator('[data-action="v2-continue"]').click();
  await expect(page.locator(".v2-scenario summary")).toContainText("急性腸胃炎");
  await expect(page.locator(".v2-question-count")).toContainText("第 2 / 10 題");
});
test("P1 teacher still has PIN and no third stage tab",async({page})=>{
  await page.goto("./");
  await page.getByRole("button",{name:"教師專用"}).click();
  await page.locator("#teacher-pin").fill("0709");
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.getByRole("heading",{name:"教室紀錄中心"})).toBeVisible();
  // The teacher workspace tabs are shown only after a class exists.
  await page.locator('#class-form input[name="className"]').fill("815");
  await page.locator('#class-form button[type="submit"]').click();
  await expect(page.locator('[data-action="t-section"][data-section="plans"]')).toBeVisible();
  await expect(page.locator('[data-action="t-stage"][data-stage="3"]')).toHaveCount(0);
  await page.locator('[data-action="t-section"][data-section="plans"]').click();
  await expect(page.locator('[data-action="t-stage"][data-stage="3"]')).toHaveCount(0);
});
