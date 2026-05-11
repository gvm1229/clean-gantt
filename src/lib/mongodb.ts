import { MongoClient, ServerApiVersion, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "clean_gantt";
const appName = process.env.MONGODB_APP_NAME ?? "clean-gantt";

type MongoGlobal = typeof globalThis & {
  _cleanGanttMongoClient?: Promise<MongoClient>;
};

/**
 * Returns a cached MongoClient promise for hot reload and serverless reuse.
 */
export function getMongoClient(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not configured");

  const globalRef = globalThis as MongoGlobal;
  globalRef._cleanGanttMongoClient ??= MongoClient.connect(uri, {
    appName,
    retryWrites: true,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  return globalRef._cleanGanttMongoClient;
}

/**
 * Returns the configured application database.
 */
export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
