import { test, expect, type Page } from "@playwright/test";

const createLocalChart = async (page: Page) => {
  await page
    .locator("button")
    .filter({ hasText: "새 차트 만들기" })
    .first()
    .click();
};

test("root page opens the gantt chart editor directly", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Gantt Chart Editor" }),
  ).toBeVisible();
  await expect(page.getByText("내 브라우저 차트")).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "브라우저 저장 모드입니다" }),
  ).toBeVisible();
});

test("anonymous app exposes only Google and GitHub sign-in choices", async ({
  page,
}) => {
  await page.goto("/app");

  const storageWarning = page
    .getByRole("alert")
    .filter({ hasText: "브라우저 저장 모드입니다" });
  await expect(storageWarning).toContainText("브라우저 저장 모드");
  const googleLinks = page.getByRole("link", {
    name: /^Google로 로그인$/i,
  });
  const githubLinks = page.getByRole("link", {
    name: /^GitHub로 로그인$/i,
  });
  await expect(googleLinks).toHaveCount(2);
  await expect(githubLinks).toHaveCount(2);
  await expect(googleLinks.first()).toHaveAttribute(
    "href",
    "/api/auth/signin/google",
  );
  await expect(githubLinks.first()).toHaveAttribute(
    "href",
    "/api/auth/signin/github",
  );
  await expect(page.getByText(/password|email login|magic link/i)).toHaveCount(
    0,
  );
});

test("anonymous app keeps local charts across reloads", async ({ page }) => {
  await page.goto("/app");

  await createLocalChart(page);
  await expect(page.getByLabel("차트 제목")).toHaveValue("새 Gantt 1");
  await expect(page.getByText("1개 차트")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Gantt 일정표" }),
  ).toBeVisible();
  await expect(page.getByLabel("1행 작업명")).toHaveValue("프로젝트 시작");

  await page.reload();
  await expect(page.getByLabel("차트 제목")).toHaveValue("새 Gantt 1");
  await expect(page.getByText("1개 차트")).toBeVisible();
});

test("anonymous app edits a local gantt task and autosaves it", async ({
  page,
}) => {
  await page.goto("/app");
  await createLocalChart(page);

  await page.getByLabel("1행 작업명").fill("업체 조사");
  await page.getByLabel("1행 진행률").fill("75");
  await page.getByLabel("2행 선행 작업").fill("1FS");

  await expect(page.getByLabel("1행 작업명")).toHaveValue("업체 조사");
  await expect(page.getByLabel("업체 조사 일정 막대")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("1행 작업명")).toHaveValue("업체 조사");
  await expect(page.getByLabel("1행 진행률")).toHaveValue("75");
  await expect(page.getByLabel("2행 선행 작업")).toHaveValue("1FS");
});

test("anonymous app renders task table and bars beyond row two", async ({
  page,
}) => {
  await page.goto("/app");
  await createLocalChart(page);

  await expect(page.getByLabel("3행 작업명")).toHaveValue("출시 마일스톤");
  await expect(page.getByLabel("출시 마일스톤 마일스톤")).toBeVisible();

  await page.getByRole("button", { name: "작업 추가" }).click();
  await page.getByRole("button", { name: "작업 추가" }).click();

  await expect(page.getByLabel("5행 작업명")).toHaveValue("작업 5");
  await expect(page.getByLabel("작업 4 일정 막대")).toBeVisible();
  await expect(page.getByLabel("작업 5 일정 막대")).toBeVisible();
});

test("anonymous app can delete a browser-only chart", async ({ page }) => {
  await page.goto("/app");

  await createLocalChart(page);
  await expect(page.getByLabel("차트 제목")).toHaveValue("새 Gantt 1");

  await page.getByRole("button", { name: /로컬 사본 삭제/i }).click();

  await expect(page.getByLabel("차트 제목")).toHaveCount(0);
  await expect(page.getByText("0개 차트")).toBeVisible();
  await expect(page.getByText(/아직 차트가 없어요/i)).toBeVisible();
});

test("anonymous app ignores corrupted browser storage", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("ganttfolio.localCharts.v1", "{not-json");
  });

  await page.goto("/app");

  await expect(page.getByText("0개 차트")).toBeVisible();
  await expect(page.getByText(/아직 차트가 없어요/i)).toBeVisible();
});
