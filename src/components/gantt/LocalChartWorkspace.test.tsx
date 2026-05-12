import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalChartWorkspace } from "./LocalChartWorkspace";

const STORAGE_KEY = "ganttfolio.localCharts.v1";

let randomId = 0;

beforeEach(() => {
  window.localStorage.clear();
  randomId = 0;

  vi.spyOn(crypto, "randomUUID").mockImplementation(
    () =>
      `test-id-${++randomId}` as `${string}-${string}-${string}-${string}-${string}`,
  );
});

describe("LocalChartWorkspace", () => {
  it("warns anonymous users that charts are browser-only", async () => {
    render(<LocalChartWorkspace isLoggedIn={false} />);

    const warning = await screen.findByRole("alert");
    expect(warning).toHaveTextContent("브라우저 저장 모드입니다");
    expect(warning).toHaveTextContent("이 브라우저의 localStorage에만 저장");
    expect(
      within(warning).getByRole("link", { name: /Google로 로그인/i }),
    ).toHaveAttribute("href", "/api/auth/signin/google");
    expect(
      within(warning).getByRole("link", { name: /GitHub로 로그인/i }),
    ).toHaveAttribute("href", "/api/auth/signin/github");
  });

  it("does not show the browser-only warning to signed-in users", async () => {
    render(<LocalChartWorkspace isLoggedIn />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      await screen.findByText("로그인 저장을 사용할 수 있어요"),
    ).toBeVisible();
  });

  it("creates a starter chart and persists it to localStorage", async () => {
    const user = userEvent.setup();
    render(<LocalChartWorkspace isLoggedIn={false} />);

    await user.click(
      screen.getAllByRole("button", { name: /새 차트 만들기/i })[1],
    );

    expect(await screen.findByDisplayValue("새 Gantt 1")).toBeVisible();
    expect(screen.getByText("1개 차트")).toBeVisible();
    expect(screen.getByText("일정표")).toBeVisible();
    expect(screen.getByDisplayValue("프로젝트 시작")).toBeVisible();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(
      expect.objectContaining({
        id: "test-id-1",
        title: "새 Gantt 1",
        tasks: expect.arrayContaining([
          expect.objectContaining({
            id: "test-id-2",
            taskName: "프로젝트 시작",
            progress: 60,
          }),
        ]),
      }),
    );
  });

  it("edits task cells and autosaves changes to localStorage", async () => {
    const user = userEvent.setup();
    render(<LocalChartWorkspace isLoggedIn={false} />);

    await user.click(
      screen.getAllByRole("button", { name: /새 차트 만들기/i })[1],
    );

    const firstTaskName = await screen.findByLabelText("1행 작업명");
    await user.clear(firstTaskName);
    await user.type(firstTaskName, "업체 조사");
    await user.clear(screen.getByLabelText("1행 진행률"));
    await user.type(screen.getByLabelText("1행 진행률"), "75");

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored[0].tasks[0]).toEqual(
      expect.objectContaining({
        taskName: "업체 조사",
        progress: 75,
      }),
    );
  });

  it("loads existing local charts and can delete a local copy", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "existing-chart",
          title: "기존 로드맵",
          createdAt: "2026-05-10T00:00:00.000Z",
          updatedAt: "2026-05-11T00:00:00.000Z",
          tasks: [],
        },
      ]),
    );

    render(<LocalChartWorkspace isLoggedIn={false} />);

    expect(await screen.findByText("기존 로드맵")).toBeVisible();
    expect(screen.getByText("1개 차트")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /로컬 사본 삭제/i }));

    await waitFor(() =>
      expect(screen.queryByText("기존 로드맵")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("0개 차트")).toBeVisible();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"),
    ).toEqual([]);
  });

  it("ignores corrupted localStorage data instead of crashing", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-json");

    render(<LocalChartWorkspace isLoggedIn={false} />);

    expect(await screen.findByText("0개 차트")).toBeVisible();
    expect(screen.getByText(/아직 차트가 없어요/i)).toBeVisible();
  });
});
