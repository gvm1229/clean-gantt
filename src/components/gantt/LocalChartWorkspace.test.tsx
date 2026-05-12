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

  it("renders table cells and timeline bars for rows beyond row two", async () => {
    const user = userEvent.setup();
    render(<LocalChartWorkspace isLoggedIn={false} />);

    await user.click(
      screen.getAllByRole("button", { name: /새 차트 만들기/i })[1],
    );

    expect(await screen.findByLabelText("3행 작업명")).toHaveValue(
      "출시 마일스톤",
    );
    expect(screen.getByLabelText("출시 마일스톤 마일스톤")).toHaveStyle({
      top: "12px",
    });

    await user.click(screen.getByRole("button", { name: /작업 추가/i }));
    await user.click(screen.getByRole("button", { name: /작업 추가/i }));

    expect(await screen.findByLabelText("5행 작업명")).toHaveValue("작업 5");
    expect(screen.getByLabelText("작업 4 일정 막대")).toHaveStyle({
      top: "8px",
    });
    expect(screen.getByLabelText("작업 5 일정 막대")).toHaveStyle({
      top: "8px",
    });
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

  it("imports CSV tasks into the active local chart", async () => {
    const user = userEvent.setup();
    render(<LocalChartWorkspace isLoggedIn={false} />);

    await user.click(
      screen.getAllByRole("button", { name: /새 차트 만들기/i })[1],
    );

    const file = new File(
      [
        "task name,category,start date,end date,comment\n",
        "CSV Alpha,Planning,2026-05-01,2026-05-03,First import\n",
        '"CSV, Beta",Build,2026-05-04,2026-05-05,"quoted, note"\n',
      ],
      "roadmap.csv",
      { type: "text/csv" },
    );

    await user.upload(screen.getByLabelText("CSV 파일 가져오기"), file);

    expect(await screen.findByDisplayValue("CSV Alpha")).toBeVisible();
    expect(screen.getByDisplayValue("CSV, Beta")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "2개 작업을 CSV에서 가져왔습니다",
    );

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored[0].tasks).toHaveLength(2);
    expect(stored[0].tasks[1]).toEqual(
      expect.objectContaining({
        taskName: "CSV, Beta",
        category: "Build",
        startDate: "2026-05-04",
        endDate: "2026-05-05",
        comment: "quoted, note",
      }),
    );
  });

  it("exports the active chart as a CSV download", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:gantt-csv");
    const revokeObjectURL = vi.fn();
    const clickDownload = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    render(<LocalChartWorkspace isLoggedIn={false} />);

    await user.click(
      screen.getAllByRole("button", { name: /새 차트 만들기/i })[1],
    );
    await user.click(screen.getByRole("button", { name: /CSV 내보내기/i }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickDownload).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:gantt-csv");
    expect(screen.getByRole("status")).toHaveTextContent("CSV 내보내기 완료");
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
