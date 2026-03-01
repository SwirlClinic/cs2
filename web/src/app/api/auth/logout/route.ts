import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const origin = process.env.WP_SITE_URL || "http://localhost:3000";
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(`${origin}/login`);
}

export async function POST() {
  const origin = process.env.WP_SITE_URL || "http://localhost:3000";
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(`${origin}/login`);
}
