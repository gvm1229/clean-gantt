import { describe, expect, it } from "vitest";
import {
  findDuplicateTaskNameInCategory,
  normalizeBarStyle,
  normalizeColumnSpan,
  normalizeGanttTasks,
} from "./validation";

describe("normalizeGanttTasks", () => {
  it("normalizes legacy task-like input into future-safe task shape", () => {
    const tasks = normalizeGanttTasks([
      {
        taskName: "Design",
        category: "UX",
        startDate: "2026-05-11",
        endDate: "2026-05-13",
        comment: "Wireframes",
        progress: 42.2,
      },
    ]);

    expect(tasks).toEqual([
      expect.objectContaining({
        id: "task-1",
        order: 0,
        taskName: "Design",
        category: "UX",
        startDate: "2026-05-11",
        endDate: "2026-05-13",
        comment: "Wireframes",
        type: "task",
        progress: 42,
      }),
    ]);
  });

  it("forces milestone end date to start date", () => {
    const [task] = normalizeGanttTasks([
      {
        taskName: "Launch",
        category: "Release",
        startDate: "2026-05-20",
        endDate: "2026-05-22",
        comment: "",
        type: "milestone",
      },
    ]);

    expect(task?.endDate).toBe("2026-05-20");
  });

  it("rejects inverted dates", () => {
    expect(() =>
      normalizeGanttTasks([
        {
          taskName: "Bad",
          category: "QA",
          startDate: "2026-05-13",
          endDate: "2026-05-11",
          comment: "",
        },
      ]),
    ).toThrow("ends before it starts");
  });
});

describe("Gantt settings normalization", () => {
  it("finds duplicate task names inside the same category", () => {
    const tasks = normalizeGanttTasks([
      {
        taskName: "Build",
        category: "Eng",
        startDate: "2026-05-11",
        endDate: "2026-05-12",
        comment: "",
      },
      {
        taskName: "Build",
        category: "Eng",
        startDate: "2026-05-13",
        endDate: "2026-05-14",
        comment: "",
      },
    ]);

    expect(findDuplicateTaskNameInCategory(tasks)).toEqual({
      taskName: "Build",
      category: "Eng",
    });
  });

  it("normalizes bar style and column span", () => {
    expect(normalizeBarStyle("square")).toBe("square");
    expect(normalizeBarStyle("pill")).toBe("rounded");
    expect(normalizeColumnSpan(5)).toBe(5);
    expect(normalizeColumnSpan(4)).toBe(1);
  });
});
