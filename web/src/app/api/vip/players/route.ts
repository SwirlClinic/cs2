import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session.steamId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const admin = await isAdmin(session.steamId);
  if (!admin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { steamId: session.steamId };
}

export async function GET() {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT p.*, g.group_name
     FROM vip_players p
     LEFT JOIN vip_groups g ON p.vip_group = g.group_name
     ORDER BY p.expire_date DESC`
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { steamid, player_name, vip_group, days } = body;

  if (!steamid || !vip_group || !days) {
    return NextResponse.json({ error: "steamid, vip_group, and days are required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO vip_players (steamid, player_name, vip_group, expire_date)
     VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))
     ON DUPLICATE KEY UPDATE player_name = VALUES(player_name), vip_group = VALUES(vip_group),
     expire_date = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY)`,
    [steamid, player_name ?? "", vip_group, days, days]
  );

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query("DELETE FROM vip_players WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
