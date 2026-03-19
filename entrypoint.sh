#!/bin/bash
set -e

echo "=== CS2 Dedicated Server ==="

# ----- Install / Update CS2 -----
VALIDATE_FLAG=""
if [ "$STEAMAPPVALIDATE" = "1" ]; then
    VALIDATE_FLAG="validate"
fi

# ----- Fix corrupted manifest from interrupted updates -----
MANIFEST="$CS2_DIR/steamapps/appmanifest_730.acf"
if [ -f "$MANIFEST" ]; then
    CUR_STATE=$(grep -oP '"StateFlags"\s+"\K[^"]+' "$MANIFEST" 2>/dev/null || true)
    if [ -n "$CUR_STATE" ] && [ "$CUR_STATE" != "4" ]; then
        echo "[entrypoint] Manifest StateFlags=$CUR_STATE (dirty) — resetting to 4 for incremental update"
        sed -i 's/"StateFlags"\s\+"[0-9]\+"/"StateFlags"\t\t"4"/' "$MANIFEST"
        sed -i 's/"UpdateResult"\s\+"[0-9]\+"/"UpdateResult"\t\t"0"/' "$MANIFEST"
    fi
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

# ----- Ensure Metamod is in gameinfo.gi (CS2 updates overwrite this file) -----
CSGO_DIR_MM="$CS2_DIR/game/csgo"
GAMEINFO="$CSGO_DIR_MM/gameinfo.gi"
if [ -f "$GAMEINFO" ] && ! grep -q "csgo/addons/metamod" "$GAMEINFO" 2>/dev/null; then
    echo "[entrypoint] Patching gameinfo.gi for Metamod (was reset by CS2 update)..."
    sed -i '/Game_LowViolence/a\\t\t\tGame\tcsgo/addons/metamod' "$GAMEINFO"
fi

# ----- Write WeaponPaints config (only if it doesn't exist) -----
CSGO_DIR="$CS2_DIR/game/csgo"
WP_CFG_DIR="$CSGO_DIR/addons/counterstrikesharp/configs/plugins/WeaponPaints"
if [ -d "$CSGO_DIR/addons/counterstrikesharp" ]; then
    mkdir -p "$WP_CFG_DIR"
    if [ ! -f "$WP_CFG_DIR/WeaponPaints.json" ]; then
        cat > "$WP_CFG_DIR/WeaponPaints.json" <<WPCFG
{
  "DatabaseHost": "${WP_DB_HOST}",
  "DatabasePort": ${WP_DB_PORT},
  "DatabaseUser": "${WP_DB_USER}",
  "DatabasePassword": "${WP_DB_PASS}",
  "DatabaseName": "${WP_DB_NAME}",
  "CmdRefreshCooldownSeconds": 5,
  "ChatPrefix": " [{green}WeaponPaints{default}]"
}
WPCFG
        echo "WeaponPaints config written (first run)"
    else
        echo "WeaponPaints config exists — skipping"
    fi

    # ----- Write DbAdmins config (only if it doesn't exist) -----
    DBA_CFG_DIR="$CSGO_DIR/addons/counterstrikesharp/configs/plugins/DbAdmins"
    mkdir -p "$DBA_CFG_DIR"
    if [ ! -f "$DBA_CFG_DIR/DbAdmins.json" ]; then
        cat > "$DBA_CFG_DIR/DbAdmins.json" <<DBACFG
{
  "ConfigVersion": 1,
  "DatabaseHost": "${WP_DB_HOST}",
  "DatabasePort": ${WP_DB_PORT},
  "DatabaseUser": "${WP_DB_USER}",
  "DatabasePassword": "${WP_DB_PASS}",
  "DatabaseName": "${WP_DB_NAME}"
}
DBACFG
        echo "DbAdmins config written (first run)"
    else
        echo "DbAdmins config exists — skipping"
    fi

    # ----- Write VipPlugin config (only if it doesn't exist) -----
    VP_CFG_DIR="$CSGO_DIR/addons/counterstrikesharp/configs/plugins/VipPlugin"
    mkdir -p "$VP_CFG_DIR"
    if [ ! -f "$VP_CFG_DIR/VipPlugin.json" ]; then
        cat > "$VP_CFG_DIR/VipPlugin.json" <<VPCFG
{
  "ConfigVersion": 1,
  "DatabaseHost": "${WP_DB_HOST}",
  "DatabasePort": ${WP_DB_PORT},
  "DatabaseUser": "${WP_DB_USER}",
  "DatabasePassword": "${WP_DB_PASS}",
  "DatabaseName": "${WP_DB_NAME}",
  "AdminFlag": "@css/root",
  "MenuType": "selectable",
  "Features": {
    "HealthBonusEnabled": true,
    "ArmorEnabled": true,
    "WeaponsMenuEnabled": true,
    "DefuserEnabled": true,
    "GrenadesEnabled": true,
    "ExtraMoneyEnabled": true,
    "CommandVip": ["vip"],
    "CommandWeapons": ["weapons", "guns"],
    "CommandVipAdd": ["vipadd"],
    "CommandVipRemove": ["vipremove"],
    "CommandVipList": ["viplist"],
    "CommandVipReload": ["vipreload"]
  }
}
VPCFG
        echo "VipPlugin config written (first run)"
    else
        echo "VipPlugin config exists — skipping"
    fi

    # ----- Write WeaponRestrict config (only if it doesn't exist) -----
    WR_CFG_DIR="$CSGO_DIR/addons/counterstrikesharp/configs/plugins/WeaponRestrict"
    mkdir -p "$WR_CFG_DIR"
    if [ ! -f "$WR_CFG_DIR/WeaponRestrict.json" ]; then
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
        echo "WeaponRestrict config written (first run)"
    else
        echo "WeaponRestrict config exists — skipping"
    fi
fi

# ----- Write server.cfg (only if it doesn't exist) -----
if [ ! -f "$CSGO_DIR/cfg/server.cfg" ]; then
    cat > "$CSGO_DIR/cfg/server.cfg" <<SVRCFG
// Server identity — gameplay settings go in custom_overrides.cfg
hostname ${CS2_SERVERNAME:-CS2 Server}
SVRCFG
    echo "server.cfg written (first run)"
else
    echo "server.cfg exists — skipping"
fi

# ----- Write custom_overrides.cfg (only if it doesn't exist) -----
if [ ! -f "$CSGO_DIR/cfg/custom_overrides.cfg" ]; then
    cat > "$CSGO_DIR/cfg/custom_overrides.cfg" <<'OVCFG'
// Custom server overrides — loaded after gamemode defaults via gamemode_*_server.cfg
// Edit via the web UI (Server > Config Editor) or directly.
// Changes here persist across map changes.
mp_roundtime 2
mp_freezetime 5
mp_buytime 15
mp_warmuptime 30
mp_autoteambalance 1
sv_alltalk 0
OVCFG
    echo "custom_overrides.cfg written (first run)"
else
    echo "custom_overrides.cfg exists — skipping"
fi

# ----- Write gamemode_*_server.cfg files (exec custom_overrides.cfg) -----
for gmcfg in "$CSGO_DIR"/cfg/gamemode_*.cfg; do
    base=$(basename "$gmcfg" .cfg)
    case "$base" in *_server|*_offline|*_short|*_tmm) continue ;; esac
    target="$CSGO_DIR/cfg/${base}_server.cfg"
    if [ ! -f "$target" ]; then
        echo "exec custom_overrides.cfg" > "$target"
        echo "Created $target"
    fi
done

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
