import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW() as now");

    return Response.json(
      {
        ok: true,
        now: result.rows[0].now,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}