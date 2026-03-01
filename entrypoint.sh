#!/bin/bash
set -e

echo "=== CS2 Dedicated Server ==="

# ----- Install / Update CS2 -----
VALIDATE_FLAG=""
if [ "$STEAMAPPVALIDATE" = "1" ]; then
    VALIDATE_FLAG="validate"
fi

echo "Updating CS2 (app 730)..."
steamcmd +force_install_dir "$CS2_DIR" \
    +login anonymous \
    +app_update 730 $VALIDATE_FLAG \
    +quit

# ----- Fix steamclient.so symlink -----
STEAM_SDK64="$HOME/.steam/sdk64"
mkdir -p "$STEAM_SDK64"
if [ ! -f "$STEAM_SDK64/steamclient.so" ]; then
    if [ -f "/opt/steamcmd/linux64/steamclient.so" ]; then
        ln -sf /opt/steamcmd/linux64/steamclient.so "$STEAM_SDK64/steamclient.so"
        echo "Linked steamclient.so"
    fi
fi

# ----- Install plugins (Metamod, CounterStrikeSharp, WeaponPaints) -----
/home/steam/install-plugins.sh

# ----- Write WeaponPaints config (every startup, so .env changes propagate) -----
CSGO_DIR="$CS2_DIR/game/csgo"
WP_CFG_DIR="$CSGO_DIR/addons/counterstrikesharp/configs/plugins/WeaponPaints"
if [ -d "$CSGO_DIR/addons/counterstrikesharp" ]; then
    mkdir -p "$WP_CFG_DIR"
    cat > "$WP_CFG_DIR/WeaponPaints.json" <<WPCFG
{
  "DatabaseHost": "${WP_DB_HOST}",
  "DatabasePort": ${WP_DB_PORT},
  "DatabaseUser": "${WP_DB_USER}",
  "DatabasePassword": "${WP_DB_PASS}",
  "DatabaseName": "${WP_DB_NAME}",
  "CmdRefreshCooldownSeconds": 60,
  "ChatPrefix": " [{green}WeaponPaints{default}]"
}
WPCFG
    echo "WeaponPaints config written (from env)"

    # ----- Write WeaponRestrict config -----
    WR_CFG_DIR="$CSGO_DIR/addons/counterstrikesharp/configs/plugins/WeaponRestrict"
    mkdir -p "$WR_CFG_DIR"
    cat > "$WR_CFG_DIR/WeaponRestrict.json" <<'WRCFG'
{
  "DefaultConfig": {
    "WeaponQuotas": {},
    "WeaponLimits": {
      "weapon_awp": 24,
      "weapon_deagle": 24
    }
  },
  "MapConfigs": {}
}
WRCFG
    echo "WeaponRestrict config written (AWP + Deagle only)"
fi

# ----- Write server.cfg (every startup) -----
cat > "$CSGO_DIR/cfg/server.cfg" <<'SVRCFG'
// 24/7 AWP Lego - Server Configuration
mp_roundtime 5
mp_roundtime_defuse 0
mp_freezetime 3
mp_buytime 10
mp_buy_anywhere 1
mp_warmuptime 15
mp_autoteambalance 1
mp_limitteams 1
mp_endmatch_votenextmap 0
mp_match_end_changelevel 0
sv_alltalk 1
sv_deadtalk 1
SVRCFG
echo "server.cfg written"

# ----- Run pre.sh hook if present -----
if [ -x "$CS2_DIR/pre.sh" ]; then
    echo "Running pre.sh..."
    "$CS2_DIR/pre.sh"
fi

# ----- Build launch arguments (array to avoid eval) -----
ARGS=(-dedicated)
ARGS+=(-port "$CS2_PORT")
ARGS+=(-maxplayers "$CS2_MAXPLAYERS")
ARGS+=(+map "$CS2_STARTMAP")
ARGS+=(+mapgroup "$CS2_MAPGROUP")

if [ -n "$CS2_GAMEALIAS" ]; then
    ARGS+=(+game_alias "$CS2_GAMEALIAS")
else
    ARGS+=(+game_type "$CS2_GAMETYPE" +game_mode "$CS2_GAMEMODE")
fi

if [ -n "$SRCDS_TOKEN" ]; then
    ARGS+=(+sv_setsteamaccount "$SRCDS_TOKEN")
fi

ARGS+=(+sv_cheats "$CS2_CHEATS")
ARGS+=(+sv_lan "$CS2_LAN")

if [ -n "$CS2_SERVERNAME" ]; then
    ARGS+=(+hostname "$CS2_SERVERNAME")
fi

if [ -n "$CS2_RCONPW" ]; then
    ARGS+=(+rcon_password "$CS2_RCONPW")
fi

if [ -n "$CS2_PW" ]; then
    ARGS+=(+sv_password "$CS2_PW")
fi

# Bots
if [ -n "$CS2_BOT_DIFFICULTY" ]; then
    ARGS+=(+bot_difficulty "$CS2_BOT_DIFFICULTY")
fi
if [ -n "$CS2_BOT_QUOTA" ]; then
    ARGS+=(+bot_quota "$CS2_BOT_QUOTA")
fi
if [ -n "$CS2_BOT_QUOTA_MODE" ]; then
    ARGS+=(+bot_quota_mode "$CS2_BOT_QUOTA_MODE")
fi

# CSTV / SourceTV
if [ "$TV_ENABLE" = "1" ]; then
    ARGS+=(+tv_enable 1 +tv_port "$TV_PORT" +tv_autorecord "$TV_AUTORECORD")
    if [ -n "$TV_PW" ]; then
        ARGS+=(+tv_password "$TV_PW")
    fi
fi

# Extra arguments (split on whitespace intentionally)
if [ -n "$CS2_ADDITIONAL_ARGS" ]; then
    read -ra EXTRA <<< "$CS2_ADDITIONAL_ARGS"
    ARGS+=("${EXTRA[@]}")
fi

echo "Starting CS2: ${ARGS[*]}"
cd "$CS2_DIR"

# Set library path required by CS2 (matches cs2.sh)
export LD_LIBRARY_PATH="$CS2_DIR/game/bin/linuxsteamrt64:$LD_LIBRARY_PATH"

# Trap shutdown signals for graceful stop
trap 'kill -TERM $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null' SIGTERM SIGINT

./game/bin/linuxsteamrt64/cs2 "${ARGS[@]}" &
SERVER_PID=$!
wait $SERVER_PID || true

# ----- Run post.sh hook if present -----
if [ -x "$CS2_DIR/post.sh" ]; then
    echo "Running post.sh..."
    "$CS2_DIR/post.sh"
fi
