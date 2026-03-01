import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agent_ct, agent_t } = await request.json();

  // The WeaponPaints plugin checks string.IsNullOrEmpty(model).
  // The literal string "null" would be treated as a model path and cause error signs.
  // Use SQL NULL or empty string for defaults so the plugin skips model application.
  const ctValue = (agent_ct && agent_ct !== "null") ? agent_ct : null;
  const tValue = (agent_t && agent_t !== "null") ? agent_t : null;

  const pool = getPool();
  await pool.query(
    `INSERT INTO wp_player_agents (steamid, agent_ct, agent_t)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE agent_ct = VALUES(agent_ct), agent_t = VALUES(agent_t)`,
    [session.steamId, ctValue, tValue]
  );

  return NextResponse.json({ success: true });
}
