#!/bin/bash
#
# Manage Steam Game Server Login Tokens (GSLT) for App ID 730 without the
# website. Uses STEAM_API_KEY from the environment or from ./.env.
#
#   ./scripts/gslt.sh list             show your tokens (flags expired ones)
#   ./scripts/gslt.sh create [memo]    create a new token
#   ./scripts/gslt.sh reset [steamid]  reissue the token for an account
#                                      (steamid optional if you have exactly one)
#
# Tokens expire when unused for months; "reset" fixes that — put the new value
# in SRCDS_TOKEN in .env and restart the server.
set -euo pipefail

API="https://api.steampowered.com/IGameServersService"

if [ -z "${STEAM_API_KEY:-}" ] && [ -f "$(dirname "$0")/../.env" ]; then
    STEAM_API_KEY=$(grep -E '^STEAM_API_KEY=' "$(dirname "$0")/../.env" | cut -d= -f2-)
fi
if [ -z "${STEAM_API_KEY:-}" ]; then
    echo "ERROR: STEAM_API_KEY not set (env var or .env). Get one at https://steamcommunity.com/dev/apikey" >&2
    exit 1
fi

cmd="${1:-list}"
case "$cmd" in
    list)
        curl -fsSL "$API/GetAccountList/v1/?key=$STEAM_API_KEY" \
            | jq -r '.response.servers[]? | "\(.steamid)  token=\(.login_token)  expired=\(.is_expired)  memo=\(.memo // "-")"'
        ;;
    create)
        memo="${2:-cs2-server}"
        curl -fsSL -X POST "$API/CreateAccount/v1/" \
            -d "key=$STEAM_API_KEY" -d "appid=730" -d "memo=$memo" \
            | jq -r '"steamid=\(.response.steamid)\nSRCDS_TOKEN=\(.response.login_token)"'
        ;;
    reset)
        steamid="${2:-}"
        if [ -z "$steamid" ]; then
            steamid=$(curl -fsSL "$API/GetAccountList/v1/?key=$STEAM_API_KEY" \
                | jq -r '.response.servers | if length == 1 then .[0].steamid else empty end')
            if [ -z "$steamid" ]; then
                echo "ERROR: multiple (or zero) accounts — pass a steamid (see: $0 list)" >&2
                exit 1
            fi
        fi
        curl -fsSL -X POST "$API/ResetLoginToken/v1/" \
            -d "key=$STEAM_API_KEY" -d "steamid=$steamid" \
            | jq -r '"SRCDS_TOKEN=\(.response.login_token)"'
        ;;
    *)
        echo "usage: $0 {list|create [memo]|reset [steamid]}" >&2
        exit 1
        ;;
esac
