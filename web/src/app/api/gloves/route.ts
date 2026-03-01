import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weapon_team, weapon_defindex, paint } = await request.json();

  if (weapon_team === undefined || weapon_defindex === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pool = getPool();

  // Save glove type
  await pool.query(
    `INSERT INTO wp_player_gloves (steamid, weapon_team, weapon_defindex)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE weapon_defindex = VALUES(weapon_defindex)`,
    [session.steamId, weapon_team, weapon_defindex]
  );

  // Save glove skin/paint to skins table (gloves use the skins table for paint)
  if (paint !== undefined) {
    await pool.query(
      `INSERT INTO wp_player_skins
        (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
       VALUES (?, ?, ?, ?, 0.000001, 0)
       ON DUPLICATE KEY UPDATE weapon_paint_id = VALUES(weapon_paint_id)`,
      [session.steamId, weapon_team, weapon_defindex, Number(paint)]
    );
  }

  return NextResponse.json({ success: true });
}
