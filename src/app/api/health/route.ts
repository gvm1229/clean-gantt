import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ ok: true, mongo: "connected" });
  } catch (error) {
    console.error("[health] MongoDB ping failed", error);
    return NextResponse.json(
      {
        ok: false,
        mongo: "unavailable",
      },
      { status: 503 },
    );
  }
}
