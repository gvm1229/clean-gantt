import type { GanttTask } from "./types";

const REQUIRED_HEADERS = [
  "task name",
  "category",
  "start date",
  "end date",
  "comment",
] as const;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ParsedGanttCsvTask = Pick<
  GanttTask,
  "taskName" | "category" | "startDate" | "endDate" | "comment"
>;

function parseCsvRow(row: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const next = row[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (inQuotes) throw new Error("CSV 따옴표 형식 오류");

  cells.push(current);
  return cells;
}

function parseDateString(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;

  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function dateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const cell = String(value ?? "");
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function getGanttCsvTitle(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "Untitled Gantt Chart";

  const withoutExtension = trimmed.replace(/\.[^.]+$/, "").trim();
  return withoutExtension || "Untitled Gantt Chart";
}

export function makeGanttCsvFileName(title: string): string {
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return `${safeTitle || "gantt-chart"}.csv`;
}

export function parseGanttCsv(csvContent: string): ParsedGanttCsvTask[] {
  const normalized = csvContent
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const rows = normalized
    .split("\n")
    .map((row) => row.trimEnd())
    .filter((row) => row.trim().length > 0);

  if (rows.length === 0) throw new Error("CSV 내용이 비어 있습니다");

  const header = parseCsvRow(rows[0]).map((cell) => cell.trim().toLowerCase());

  if (
    header.length !== REQUIRED_HEADERS.length ||
    !header.every((cell, index) => cell === REQUIRED_HEADERS[index])
  ) {
    throw new Error(
      "CSV 헤더는 task name,category,start date,end date,comment 형식이어야 합니다",
    );
  }

  const tasks = rows.slice(1).map((row, index) => {
    const lineNumber = index + 2;
    const cells = parseCsvRow(row);

    if (cells.length !== REQUIRED_HEADERS.length) {
      throw new Error(`${lineNumber}행 컬럼 수가 5개가 아닙니다`);
    }

    const taskName = cells[0].trim();
    const category = cells[1].trim();
    const startDateRaw = cells[2].trim();
    const endDateRaw = cells[3].trim();
    const comment = cells[4].trim();
    const startDate = parseDateString(startDateRaw);
    const endDate = parseDateString(endDateRaw);

    if (!taskName) throw new Error(`${lineNumber}행 task name 누락`);
    if (!startDate) throw new Error(`${lineNumber}행 start date 형식 오류`);
    if (!endDate) throw new Error(`${lineNumber}행 end date 형식 오류`);
    if (startDate.getTime() > endDate.getTime()) {
      throw new Error(`${lineNumber}행 end date가 start date보다 빠릅니다`);
    }

    return {
      taskName,
      category,
      startDate: dateToKey(startDate),
      endDate: dateToKey(endDate),
      comment,
    } satisfies ParsedGanttCsvTask;
  });

  if (tasks.length === 0) throw new Error("CSV에 task가 없습니다");

  return tasks;
}

export function serializeGanttCsv(tasks: GanttTask[]): string {
  const rows = [
    REQUIRED_HEADERS.join(","),
    ...tasks.map((task) =>
      [task.taskName, task.category, task.startDate, task.endDate, task.comment]
        .map(escapeCsvCell)
        .join(","),
    ),
  ];

  return `${rows.join("\r\n")}\r\n`;
}
