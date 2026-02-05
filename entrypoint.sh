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

# ----- Run pre.sh hook if present -----
if [ -x "$CS2_DIR/pre.sh" ]; then
    echo "Running pre.sh..."
    "$CS2_DIR/pre.sh"
fi

# ----- Build launch arguments -----
ARGS="-dedicated"
ARGS="$ARGS -port $CS2_PORT"
ARGS="$ARGS -maxplayers $CS2_MAXPLAYERS"
ARGS="$ARGS +map $CS2_STARTMAP"
ARGS="$ARGS +mapgroup $CS2_MAPGROUP"

if [ -n "$CS2_GAMEALIAS" ]; then
    ARGS="$ARGS +game_alias $CS2_GAMEALIAS"
else
    ARGS="$ARGS +game_type $CS2_GAMETYPE +game_mode $CS2_GAMEMODE"
fi

if [ -n "$SRCDS_TOKEN" ]; then
    ARGS="$ARGS +sv_setsteamaccount $SRCDS_TOKEN"
fi

ARGS="$ARGS +sv_cheats $CS2_CHEATS"
ARGS="$ARGS +sv_lan $CS2_LAN"

if [ -n "$CS2_SERVERNAME" ]; then
    ARGS="$ARGS +hostname \"$CS2_SERVERNAME\""
fi

if [ -n "$CS2_RCONPW" ]; then
    ARGS="$ARGS +rcon_password \"$CS2_RCONPW\""
fi

if [ -n "$CS2_PW" ]; then
    ARGS="$ARGS +sv_password \"$CS2_PW\""
fi

# Bots
if [ -n "$CS2_BOT_DIFFICULTY" ]; then
    ARGS="$ARGS +bot_difficulty $CS2_BOT_DIFFICULTY"
fi
if [ -n "$CS2_BOT_QUOTA" ]; then
    ARGS="$ARGS +bot_quota $CS2_BOT_QUOTA"
fi
if [ -n "$CS2_BOT_QUOTA_MODE" ]; then
    ARGS="$ARGS +bot_quota_mode $CS2_BOT_QUOTA_MODE"
fi

# CSTV / SourceTV
if [ "$TV_ENABLE" = "1" ]; then
    ARGS="$ARGS +tv_enable 1 +tv_port $TV_PORT +tv_autorecord $TV_AUTORECORD"
    if [ -n "$TV_PW" ]; then
        ARGS="$ARGS +tv_password \"$TV_PW\""
    fi
fi

# Extra arguments
if [ -n "$CS2_ADDITIONAL_ARGS" ]; then
    ARGS="$ARGS $CS2_ADDITIONAL_ARGS"
fi

echo "Starting CS2: $ARGS"
cd "$CS2_DIR"

# Trap shutdown signals for graceful stop
trap 'kill -TERM $SERVER_PID 2>/dev/null; wait $SERVER_PID' SIGTERM SIGINT

eval "./game/bin/linuxsteamrt64/cs2 $ARGS" &
SERVER_PID=$!
wait $SERVER_PID

# ----- Run post.sh hook if present -----
if [ -x "$CS2_DIR/post.sh" ]; then
    echo "Running post.sh..."
    "$CS2_DIR/post.sh"
fi
