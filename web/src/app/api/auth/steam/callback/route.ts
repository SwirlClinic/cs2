import { NextRequest, NextResponse } from "next/server";
import { verifySteamLogin, fetchSteamProfile, getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin = process.env.WP_SITE_URL || "http://localhost:3000";

  const steamId = await verifySteamLogin(params);
  if (!steamId) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const profile = await fetchSteamProfile(steamId);
  const session = await getSession();
  session.steamId = steamId;
  session.username = profile?.username || steamId;
  session.avatar = profile?.avatar || "";
  await session.save();

  return NextResponse.redirect(`${origin}/loadout`);
}
