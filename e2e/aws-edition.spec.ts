import { expect, test } from "@playwright/test";

test("rehearsal provenance and source-revision retirement remain visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Offline rehearsal/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await expect(page.getByRole("complementary", { name: "Inference provenance" })).toContainText("Decider and Bedrock are not called");
  await page.getByRole("button", { name: /Run demo script/ }).click();
  await expect(page.getByRole("button", { name: "Demo complete" })).toBeDisabled({ timeout: 20_000 });
  await page.getByRole("button", { name: "Apply simulated approval update" }).click();
  await expect(page.getByText("1 warning retired", { exact: true })).toBeVisible();
  await expect(page.locator(".resolution-card").filter({ hasText: "Commitment conflict" })).toHaveCount(0);
  await expect(page.locator(".resolution-card").filter({ hasText: "Capacity conflict" })).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download evidence snapshot" }).click();
  expect((await download).suggestedFilename()).toBe("clashpoint-evidence-snapshot.json");
});

test("unconfigured AWS mode reports unavailable and never runs a fake demo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Live AWS inference/ }).click();
  await expect(page.getByRole("button", { name: /Start ClashPoint/ })).toBeDisabled();
  await page.getByLabel("Demo access code").fill("a-local-contract-test-code");
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await page.getByRole("button", { name: /Run demo script/ }).click();
  await expect(page.getByText("Live AWS inference is disabled on this server.")).toBeVisible();
  await expect(page.locator(".resolution-card")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Inference provenance" })).toContainText("Live AWS agent");
  await expect(page.getByRole("button", { name: /Run demo script/ })).toBeEnabled();
});

test("narrow-screen setup remains keyboard accessible without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Offline rehearsal/ })).toBeVisible();
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  const overflow = await page.locator("body *").evaluateAll((elements) => elements.filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1).map((element) => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right })));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), JSON.stringify(overflow)).toBe(true);
  await expect(page.getByRole("heading", { name: "Decision integrity" })).toBeVisible();
});
