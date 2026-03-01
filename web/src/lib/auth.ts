import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionData } from "./types";

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long_placeholder",
  cookieName: "cs2_session",
  cookieOptions: {
    secure: process.env.WP_SITE_URL?.startsWith("https") ?? false,
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Steam OpenID 2.0 constants
const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

export function getSteamLoginURL(returnURL: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnURL,
    "openid.realm": new URL(returnURL).origin,
    "openid.identity":
      "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id":
      "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamLogin(
  params: URLSearchParams
): Promise<string | null> {
  // Change mode to check_authentication
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  const text = await response.text();
  if (!text.includes("is_valid:true")) {
    return null;
  }

  // Extract Steam ID from claimed_id
  const claimedId = params.get("openid.claimed_id");
  if (!claimedId) return null;

  const match = claimedId.match(
    /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/
  );
  return match ? match[1] : null;
}

export async function fetchSteamProfile(
  steamId: string
): Promise<{ username: string; avatar: string } | null> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
  const res = await fetch(url);
  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) return null;

  return {
    username: player.personaname,
    avatar: player.avatarmedium,
  };
}
