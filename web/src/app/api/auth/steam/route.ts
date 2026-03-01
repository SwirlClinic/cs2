import { NextResponse } from "next/server";
import { getSteamLoginURL } from "@/lib/auth";

export async function GET() {
  const origin = process.env.WP_SITE_URL || "http://localhost:3000";
  const callbackURL = `${origin}/api/auth/steam/callback`;
  const steamURL = getSteamLoginURL(callbackURL);
  return NextResponse.redirect(steamURL);
}
