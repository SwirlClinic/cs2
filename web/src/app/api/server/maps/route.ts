import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { rconSend } from "@/lib/rcon";
import * as fs from "fs/promises";

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

  // Get installed maps via RCON
  const maps: string[] = [];
  try {
    const raw = await rconSend("maps *");
    for (const line of raw.split("\n")) {
      const name = line.trim();
      // Only include playable maps (de_, cs_, ar_, dz_, gd_)
      if (/^(de_|cs_|ar_|dz_|gd_)\w+$/.test(name) && !name.endsWith("_vanity")) {
        maps.push(name);
      }
    }
  } catch {
    // ignore
  }

  // Get workshop maps with titles from publish_data.txt
  const workshopMaps: { id: string; title: string }[] = [];
  const workshopDir = "/app/workshop-maps";
  try {
    const entries = await fs.readdir(workshopDir);
    for (const entry of entries) {
      if (!/^\d+$/.test(entry)) continue;
      let title = entry;
      try {
        const data = await fs.readFile(`${workshopDir}/${entry}/publish_data.txt`, "utf8");
        const match = data.match(/"title"\s+"([^"]+)"/);
        if (match) title = match[1];
      } catch {
        // no publish_data.txt — use ID as title
      }
      workshopMaps.push({ id: entry, title });
    }
  } catch {
    // Workshop dir not accessible — ignore
  }

  workshopMaps.sort((a, b) => a.title.localeCompare(b.title));
  return NextResponse.json({ maps: maps.sort(), workshopMaps });
}
