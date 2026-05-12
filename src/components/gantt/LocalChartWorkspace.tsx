"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  GripVertical,
  Milestone,
  Plus,
  Search,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { OAuthSignInLinks } from "@/components/auth/OAuthSignInLinks";
import type { GanttTask, GanttTaskType } from "@/lib/gantt/types";
import { normalizeGanttTasks } from "@/lib/gantt/validation";
import {
  addDays,
  buildGanttTimeline,
  buildGanttTimelineColumns,
  compareDateKeys,
  countTaskDays,
  isGanttChartColumnSpan,
  todayKey,
} from "@/lib/gantt/timeline";

const STORAGE_KEY = "ganttfolio.localCharts.v1";
const ROW_HEIGHT = 44;
const BASE_DAY_WIDTH = 34;
const DEFAULT_COLOR = "#14b8a6";
const CATEGORY_COLORS = [
  "#14b8a6",
  "#2563eb",
  "#a855f7",
  "#f97316",
  "#16a34a",
  "#dc2626",
  "#64748b",
];

type LocalChart = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tasks: GanttTask[];
  categoryColors: Record<string, string>;
  columnSpan: 1 | 2 | 3 | 5 | 7;
};

type TaskPatch = Partial<
  Pick<
    GanttTask,
    | "taskName"
    | "category"
    | "startDate"
    | "endDate"
    | "progress"
    | "dependency"
    | "color"
    | "type"
  >
>;

const makeId = () => crypto.randomUUID();
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ko-KR");
const clampZoom = (value: number) => Math.min(2, Math.max(0.55, value));

function getCategoryColor(category: string, colors: Record<string, string>) {
  if (!category) return DEFAULT_COLOR;
  return colors[category] ?? DEFAULT_COLOR;
}

function makeTask(order: number, patch: Partial<GanttTask> = {}): GanttTask {
  const startDate = patch.startDate ?? addDays(todayKey(), order * 3);
  const endDate =
    patch.endDate ?? addDays(startDate, patch.type === "milestone" ? 0 : 4);

  return {
    id: patch.id ?? makeId(),
    order,
    taskName: patch.taskName ?? `작업 ${order + 1}`,
    category: patch.category ?? "일반",
    startDate,
    endDate,
    comment: patch.comment ?? "",
    type: patch.type ?? "task",
    parentId: patch.parentId ?? null,
    collapsed: patch.collapsed ?? false,
    progress: patch.progress ?? 0,
    dependency: patch.dependency ?? "",
    resourceIds: patch.resourceIds ?? [],
    color: patch.color ?? "",
  };
}

function makeStarterTasks(): GanttTask[] {
  const today = todayKey();
  return [
    makeTask(0, {
      taskName: "프로젝트 시작",
      category: "계획",
      startDate: today,
      endDate: addDays(today, 2),
      progress: 60,
    }),
    makeTask(1, {
      taskName: "일정 설계",
      category: "디자인",
      startDate: addDays(today, 3),
      endDate: addDays(today, 7),
      progress: 35,
      dependency: "1FS",
    }),
    makeTask(2, {
      taskName: "출시 마일스톤",
      category: "출시",
      startDate: addDays(today, 9),
      endDate: addDays(today, 9),
      type: "milestone",
      dependency: "2FS",
    }),
  ];
}

function makeStarterChart(nextIndex: number): LocalChart {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    title: `새 Gantt ${nextIndex}`,
    createdAt: now,
    updatedAt: now,
    tasks: makeStarterTasks(),
    categoryColors: {
      계획: CATEGORY_COLORS[0],
      디자인: CATEGORY_COLORS[1],
      출시: CATEGORY_COLORS[3],
    },
    columnSpan: 1,
  };
}

function normalizeChart(value: unknown, index: number): LocalChart | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const now = new Date().toISOString();
  const rawTasks = Array.isArray(row.tasks) ? row.tasks : [];
  let tasks: GanttTask[];

  try {
    tasks = normalizeGanttTasks(rawTasks).map((task, order) => ({
      ...task,
      order,
    }));
  } catch {
    tasks = [];
  }

  const columnSpan = Number(row.columnSpan);

  return {
    id: typeof row.id === "string" && row.id ? row.id : makeId(),
    title:
      typeof row.title === "string" && row.title.trim()
        ? row.title.trim()
        : `새 Gantt ${index + 1}`,
    createdAt:
      typeof row.createdAt === "string" && row.createdAt ? row.createdAt : now,
    updatedAt:
      typeof row.updatedAt === "string" && row.updatedAt ? row.updatedAt : now,
    tasks,
    categoryColors:
      row.categoryColors &&
      typeof row.categoryColors === "object" &&
      !Array.isArray(row.categoryColors)
        ? (row.categoryColors as Record<string, string>)
        : {},
    columnSpan: isGanttChartColumnSpan(columnSpan) ? columnSpan : 1,
  };
}

function readLocalCharts(): LocalChart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .map((chart, index) => normalizeChart(chart, index))
          .filter((chart): chart is LocalChart => chart !== null)
      : [];
  } catch {
    return [];
  }
}

function writeLocalCharts(charts: LocalChart[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

function updateTaskDates(task: GanttTask, patch: TaskPatch): GanttTask {
  const next = { ...task, ...patch };

  if (next.type === "milestone") {
    next.endDate = next.startDate;
  } else if (compareDateKeys(next.startDate, next.endDate) > 0) {
    if (patch.startDate) next.endDate = next.startDate;
    if (patch.endDate) next.startDate = next.endDate;
  }

  return next;
}

function GanttTimeline({ chart }: { chart: LocalChart }) {
  const [zoom, setZoom] = useState(1);
  const { days, months } = useMemo(
    () => buildGanttTimeline(chart.tasks),
    [chart.tasks],
  );
  const columns = useMemo(
    () => buildGanttTimelineColumns(days, chart.columnSpan),
    [chart.columnSpan, days],
  );
  const dayIndexMap = useMemo(
    () => new Map(days.map((day, index) => [day.key, index])),
    [days],
  );
  const dayWidth = Math.round(BASE_DAY_WIDTH * zoom);
  const timelineWidth = Math.max(days.length * dayWidth, 720);

  return (
    <div
      aria-label="Gantt 일정표"
      className="min-w-0 flex-1 overflow-auto border-l border-slate-200 bg-white"
      role="region"
    >
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            일정표
          </p>
          <p className="text-xs text-slate-500">
            총 {days.length}일 · {chart.columnSpan}일 간격
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={() => setZoom((value) => clampZoom(value / 1.15))}
            aria-label="일정표 축소"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={() => setZoom(1)}
          >
            맞춤
          </button>
          <button
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={() => setZoom((value) => clampZoom(value * 1.15))}
            aria-label="일정표 확대"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div style={{ width: timelineWidth }}>
        <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white">
          <div className="flex h-8">
            {months.map((month) => (
              <div
                className="border-r border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700"
                key={month.key}
                style={{ width: month.span * dayWidth }}
              >
                {month.label}
              </div>
            ))}
          </div>
          <div className="relative flex h-8">
            {columns.map((column) => (
              <div
                className="border-r border-slate-200 px-1 text-center text-xs font-semibold text-slate-700"
                key={column.key}
                style={{ width: column.span * dayWidth }}
              >
                <span>{column.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          {days.map((day, index) => (
            <div
              aria-hidden="true"
              className={`absolute top-0 bottom-0 border-r border-slate-200 ${
                day.isWeekend ? "bg-slate-50" : "bg-transparent"
              }`}
              key={day.key}
              style={{ left: index * dayWidth, width: dayWidth }}
            />
          ))}

          {chart.tasks.map((task, index) => {
            const startIndex = dayIndexMap.get(task.startDate) ?? 0;
            const endIndex = dayIndexMap.get(task.endDate) ?? startIndex;
            const width = Math.max(
              (endIndex - startIndex + 1) * dayWidth - 8,
              12,
            );
            const left = startIndex * dayWidth + 4;
            const top = index * ROW_HEIGHT + 8;
            const color =
              task.color ||
              getCategoryColor(task.category, chart.categoryColors);
            const progress = Math.max(0, Math.min(100, task.progress ?? 0));

            return (
              <div
                className="relative border-b border-slate-100"
                key={`${task.id}-row-track`}
                style={{ height: ROW_HEIGHT }}
              >
                {task.type === "milestone" ? (
                  <div
                    aria-label={`${task.taskName} 마일스톤`}
                    className="absolute h-5 w-5 rotate-45 rounded-sm shadow-sm"
                    style={{ left, top: top + 4, backgroundColor: color }}
                  />
                ) : (
                  <div
                    aria-label={`${task.taskName} 일정 막대`}
                    className="absolute overflow-hidden rounded-md bg-slate-300 text-xs font-semibold text-white shadow-sm"
                    style={{
                      left,
                      top,
                      width,
                      height: 24,
                      backgroundColor: color,
                    }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-black/20"
                      style={{ width: `${progress}%` }}
                    />
                    <span className="relative z-10 block truncate px-2 leading-6">
                      {task.taskName}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GanttEditor({
  chart,
  onPatchChart,
  onAddTask,
  onDeleteTask,
}: {
  chart: LocalChart;
  onPatchChart: (patch: Partial<LocalChart>) => void;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredTasks = chart.tasks.filter((task) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [task.taskName, task.category, task.dependency]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const updateTask = (taskId: string, patch: TaskPatch) => {
    onPatchChart({
      tasks: chart.tasks.map((task) =>
        task.id === taskId ? updateTaskDates(task, patch) : task,
      ),
    });
  };

  const updateCategoryColor = (category: string, color: string) => {
    onPatchChart({
      categoryColors: { ...chart.categoryColors, [category]: color },
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex min-w-[18rem] flex-1 items-center gap-3">
          <CalendarDays className="h-5 w-5 text-teal-600" />
          <input
            aria-label="차트 제목"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-teal-400"
            value={chart.title}
            onChange={(event) => onPatchChart({ title: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            간격
            <select
              className="bg-transparent outline-none"
              value={chart.columnSpan}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (isGanttChartColumnSpan(value))
                  onPatchChart({ columnSpan: value });
              }}
            >
              {[1, 2, 3, 5, 7].map((span) => (
                <option key={span} value={span}>
                  {span}일
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4" />
            <input
              aria-label="작업 검색"
              className="w-32 bg-transparent outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="검색"
            />
          </label>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            type="button"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4" />
            작업 추가
          </button>
        </div>
      </div>

      <div className="flex h-[640px] min-h-0">
        <div className="w-[680px] shrink-0 overflow-auto border-r border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_#e2e8f0]">
              <tr className="text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <th className="w-10 px-2 py-3" />
                <th className="w-12 px-2 py-3">ID</th>
                <th className="min-w-48 px-2 py-3">작업명</th>
                <th className="w-28 px-2 py-3">시작</th>
                <th className="w-28 px-2 py-3">종료</th>
                <th className="w-24 px-2 py-3">기간</th>
                <th className="w-24 px-2 py-3">진행률 %</th>
                <th className="w-28 px-2 py-3">선행 작업</th>
                <th className="w-28 px-2 py-3">색상</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, visibleIndex) => {
                const absoluteIndex = chart.tasks.findIndex(
                  (item) => item.id === task.id,
                );
                const color =
                  task.color ||
                  getCategoryColor(task.category, chart.categoryColors);

                return (
                  <tr
                    className="border-b border-slate-100 hover:bg-teal-50/40"
                    key={task.id}
                    style={{ height: ROW_HEIGHT }}
                  >
                    <td className="px-2 text-slate-300">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-2 font-mono text-xs text-slate-500">
                      {absoluteIndex + 1}
                    </td>
                    <td className="px-2">
                      <div className="flex items-center gap-2">
                        {task.type === "milestone" ? (
                          <Milestone className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        )}
                        <input
                          aria-label={`${absoluteIndex + 1}행 작업명`}
                          className="min-w-36 flex-1 bg-transparent font-medium text-slate-900 outline-none"
                          value={task.taskName}
                          onChange={(event) =>
                            updateTask(task.id, {
                              taskName: event.target.value,
                            })
                          }
                        />
                      </div>
                    </td>
                    <td className="px-2">
                      <input
                        aria-label={`${absoluteIndex + 1}행 시작일`}
                        className="w-32 bg-transparent outline-none"
                        type="date"
                        value={task.startDate}
                        onChange={(event) =>
                          updateTask(task.id, { startDate: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-2">
                      <input
                        aria-label={`${absoluteIndex + 1}행 종료일`}
                        className="w-32 bg-transparent outline-none"
                        type="date"
                        value={task.endDate}
                        onChange={(event) =>
                          updateTask(task.id, { endDate: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 text-slate-600">
                      {countTaskDays(task)}일
                    </td>
                    <td className="px-2">
                      <input
                        aria-label={`${absoluteIndex + 1}행 진행률`}
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-teal-400"
                        max={100}
                        min={0}
                        type="number"
                        value={task.progress ?? 0}
                        onChange={(event) =>
                          updateTask(task.id, {
                            progress: Math.max(
                              0,
                              Math.min(100, Number(event.target.value) || 0),
                            ),
                          })
                        }
                      />
                    </td>
                    <td className="px-2">
                      <input
                        aria-label={`${absoluteIndex + 1}행 선행 작업`}
                        className="w-24 bg-transparent outline-none"
                        placeholder={
                          visibleIndex === 0 ? "" : `${absoluteIndex}FS`
                        }
                        value={task.dependency ?? ""}
                        onChange={(event) =>
                          updateTask(task.id, {
                            dependency: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="px-2">
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={`${absoluteIndex + 1}행 분류`}
                          className="w-24 bg-transparent outline-none"
                          value={task.category}
                          onChange={(event) =>
                            updateTask(task.id, {
                              category: event.target.value,
                            })
                          }
                        />
                        <input
                          aria-label={`${absoluteIndex + 1}행 색상`}
                          className="h-7 w-8 rounded border border-slate-200 bg-white"
                          type="color"
                          value={color}
                          onChange={(event) => {
                            updateTask(task.id, { color: event.target.value });
                            if (task.category) {
                              updateCategoryColor(
                                task.category,
                                event.target.value,
                              );
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-2">
                      <select
                        aria-label={`${absoluteIndex + 1}행 작업 유형`}
                        className="mb-1 w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none"
                        value={task.type}
                        onChange={(event) =>
                          updateTask(task.id, {
                            type: event.target.value as GanttTaskType,
                          })
                        }
                      >
                        <option value="task">작업</option>
                        <option value="milestone">마일스톤</option>
                        <option value="summary">요약</option>
                      </select>
                      <button
                        aria-label={`${absoluteIndex + 1}행 작업 삭제`}
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <GanttTimeline chart={{ ...chart, tasks: filteredTasks }} />
      </div>
    </div>
  );
}

export function LocalChartWorkspace({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [charts, setCharts] = useState<LocalChart[]>([]);
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedCharts = readLocalCharts();
    setCharts(storedCharts);
    setActiveChartId(storedCharts[0]?.id ?? null);
    setLoaded(true);
  }, []);

  const sortedCharts = useMemo(
    () => [...charts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [charts],
  );
  const activeChart =
    charts.find((chart) => chart.id === activeChartId) ?? null;

  const persist = (nextCharts: LocalChart[], nextActiveId = activeChartId) => {
    setCharts(nextCharts);
    setActiveChartId(nextActiveId);
    writeLocalCharts(nextCharts);
  };

  const createChart = () => {
    const chart = makeStarterChart(charts.length + 1);
    persist([chart, ...charts], chart.id);
  };

  const patchActiveChart = (patch: Partial<LocalChart>) => {
    if (!activeChart) return;
    const updatedAt = new Date().toISOString();
    persist(
      charts.map((chart) =>
        chart.id === activeChart.id ? { ...chart, ...patch, updatedAt } : chart,
      ),
      activeChart.id,
    );
  };

  const addTask = () => {
    if (!activeChart) return;
    patchActiveChart({
      tasks: [...activeChart.tasks, makeTask(activeChart.tasks.length)],
    });
  };

  const deleteTask = (taskId: string) => {
    if (!activeChart) return;
    patchActiveChart({
      tasks: activeChart.tasks
        .filter((task) => task.id !== taskId)
        .map((task, order) => ({ ...task, order })),
    });
  };

  const deleteChart = (id: string) => {
    const nextCharts = charts.filter((chart) => chart.id !== id);
    const nextActiveId =
      id === activeChartId ? (nextCharts[0]?.id ?? null) : activeChartId;
    persist(nextCharts, nextActiveId);
  };

  return (
    <section className="space-y-5">
      {!isLoggedIn && (
        <div
          role="alert"
          className="sticky top-4 z-30 rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-lg shadow-amber-900/10"
        >
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-2">
              <h2 className="font-semibold">브라우저 저장 모드입니다</h2>
              <p className="text-sm leading-6">
                지금 바로 Gantt 차트를 만들고 편집할 수 있어요. 로그인하기
                전에는 이 브라우저의 localStorage에만 저장되며, 브라우저
                데이터를 지우거나 다른 기기를 쓰면 사라질 수 있습니다.
              </p>
              <OAuthSignInLinks />
            </div>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5 text-teal-950">
          <h2 className="font-semibold">로그인 저장을 사용할 수 있어요</h2>
          <p className="mt-1 text-sm">
            로컬 초안은 계속 편집할 수 있습니다. 다음 단계에서는 계정별 차트를
            MongoDB에 저장할 예정입니다.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">내 브라우저 차트</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loaded ? `${charts.length}개 차트` : "차트 불러오는 중..."}
              </p>
            </div>
            <button
              className="rounded-full bg-teal-600 p-2 text-white hover:bg-teal-700"
              type="button"
              onClick={createChart}
              aria-label="새 차트 만들기"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            type="button"
            onClick={createChart}
          >
            <Plus className="h-4 w-4" />새 차트 만들기
          </button>

          <div className="mt-4 space-y-2">
            {sortedCharts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                아직 차트가 없어요. 새 차트를 만들어 작업표와 일정을 편집해
                보세요.
              </div>
            ) : (
              sortedCharts.map((chart) => (
                <article
                  className={`rounded-2xl border p-3 ${
                    chart.id === activeChartId
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-white"
                  }`}
                  key={chart.id}
                >
                  <button
                    className="block w-full text-left"
                    type="button"
                    onClick={() => setActiveChartId(chart.id)}
                  >
                    <h3 className="font-semibold text-slate-900">
                      {chart.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      작업 {chart.tasks.length}개 ·{" "}
                      {formatDateTime(chart.updatedAt)}
                      업데이트
                    </p>
                  </button>
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    type="button"
                    onClick={() => deleteChart(chart.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    로컬 사본 삭제
                  </button>
                </article>
              ))
            )}
          </div>
        </aside>

        {activeChart ? (
          <GanttEditor
            chart={activeChart}
            onPatchChart={patchActiveChart}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
          />
        ) : (
          <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="max-w-md space-y-3">
              <h2 className="text-2xl font-bold text-slate-950">
                차트를 만들고 편집을 시작하세요
              </h2>
              <p className="text-slate-500">
                표처럼 작업을 입력하고 일정 막대를 바로 확인할 수 있어요. 로컬
                자동 저장, 진행률, 마일스톤, 선행 작업, 분류, 색상을 지원합니다.
              </p>
              <button
                className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                type="button"
                onClick={createChart}
              >
                새 차트 만들기
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
