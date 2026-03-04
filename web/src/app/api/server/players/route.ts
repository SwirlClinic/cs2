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
    const response = await rconSend("status");

    // Parse CS2 status output for player lines
    // Format: #userid "name" steamid connected ping loss state rate adr
    const players: { name: string; steamId: string; userId: string }[] = [];
    const lines = response.split("\n");

    for (const line of lines) {
      // Match lines like: #5 "PlayerName" STEAM_0:1:12345 or #5 "PlayerName" [U:1:12345]
      // CS2 format: #userid name steamid64 connected ping loss state rate adr
      const match = line.match(/^#(\d+)\s+"(.+?)"\s+(\S+)/);
      if (!match) continue;

      const [, userId, name, steamId] = match;

      // Skip BOT entries
      if (steamId === "BOT") continue;

      players.push({ name, steamId, userId });
    }

    return NextResponse.json(players);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get players";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
