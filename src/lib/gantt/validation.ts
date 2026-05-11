import {
  GANTT_CHART_COLUMN_SPANS,
  type GanttBarStyle,
  type GanttChartColumnSpan,
  type GanttTask,
} from "./types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeProgress(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const progress = Number(value);
  if (!Number.isFinite(progress)) return undefined;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Normalizes task input into the future-safe Ganttfolio task shape.
 */
export function normalizeGanttTasks(value: unknown): GanttTask[] {
  if (!Array.isArray(value)) throw new Error("Gantt tasks must be an array");

  return value.map((item, index) => {
    if (!item || typeof item !== "object")
      throw new Error(`Task ${index + 1} has invalid shape`);
    const row = item as Record<string, unknown>;
    const taskName =
      typeof row.taskName === "string" ? row.taskName.trim() : "";
    const category =
      typeof row.category === "string" ? row.category.trim() : "";
    const startDateRaw =
      typeof row.startDate === "string" ? row.startDate.trim() : "";
    const endDateRaw =
      typeof row.endDate === "string" ? row.endDate.trim() : "";
    const comment = typeof row.comment === "string" ? row.comment.trim() : "";
    const startDate = parseDate(startDateRaw);
    const endDate = parseDate(endDateRaw);

    if (!taskName) throw new Error(`Task ${index + 1} requires a name`);
    if (!startDate || !endDate)
      throw new Error(`Task ${index + 1} requires YYYY-MM-DD dates`);
    if (startDate.getTime() > endDate.getTime())
      throw new Error(`Task ${index + 1} ends before it starts`);

    const type =
      row.type === "milestone" || row.type === "summary" ? row.type : "task";

    return {
      id:
        typeof row.id === "string" && row.id.trim()
          ? row.id.trim()
          : `task-${index + 1}`,
      order:
        typeof row.order === "number" && Number.isFinite(row.order)
          ? row.order
          : index,
      taskName,
      category,
      startDate: dateToKey(startDate),
      endDate: type === "milestone" ? dateToKey(startDate) : dateToKey(endDate),
      comment,
      type,
      parentId:
        typeof row.parentId === "string" && row.parentId.trim()
          ? row.parentId.trim()
          : null,
      collapsed: row.collapsed === true,
      progress: normalizeProgress(row.progress),
      dependency:
        typeof row.dependency === "string" ? row.dependency.trim() : "",
      resourceIds: Array.isArray(row.resourceIds)
        ? row.resourceIds.filter((id): id is string => typeof id === "string")
        : [],
      color: typeof row.color === "string" ? row.color.trim() : "",
    } satisfies GanttTask;
  });
}

/**
 * Finds duplicate task names within the same category.
 */
export function findDuplicateTaskNameInCategory(
  tasks: GanttTask[],
): { taskName: string; category: string } | null {
  const seen = new Set<string>();
  for (const task of tasks) {
    const key = `${task.category}\u0000${task.taskName}`;
    if (seen.has(key))
      return { taskName: task.taskName, category: task.category };
    seen.add(key);
  }
  return null;
}

export function normalizeBarStyle(value: unknown): GanttBarStyle {
  return value === "square" ? "square" : "rounded";
}

export function normalizeColumnSpan(value: unknown): GanttChartColumnSpan {
  return typeof value === "number" &&
    GANTT_CHART_COLUMN_SPANS.includes(value as GanttChartColumnSpan)
    ? (value as GanttChartColumnSpan)
    : 1;
}
