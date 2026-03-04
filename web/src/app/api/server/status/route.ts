import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { rconSend } from "@/lib/rcon";

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

  try {
    const raw = await rconSend("status");

    // CS2 status format uses "key : value" with spaces around colon
    const hostnameMatch = raw.match(/hostname\s*:\s*(.+)/);
    // Map is in first spawngroup line: "loaded spawngroup(  1)  : SV:  [1: de_dust2 | main lump"
    const mapMatch = raw.match(/loaded spawngroup\(\s*1\)\s*:.*\[\d+:\s*(\S+)/);
    // "players  : 1 humans, 9 bots (0 max)"
    const playersMatch = raw.match(/players\s*:\s*(\d+)\s*humans,\s*(\d+)\s*bots\s*\((\d+)\s*max\)/);

    return NextResponse.json({
      hostname: hostnameMatch?.[1]?.trim() ?? "Unknown",
      map: mapMatch?.[1] ?? "Unknown",
      players: playersMatch ? parseInt(playersMatch[1], 10) + parseInt(playersMatch[2], 10) : 0,
      humans: playersMatch ? parseInt(playersMatch[1], 10) : 0,
      bots: playersMatch ? parseInt(playersMatch[2], 10) : 0,
      maxPlayers: playersMatch ? parseInt(playersMatch[3], 10) : 0,
      raw,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
