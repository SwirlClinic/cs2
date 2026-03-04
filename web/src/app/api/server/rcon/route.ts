import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const { command } = await req.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ error: "command is required" }, { status: 400 });
  }

  try {
    const response = await rconSend(command);
    return NextResponse.json({ response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "RCON error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
