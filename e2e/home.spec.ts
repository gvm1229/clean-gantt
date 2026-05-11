import { test, expect, type Page } from "@playwright/test";

const createLocalChart = async (page: Page) => {
  await page
    .locator("button")
    .filter({ hasText: "Create local chart" })
    .first()
    .click();
};

test("landing page links to browser chart workspace", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Create a browser chart/i }),
  ).toBeVisible();
  await expect(page.getByText("Hosted app setup")).toBeVisible();
});

test("anonymous app exposes only Google and GitHub sign-in choices", async ({
  page,
}) => {
  await page.goto("/app");

  const storageWarning = page
    .getByRole("alert")
    .filter({ hasText: "Browser-only mode is active" });
  await expect(storageWarning).toContainText("Browser-only mode");
  await expect(
    page.getByRole("link", { name: /^Google login$/i }),
  ).toHaveAttribute("href", "/api/auth/signin/google");
  await expect(
    page.getByRole("link", { name: /^GitHub login$/i }),
  ).toHaveAttribute("href", "/api/auth/signin/github");
  await expect(page.getByText(/password|email login|magic link/i)).toHaveCount(
    0,
  );
});

test("anonymous app keeps local charts across reloads", async ({ page }) => {
  await page.goto("/app");

  await createLocalChart(page);
  await expect(page.getByLabel("Chart title")).toHaveValue("Untitled Gantt 1");
  await expect(page.getByText("1 local chart")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Gantt timeline" }),
  ).toBeVisible();
  await expect(page.getByLabel("Task name row 1")).toHaveValue(
    "Project kickoff",
  );

  await page.reload();
  await expect(page.getByLabel("Chart title")).toHaveValue("Untitled Gantt 1");
  await expect(page.getByText("1 local chart")).toBeVisible();
});

test("anonymous app edits a local gantt task and autosaves it", async ({
  page,
}) => {
  await page.goto("/app");
  await createLocalChart(page);

  await page.getByLabel("Task name row 1").fill("Research vendors");
  await page.getByLabel("Progress row 1").fill("75");
  await page.getByLabel("Dependency row 2").fill("1FS");

  await expect(page.getByLabel("Task name row 1")).toHaveValue(
    "Research vendors",
  );
  await expect(page.getByLabel("Research vendors timeline bar")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Task name row 1")).toHaveValue(
    "Research vendors",
  );
  await expect(page.getByLabel("Progress row 1")).toHaveValue("75");
  await expect(page.getByLabel("Dependency row 2")).toHaveValue("1FS");
});

test("anonymous app can delete a browser-only chart", async ({ page }) => {
  await page.goto("/app");

  await createLocalChart(page);
  await expect(page.getByLabel("Chart title")).toHaveValue("Untitled Gantt 1");

  await page.getByRole("button", { name: /Delete local copy/i }).click();

  await expect(page.getByLabel("Chart title")).toHaveCount(0);
  await expect(page.getByText("0 local charts")).toBeVisible();
  await expect(page.getByText(/No local charts yet/i)).toBeVisible();
});

test("anonymous app ignores corrupted browser storage", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("ganttfolio.localCharts.v1", "{not-json");
  });

  await page.goto("/app");

  await expect(page.getByText("0 local charts")).toBeVisible();
  await expect(page.getByText(/No local charts yet/i)).toBeVisible();
});
