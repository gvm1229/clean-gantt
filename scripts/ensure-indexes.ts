import { ensureGanttIndexes } from "@/lib/gantt/repository";

await ensureGanttIndexes();
console.log("MongoDB indexes ensured for clean-gantt");
