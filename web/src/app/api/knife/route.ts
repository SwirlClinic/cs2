import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weapon_team, knife, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed } = await request.json();

  if (weapon_team === undefined || knife === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pool = getPool();

  // Save knife type
  await pool.query(
    `INSERT INTO wp_player_knife (steamid, weapon_team, knife)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE knife = VALUES(knife)`,
    [session.steamId, weapon_team, knife]
  );

  // Save knife skin/paint to skins table
  if (weapon_defindex !== undefined && weapon_paint_id !== undefined) {
    await pool.query(
      `INSERT INTO wp_player_skins
        (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         weapon_paint_id = VALUES(weapon_paint_id),
         weapon_wear = VALUES(weapon_wear),
         weapon_seed = VALUES(weapon_seed)`,
      [
        session.steamId, weapon_team, weapon_defindex,
        weapon_paint_id, weapon_wear ?? 0.000001, weapon_seed ?? 0,
      ]
    );
  }

  return NextResponse.json({ success: true });
}
