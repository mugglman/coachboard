import { expect, test, type Page } from "@playwright/test";

async function canvasBox(page: Page) {
  const box = await page.getByTestId("editor-canvas").boundingBox();
  if (!box) throw new Error("Canvas nicht gefunden");
  return box;
}

async function newExercise(page: Page, name: string) {
  await page.goto("/");
  await page.getByTestId("new-exercise").click();
  await page.getByTestId("new-name").fill(name);
  await page.getByTestId("create-exercise").click();
  await page.waitForURL(/\/editor\?id=/);
  await expect(page.getByTestId("exercise-name")).toHaveValue(name);
  await expect(page.locator("[data-testid=editor-canvas] canvas").first()).toBeVisible();
}

test("Bibliothek zeigt Beispielübungen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("exercise-grid").locator("li")).toHaveCount(3);
  await expect(page.getByText("Rondo 4 gegen 1")).toBeVisible();
});

test("Übung erstellen, Spieler platzieren, Laufweg zeichnen, speichern und neu laden", async ({ page }) => {
  await newExercise(page, "E2E Übung");
  const box = await canvasBox(page);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.getByRole("button", { name: "Team A" }).click();
  await page.mouse.click(cx, cy);
  await page.getByRole("button", { name: "Auswählen" }).click();

  await page.getByRole("button", { name: "Laufweg" }).click();
  await page.mouse.move(cx + 2, cy + 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(cx + i * 15, cy - i * 6);
  await page.mouse.up();

  await page.getByRole("tab", { name: "Objekte" }).click();
  await expect(page.getByTestId("object-list").locator("li")).toHaveCount(1);
  await expect(page.getByText("Laufweg · Spieler 1")).toBeVisible();

  await expect(page.getByTestId("save-status")).toHaveAttribute("data-status", "saved", { timeout: 10_000 });

  // Animation abspielen
  await page.getByTestId("play-button").click();
  await page.waitForTimeout(800);
  await expect(page.getByTestId("time-display")).not.toContainText("0:00.0 /");

  // Persistenz
  await page.reload();
  await page.getByRole("tab", { name: "Objekte" }).click();
  await expect(page.getByTestId("object-list").locator("li")).toHaveCount(1);
});

test("Schritte hinzufügen und Undo", async ({ page }) => {
  await newExercise(page, "E2E Schritte");
  await page.getByTestId("add-phase").click();
  await expect(page.getByTestId("phase-list").locator("li")).toHaveCount(2);
  await page.getByRole("button", { name: "Rückgängig" }).click();
  await expect(page.getByTestId("phase-list").locator("li")).toHaveCount(1);
});

test("Export als PNG, PDF und JSON erzeugt Downloads", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Passdreieck mit Nachlaufen").first().click();
  await page.waitForURL(/\/editor/);
  for (const [label, ext] of [
    ["Bild (PNG)", ".png"],
    ["PDF", ".pdf"],
    ["Übung als JSON", ".json"],
  ] as const) {
    await page.getByTestId("export-menu").click();
    const dl = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: new RegExp(label.replace(/[()]/g, "\\$&")) }).click();
    const d = await dl;
    expect(d.suggestedFilename()).toContain(ext);
  }
});

test("Trainingseinheit zusammenstellen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("exercise-grid").locator("li")).toHaveCount(3);
  await page.getByRole("link", { name: "Trainingseinheiten" }).click();
  await page.getByTestId("new-session").click();
  await page.waitForURL(/\/sessions\?id=/);
  await page.getByTestId("add-session-item").click();
  await page.getByRole("dialog").getByText("Rondo 4 gegen 1").click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("session-items").locator("li")).toHaveCount(1);
  await page.reload();
  await expect(page.getByTestId("session-items").locator("li")).toHaveCount(1);
});
