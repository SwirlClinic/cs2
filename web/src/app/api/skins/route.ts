import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    weapon_team,
    weapon_defindex,
    weapon_paint_id,
    weapon_wear = 0.0001,
    weapon_seed = 0,
    weapon_nametag = "",
    weapon_stattrak = 0,
    weapon_stattrak_count = 0,
    weapon_sticker_0 = "",
    weapon_sticker_1 = "",
    weapon_sticker_2 = "",
    weapon_sticker_3 = "",
    weapon_sticker_4 = "",
    weapon_keychain = "",
  } = body;

  if (weapon_team === undefined || weapon_defindex === undefined || weapon_paint_id === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO wp_player_skins
      (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed,
       weapon_nametag, weapon_stattrak, weapon_stattrak_count,
       weapon_sticker_0, weapon_sticker_1, weapon_sticker_2, weapon_sticker_3, weapon_sticker_4,
       weapon_keychain)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       weapon_paint_id = VALUES(weapon_paint_id),
       weapon_wear = VALUES(weapon_wear),
       weapon_seed = VALUES(weapon_seed),
       weapon_nametag = VALUES(weapon_nametag),
       weapon_stattrak = VALUES(weapon_stattrak),
       weapon_stattrak_count = VALUES(weapon_stattrak_count),
       weapon_sticker_0 = VALUES(weapon_sticker_0),
       weapon_sticker_1 = VALUES(weapon_sticker_1),
       weapon_sticker_2 = VALUES(weapon_sticker_2),
       weapon_sticker_3 = VALUES(weapon_sticker_3),
       weapon_sticker_4 = VALUES(weapon_sticker_4),
       weapon_keychain = VALUES(weapon_keychain)`,
    [
      session.steamId, weapon_team, weapon_defindex, weapon_paint_id,
      weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak,
      weapon_stattrak_count, weapon_sticker_0, weapon_sticker_1,
      weapon_sticker_2, weapon_sticker_3, weapon_sticker_4, weapon_keychain,
    ]
  );

  return NextResponse.json({ success: true });
}
