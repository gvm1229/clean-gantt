import {
  GANTT_CHART_COLUMN_SPANS,
  type GanttChartColumnSpan,
  type GanttTask,
} from "./types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type GanttTimelineDay = {
  key: string;
  dayNumber: number;
  weekdayLabel: string;
  isWeekend: boolean;
  monthKey: string;
};

export type GanttTimelineMonthGroup = {
  key: string;
  label: string;
  span: number;
};

export type GanttTimelineColumn = {
  key: string;
  startKey: string;
  endKey: string;
  startIndex: number;
  span: number;
  label: string;
  weekdayLabel: string;
};

export function addDays(dateKey: string, amount: number): string {
  const date = parseDate(dateKey) ?? new Date(`${todayKey()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateToKey(date);
}

export function todayKey(): string {
  return dateToKey(new Date());
}

export function compareDateKeys(a: string, b: string): number {
  const aDate = parseDate(a);
  const bDate = parseDate(b);
  if (!aDate || !bDate) return a.localeCompare(b);
  return aDate.getTime() - bDate.getTime();
}

export function countTaskDays(
  task: Pick<GanttTask, "startDate" | "endDate" | "type">,
): number {
  if (task.type === "milestone") return 0;
  const startDate = parseDate(task.startDate);
  const endDate = parseDate(task.endDate);
  if (!startDate || !endDate) return 0;
  return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}

function formatTimelineColumnLabel(
  start: GanttTimelineDay,
  end: GanttTimelineDay,
): string {
  const startMonth = Number(start.monthKey.slice(5));
  const endMonth = Number(end.monthKey.slice(5));

  if (start.key === end.key) return `${startMonth}.${start.dayNumber}`;

  return `${startMonth}.${start.dayNumber}-${endMonth}.${end.dayNumber}`;
}

export function buildGanttTimeline(tasks: GanttTask[]): {
  days: GanttTimelineDay[];
  months: GanttTimelineMonthGroup[];
} {
  if (tasks.length === 0) return { days: [], months: [] };

  const timestamps = tasks.flatMap((task) => {
    const startDate = parseDate(task.startDate);
    const endDate = parseDate(task.endDate);
    return [startDate?.getTime(), endDate?.getTime()].filter(
      (value): value is number => typeof value === "number",
    );
  });

  if (timestamps.length === 0) return { days: [], months: [] };

  const start = new Date(Math.min(...timestamps));
  const end = new Date(Math.max(...timestamps));
  start.setUTCDate(start.getUTCDate() - 1);
  end.setUTCDate(end.getUTCDate() + 7);

  const days: GanttTimelineDay[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    const key = dateToKey(cursor);
    const month = cursor.getUTCMonth() + 1;
    const weekday = cursor.getUTCDay();

    days.push({
      key,
      dayNumber: cursor.getUTCDate(),
      weekdayLabel: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday],
      isWeekend: weekday === 0 || weekday === 6,
      monthKey: `${cursor.getUTCFullYear()}-${String(month).padStart(2, "0")}`,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const months: GanttTimelineMonthGroup[] = [];
  for (const day of days) {
    const current = months[months.length - 1];
    if (current?.key === day.monthKey) {
      current.span += 1;
    } else {
      months.push({
        key: day.monthKey,
        label: day.monthKey.replace("-", "."),
        span: 1,
      });
    }
  }

  return { days, months };
}

export function buildGanttTimelineColumns(
  days: GanttTimelineDay[],
  columnSpan: GanttChartColumnSpan,
): GanttTimelineColumn[] {
  const columns: GanttTimelineColumn[] = [];

  for (let index = 0; index < days.length; index += columnSpan) {
    const columnDays = days.slice(index, index + columnSpan);
    const start = columnDays[0];
    const end = columnDays[columnDays.length - 1];
    if (!start || !end) continue;

    columns.push({
      key: `${start.key}:${end.key}`,
      startKey: start.key,
      endKey: end.key,
      startIndex: index,
      span: columnDays.length,
      label: formatTimelineColumnLabel(start, end),
      weekdayLabel:
        start.key === end.key
          ? start.weekdayLabel
          : `${start.weekdayLabel}-${end.weekdayLabel}`,
    });
  }

  return columns;
}

export function isGanttChartColumnSpan(
  value: number,
): value is GanttChartColumnSpan {
  return GANTT_CHART_COLUMN_SPANS.includes(value as GanttChartColumnSpan);
}
