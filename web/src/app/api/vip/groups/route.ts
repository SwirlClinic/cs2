import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import type { VipGroup } from "@/lib/types";

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

  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM vip_groups ORDER BY group_name");
  const groups = (rows as any[]).map((row) => ({
    ...row,
    perks: typeof row.perks === "string" ? JSON.parse(row.perks) : row.perks ?? {},
  }));
  return NextResponse.json(groups as VipGroup[]);
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { group_name, perks, weapons } = body;

  if (!group_name) {
    return NextResponse.json({ error: "group_name is required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO vip_groups (group_name, perks, weapons) VALUES (?, ?, ?)`,
    [group_name, JSON.stringify(perks ?? {}), weapons ?? null]
  );

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, group_name, perks, weapons } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `UPDATE vip_groups SET group_name = ?, perks = ?, weapons = ? WHERE id = ?`,
    [group_name, JSON.stringify(perks ?? {}), weapons, id]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAdminAuth();
  if ("error" in auth) return auth.error;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query("DELETE FROM vip_groups WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
