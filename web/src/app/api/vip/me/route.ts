import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT p.steamid, p.player_name, p.vip_group, p.expire_date, p.preferences,
            g.group_name, g.perks
     FROM vip_players p
     JOIN vip_groups g ON p.vip_group = g.group_name
     WHERE p.steamid = ? AND p.expire_date > UTC_TIMESTAMP()`,
    [session.steamId]
  );

  const results = rows as any[];
  if (results.length === 0) {
    return NextResponse.json({ error: "Not a VIP player" }, { status: 404 });
  }

  const row = results[0];
  const perks = typeof row.perks === "string" ? JSON.parse(row.perks) : row.perks ?? {};
  const preferences = typeof row.preferences === "string"
    ? JSON.parse(row.preferences)
    : row.preferences ?? null;

  return NextResponse.json({
    group_name: row.group_name,
    expire_date: row.expire_date,
    perks,
    preferences,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { preferences } = body;

  if (!preferences || typeof preferences !== "object") {
    return NextResponse.json({ error: "preferences object is required" }, { status: 400 });
  }

  const pool = getPool();

  // Verify the player is actually VIP
  const [rows] = await pool.query(
    "SELECT id FROM vip_players WHERE steamid = ? AND expire_date > UTC_TIMESTAMP()",
    [session.steamId]
  );
  if ((rows as any[]).length === 0) {
    return NextResponse.json({ error: "Not a VIP player" }, { status: 404 });
  }

  await pool.query(
    "UPDATE vip_players SET preferences = ? WHERE steamid = ?",
    [JSON.stringify(preferences), session.steamId]
  );

  return NextResponse.json({ success: true });
}
