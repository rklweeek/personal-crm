import { sql } from "drizzle-orm";
import { connection } from "next/server";

import { db } from "@/db";

/**
 * Health check for the deploy smoke test and the container healthcheck:
 * 200 when the app is up and the database answers, 503 otherwise.
 * `version` is the commit the running image was built from.
 */
export async function GET() {
  // Always answer at request time, never from a build-time prerender.
  await connection();
  const version = process.env.APP_VERSION ?? "dev";
  const headers = { "Cache-Control": "no-store" };

  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    console.error("Health check: database is unavailable", error);
    return Response.json({ status: "error", version }, { status: 503, headers });
  }

  return Response.json({ status: "ok", version }, { headers });
}
