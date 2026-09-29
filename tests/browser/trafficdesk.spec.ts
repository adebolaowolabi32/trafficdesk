import { test, expect } from "@playwright/test";
test("operator changes demand, dispatches, reroutes, repairs and resets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("");
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await page.getByRole("button", { name: "Rush hour" }).click();
  const before = Number(await page.getByTestId("selected-queue").textContent());
  await page
    .getByRole("button", { name: "Send Island Connect bus to Marina Central" })
    .click();
  expect(
    Number(await page.getByTestId("selected-queue").textContent()),
  ).toBeLessThan(before);
  await page.getByRole("button", { name: "Close the bridge" }).click();
  await page.getByRole("button", { name: "Open an alternate route" }).click();
  await expect(
    page.getByRole("button", { name: "Remove detour" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /TD-101, Mainland Loop/ }).click();
  await page.getByRole("button", { name: "Simulate breakdown" }).click();
  await expect(page.getByText("Breakdown", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Repair & resume" }).click();
  await expect(
    page.getByRole("button", { name: "Simulate breakdown" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "City pulse" }).click();
  await expect(
    page.getByRole("heading", { name: "Queues and bus capacity" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Compare dispatch strategies" })
    .click();
  await expect(page.getByRole("table")).toContainText("Journeys completed");
  await page
    .getByRole("button", { name: "Reset simulation", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset city", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rush hour" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(errors).toEqual([]);
});
test("ticket joins queue and reaches destination on a bus", async ({
  page,
}) => {
  await page.goto("");
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await page.getByRole("button", { name: "Take a ride", exact: true }).click();
  await page.getByRole("button", { name: "Get demo ticket" }).click();
  await expect(
    page.getByText("Waiting to board", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fleet control", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send Island Connect bus to Marina Central" })
    .click();
  await page.getByRole("button", { name: "Take a ride", exact: true }).click();
  await expect(
    page.getByText("You're on your way", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "8 times speed" }).click();
  await page
    .getByRole("button", { name: "Resume simulation", exact: true })
    .click();
  await expect(page.getByText("You've arrived!", { exact: true })).toBeVisible({
    timeout: 25000,
  });
});
test("desktop and mobile render without overflow; keyboard map controls work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("");
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await page.screenshot({ path: "docs/desktop.png", fullPage: true });
  const stop = page.getByRole("button", { name: /University stop/ });
  await stop.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "University", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Reset map view" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("reduced motion starts paused and runs without external data services", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      new URL(r.url()).origin !==
        new URL(process.env.TRAFFICDESK_URL || "http://127.0.0.1:4176")
          .origin &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  await page.goto("");
  await expect(
    page.getByRole("button", { name: "Resume simulation", exact: true }),
  ).toBeVisible();
  const initial = await page.getByTestId("sim-clock").textContent();
  await page.waitForTimeout(500);
  expect(await page.getByTestId("sim-clock").textContent()).toBe(initial);
  expect(external).toEqual([]);
});
