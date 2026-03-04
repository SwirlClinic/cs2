import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import * as fs from "fs/promises";
import * as path from "path";

const CONFIG_PATH = path.join("/app/server-cfg", "custom_overrides.cfg");

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
    const content = await fs.readFile(CONFIG_PATH, "utf8");
    return NextResponse.json({ content });
  } catch {
    // File doesn't exist yet — return empty
    return NextResponse.json({ content: "" });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const { content } = await req.json();
  if (typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    await fs.writeFile(CONFIG_PATH, content, "utf8");
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to write config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
