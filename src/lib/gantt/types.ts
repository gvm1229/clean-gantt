import type { ObjectId } from "mongodb";

export const GANTT_CHART_COLUMN_SPANS = [1, 2, 3, 5, 7] as const;

export type GanttChartColumnSpan = (typeof GANTT_CHART_COLUMN_SPANS)[number];
export type GanttTaskType = "task" | "milestone" | "summary";
export type GanttBarStyle = "rounded" | "square";

export type GanttTask = {
  id: string;
  order: number;
  taskName: string;
  category: string;
  startDate: string;
  endDate: string;
  comment: string;
  type: GanttTaskType;
  parentId?: string | null;
  collapsed?: boolean;
  progress?: number;
  dependency?: string;
  resourceIds?: string[];
  color?: string;
};

export type GanttResource = {
  id: string;
  name: string;
  color?: string;
};

export type GanttViewSettings = {
  columnSpan?: GanttChartColumnSpan;
  showComments?: boolean;
  showProgress?: boolean;
  showDependencies?: boolean;
};

export type GanttArchive = {
  id: string;
  ownerId: string;
  title: string;
  sourceFilename: string;
  csvContent: string;
  tasks: GanttTask[];
  resources: GanttResource[];
  categoryColors: Record<string, string>;
  barStyle: GanttBarStyle;
  viewSettings: GanttViewSettings;
  createdAt: string;
  updatedAt: string;
};

export type GanttArchiveDocument = Omit<
  GanttArchive,
  "id" | "createdAt" | "updatedAt"
> & {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type PortableGanttfolioFile = {
  format: "ganttfolio";
  version: 1;
  exportedAt: string;
  archive: Omit<GanttArchive, "id" | "ownerId" | "createdAt" | "updatedAt">;
};
