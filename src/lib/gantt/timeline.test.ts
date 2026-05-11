import { describe, expect, it } from "vitest";
import {
  addDays,
  buildGanttTimeline,
  buildGanttTimelineColumns,
  compareDateKeys,
  countTaskDays,
} from "./timeline";
import type { GanttTask } from "./types";

const makeTask = (patch: Partial<GanttTask>): GanttTask => ({
  id: "task-1",
  order: 0,
  taskName: "Task",
  category: "General",
  startDate: "2026-05-11",
  endDate: "2026-05-13",
  comment: "",
  type: "task",
  ...patch,
});

describe("timeline date helpers", () => {
  it("adds days and compares date keys", () => {
    expect(addDays("2026-05-11", 4)).toBe("2026-05-15");
    expect(compareDateKeys("2026-05-11", "2026-05-12")).toBeLessThan(0);
    expect(compareDateKeys("2026-05-12", "2026-05-11")).toBeGreaterThan(0);
  });

  it("counts task days while milestones have zero duration", () => {
    expect(countTaskDays(makeTask({}))).toBe(3);
    expect(countTaskDays(makeTask({ type: "milestone" }))).toBe(0);
  });
});

describe("buildGanttTimeline", () => {
  it("builds padded days and month groups from tasks", () => {
    const timeline = buildGanttTimeline([
      makeTask({ startDate: "2026-05-11", endDate: "2026-05-13" }),
      makeTask({ startDate: "2026-06-01", endDate: "2026-06-02" }),
    ]);

    expect(timeline.days[0]?.key).toBe("2026-05-10");
    expect(timeline.days.at(-1)?.key).toBe("2026-06-09");
    expect(timeline.months.map((month) => month.key)).toEqual([
      "2026-05",
      "2026-06",
    ]);
  });
});

describe("buildGanttTimelineColumns", () => {
  it("groups day headers using the configured column span", () => {
    const { days } = buildGanttTimeline([
      makeTask({ startDate: "2026-05-11", endDate: "2026-05-14" }),
    ]);

    const columns = buildGanttTimelineColumns(days, 2);

    expect(columns[0]).toEqual(
      expect.objectContaining({
        startIndex: 0,
        span: 2,
      }),
    );
    expect(columns.every((column) => column.span <= 2)).toBe(true);
  });
});
