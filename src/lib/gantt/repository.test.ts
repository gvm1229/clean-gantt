import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import {
  archiveDocumentToDto,
  makeArchiveInsert,
  toObjectId,
} from "./repository";
import type { GanttArchiveDocument } from "./types";

describe("archiveDocumentToDto", () => {
  it("serializes MongoDB documents into API-safe DTOs", () => {
    const document = {
      _id: new ObjectId("64b64c26d2bbf889d2f7fc4f"),
      ownerId: "user-1",
      title: "Launch Plan",
      sourceFilename: "launch.csv",
      csvContent: "taskName,startDate,endDate",
      tasks: [
        {
          id: "task-1",
          order: 0,
          taskName: "Build",
          category: "Engineering",
          startDate: "2026-05-11",
          endDate: "2026-05-12",
          comment: "",
          type: "task",
        },
      ],
      resources: undefined,
      categoryColors: undefined,
      barStyle: "invalid",
      viewSettings: undefined,
      createdAt: new Date("2026-05-11T00:00:00.000Z"),
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
      deletedAt: null,
    } as unknown as GanttArchiveDocument;

    expect(archiveDocumentToDto(document)).toEqual({
      id: "64b64c26d2bbf889d2f7fc4f",
      ownerId: "user-1",
      title: "Launch Plan",
      sourceFilename: "launch.csv",
      csvContent: "taskName,startDate,endDate",
      tasks: document.tasks,
      resources: [],
      categoryColors: {},
      barStyle: "rounded",
      viewSettings: {},
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z",
    });
  });
});

describe("makeArchiveInsert", () => {
  it("trims the title and normalizes task input for persistence", () => {
    const insert = makeArchiveInsert({
      ownerId: "user-1",
      title: "  Launch Plan  ",
      tasks: [
        {
          taskName: "  Build  ",
          category: " Engineering ",
          startDate: "2026-05-11",
          endDate: "2026-05-12",
          comment: " Ship it ",
          progress: 150,
        },
      ],
    });

    expect(insert).toEqual(
      expect.objectContaining({
        ownerId: "user-1",
        title: "Launch Plan",
        sourceFilename: "",
        csvContent: "",
        resources: [],
        categoryColors: {},
        barStyle: "rounded",
        viewSettings: {
          columnSpan: 1,
          showComments: false,
          showProgress: true,
          showDependencies: true,
        },
        deletedAt: null,
      }),
    );
    expect(insert.tasks).toEqual([
      expect.objectContaining({
        taskName: "Build",
        category: "Engineering",
        comment: "Ship it",
        progress: 100,
      }),
    ]);
    expect(insert.createdAt).toBeInstanceOf(Date);
    expect(insert.updatedAt).toBeInstanceOf(Date);
  });
});

describe("toObjectId", () => {
  it("returns an ObjectId for valid ids and null for invalid ids", () => {
    const valid = toObjectId("64b64c26d2bbf889d2f7fc4f");

    expect(valid).toBeInstanceOf(ObjectId);
    expect(valid?.toHexString()).toBe("64b64c26d2bbf889d2f7fc4f");
    expect(toObjectId("not-an-object-id")).toBeNull();
  });
});
