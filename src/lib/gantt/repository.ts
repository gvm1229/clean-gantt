import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { normalizeBarStyle, normalizeGanttTasks } from "./validation";
import type { GanttArchive, GanttArchiveDocument } from "./types";

const COLLECTION_NAME = "gantt_archives";

async function collection(): Promise<Collection<GanttArchiveDocument>> {
  const db = await getDb();
  return db.collection<GanttArchiveDocument>(COLLECTION_NAME);
}

export function archiveDocumentToDto(
  document: GanttArchiveDocument,
): GanttArchive {
  return {
    id: document._id.toHexString(),
    ownerId: document.ownerId,
    title: document.title,
    sourceFilename: document.sourceFilename,
    csvContent: document.csvContent,
    tasks: document.tasks,
    resources: document.resources ?? [],
    categoryColors: document.categoryColors ?? {},
    barStyle: normalizeBarStyle(document.barStyle),
    viewSettings: document.viewSettings ?? {},
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

/**
 * Lists Gantt archives for the authenticated owner.
 */
export async function listArchives(ownerId: string): Promise<GanttArchive[]> {
  const docs = await (await collection())
    .find({ ownerId, deletedAt: null })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(archiveDocumentToDto);
}

/**
 * Creates the initial MongoDB indexes for archive browsing and ownership scoping.
 */
export async function ensureGanttIndexes(): Promise<void> {
  const archives = await collection();
  await archives.createIndexes([
    { key: { ownerId: 1, createdAt: -1 }, name: "idx_owner_created_at" },
    { key: { ownerId: 1, updatedAt: -1 }, name: "idx_owner_updated_at" },
    { key: { ownerId: 1, title: 1 }, name: "idx_owner_title" },
  ]);
}

export function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export function makeArchiveInsert(input: {
  ownerId: string;
  title: string;
  tasks: unknown;
}): Omit<GanttArchiveDocument, "_id"> {
  const now = new Date();
  return {
    ownerId: input.ownerId,
    title: input.title.trim(),
    sourceFilename: "",
    csvContent: "",
    tasks: normalizeGanttTasks(input.tasks),
    resources: [],
    categoryColors: {},
    barStyle: "rounded",
    viewSettings: {
      columnSpan: 1,
      showComments: false,
      showProgress: true,
      showDependencies: true,
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
