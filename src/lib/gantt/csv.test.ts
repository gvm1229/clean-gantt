import { describe, expect, it } from "vitest";
import {
  getGanttCsvTitle,
  makeGanttCsvFileName,
  parseGanttCsv,
  serializeGanttCsv,
} from "./csv";
import type { GanttTask } from "./types";

const csvHeader = "task name,category,start date,end date,comment";

describe("gantt csv helpers", () => {
  it("parses valid CSV rows with BOM, quoted commas, and escaped quotes", () => {
    const tasks = parseGanttCsv(
      `\uFEFF${csvHeader}\r\n"Design, Alpha",Planning,2026-05-01,2026-05-03,"say ""go"""\r\nBuild,Dev,2026-05-04,2026-05-05,Done\r\n`,
    );

    expect(tasks).toEqual([
      {
        taskName: "Design, Alpha",
        category: "Planning",
        startDate: "2026-05-01",
        endDate: "2026-05-03",
        comment: 'say "go"',
      },
      {
        taskName: "Build",
        category: "Dev",
        startDate: "2026-05-04",
        endDate: "2026-05-05",
        comment: "Done",
      },
    ]);
  });

  it("rejects invalid headers, missing tasks, bad dates, and reversed ranges", () => {
    expect(() =>
      parseGanttCsv(
        "name,category,start,end,comment\nA,B,2026-05-01,2026-05-02,",
      ),
    ).toThrow(/CSV/);
    expect(() => parseGanttCsv(`${csvHeader}\n`)).toThrow(/task/);
    expect(() =>
      parseGanttCsv(`${csvHeader}\nA,B,2026-02-31,2026-03-01,`),
    ).toThrow(/start date/);
    expect(() =>
      parseGanttCsv(`${csvHeader}\nA,B,2026-05-03,2026-05-01,`),
    ).toThrow(/end date/);
  });

  it("serializes tasks with CSV escaping and reusable file titles", () => {
    const tasks: GanttTask[] = [
      {
        id: "task-1",
        order: 0,
        taskName: "Design, Alpha",
        category: "Planning",
        startDate: "2026-05-01",
        endDate: "2026-05-03",
        comment: 'say "go"',
        type: "task",
        parentId: null,
        collapsed: false,
        progress: 50,
        dependency: "",
        resourceIds: [],
        color: "",
      },
    ];

    expect(serializeGanttCsv(tasks)).toBe(
      `${csvHeader}\r\n"Design, Alpha",Planning,2026-05-01,2026-05-03,"say ""go"""\r\n`,
    );
    expect(getGanttCsvTitle(" roadmap.csv ")).toBe("roadmap");
    expect(makeGanttCsvFileName("Roadmap: Q2/Launch?")).toBe(
      "Roadmap- Q2-Launch-.csv",
    );
  });
});
