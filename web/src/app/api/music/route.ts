import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weapon_team, music_id } = await request.json();

  if (weapon_team === undefined || music_id === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO wp_player_music (steamid, weapon_team, music_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE music_id = VALUES(music_id)`,
    [session.steamId, weapon_team, music_id]
  );

  return NextResponse.json({ success: true });
}
