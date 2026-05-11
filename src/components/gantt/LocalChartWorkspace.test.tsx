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
    expect(warning).toHaveTextContent("Browser-only mode is active");
    expect(warning).toHaveTextContent("saved only in this browser");
    expect(
      within(warning).getByRole("link", { name: /sign in with google/i }),
    ).toHaveAttribute("href", "/api/auth/signin/google");
    expect(
      within(warning).getByRole("link", { name: /github/i }),
    ).toHaveAttribute("href", "/api/auth/signin/github");
  });

  it("does not show the browser-only warning to signed-in users", async () => {
    render(<LocalChartWorkspace isLoggedIn />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      await screen.findByText("Signed-in persistence is available"),
    ).toBeVisible();
  });

  it("creates a starter chart and persists it to localStorage", async () => {
    const user = userEvent.setup();
    render(<LocalChartWorkspace isLoggedIn={false} />);

    await user.click(
      screen.getAllByRole("button", { name: /create local chart/i })[1],
    );

    expect(await screen.findByDisplayValue("Untitled Gantt 1")).toBeVisible();
    expect(screen.getByText("1 local chart")).toBeVisible();
    expect(screen.getByText("Timeline")).toBeVisible();
    expect(screen.getByDisplayValue("Project kickoff")).toBeVisible();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(
      expect.objectContaining({
        id: "test-id-1",
        title: "Untitled Gantt 1",
        tasks: expect.arrayContaining([
          expect.objectContaining({
            id: "test-id-2",
            taskName: "Project kickoff",
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
      screen.getAllByRole("button", { name: /create local chart/i })[1],
    );

    const firstTaskName = await screen.findByLabelText("Task name row 1");
    await user.clear(firstTaskName);
    await user.type(firstTaskName, "Research vendors");
    await user.clear(screen.getByLabelText("Progress row 1"));
    await user.type(screen.getByLabelText("Progress row 1"), "75");

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored[0].tasks[0]).toEqual(
      expect.objectContaining({
        taskName: "Research vendors",
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
          title: "Existing Roadmap",
          createdAt: "2026-05-10T00:00:00.000Z",
          updatedAt: "2026-05-11T00:00:00.000Z",
          tasks: [],
        },
      ]),
    );

    render(<LocalChartWorkspace isLoggedIn={false} />);

    expect(await screen.findByText("Existing Roadmap")).toBeVisible();
    expect(screen.getByText("1 local chart")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: /delete local copy/i }),
    );

    await waitFor(() =>
      expect(screen.queryByText("Existing Roadmap")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("0 local charts")).toBeVisible();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"),
    ).toEqual([]);
  });

  it("ignores corrupted localStorage data instead of crashing", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-json");

    render(<LocalChartWorkspace isLoggedIn={false} />);

    expect(await screen.findByText("0 local charts")).toBeVisible();
    expect(screen.getByText(/No local charts yet/i)).toBeVisible();
  });
});
