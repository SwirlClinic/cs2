import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";
import type { Loadout } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();
  const steamid = session.steamId;

  const [skins, knife, gloves, agents, music, pins] = await Promise.all([
    pool.query("SELECT * FROM wp_player_skins WHERE steamid = ?", [steamid]),
    pool.query("SELECT * FROM wp_player_knife WHERE steamid = ?", [steamid]),
    pool.query("SELECT * FROM wp_player_gloves WHERE steamid = ?", [steamid]),
    pool.query("SELECT * FROM wp_player_agents WHERE steamid = ?", [steamid]),
    pool.query("SELECT * FROM wp_player_music WHERE steamid = ?", [steamid]),
    pool.query("SELECT * FROM wp_player_pins WHERE steamid = ?", [steamid]),
  ]);

  const loadout: Loadout = {
    skins: (skins[0] as Loadout["skins"]) || [],
    knife: (knife[0] as Loadout["knife"]) || [],
    gloves: (gloves[0] as Loadout["gloves"]) || [],
    agents: ((agents[0] as Loadout["agents"][]) || [])[0] || null,
    music: (music[0] as Loadout["music"]) || [],
    pins: (pins[0] as Loadout["pins"]) || [],
  };

  return NextResponse.json(loadout);
}
