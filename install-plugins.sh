#!/bin/bash
#
# Downloads and installs Metamod, CounterStrikeSharp, and all plugins.
# Runs once; skips if already installed.
#
set -e

CSGO_DIR="$CS2_DIR/game/csgo"
MARKER="$CSGO_DIR/.plugins-installed"
TMP_DIR="/tmp/plugin-install"

# Allow forcing a reinstall via env var
if [ "$FORCE_PLUGIN_REINSTALL" = "1" ] && [ -f "$MARKER" ]; then
    echo "[plugins] FORCE_PLUGIN_REINSTALL=1 — removing marker to reinstall"
    rm -f "$MARKER"
fi

if [ -f "$MARKER" ]; then
    echo "[plugins] Already installed — skipping (set FORCE_PLUGIN_REINSTALL=1 or delete $MARKER to reinstall)"
    return 0 2>/dev/null || exit 0
fi

echo "[plugins] Installing Metamod + CounterStrikeSharp + plugins..."
mkdir -p "$TMP_DIR"

# --- helper: download latest release asset from GitHub ---
# usage: gh_download <owner/repo> <filename-pattern> <dest-dir>
gh_download() {
    local repo="$1" pattern="$2" dest="$3"
    echo "[plugins]   Fetching latest release from $repo..."
    local auth_header=()
    if [ -n "$GITHUB_TOKEN" ]; then
        auth_header=(-H "Authorization: Bearer $GITHUB_TOKEN")
    fi
    local url
    url=$(curl -fsSL "${auth_header[@]}" "https://api.github.com/repos/${repo}/releases/latest" \
        | jq -r --arg pat "${pattern}" '.assets[] | select(.name | test($pat)) | .browser_download_url' \
        | head -1)
    if [ -z "$url" ] || [ "$url" = "null" ]; then
        echo "[plugins]   ERROR: no asset matching '$pattern' in $repo" >&2
        return 1
    fi
    local fname
    fname=$(basename "$url")
    echo "[plugins]   Downloading $fname..."
    curl -fsSL -o "$TMP_DIR/$fname" "$url"
    mkdir -p "$dest"
    case "$fname" in
        *.tar.gz|*.tgz) tar -xzf "$TMP_DIR/$fname" -C "$dest" ;;
        *.zip)          unzip -qo "$TMP_DIR/$fname" -d "$dest" ;;
        *)              echo "[plugins]   WARNING: unknown archive format $fname" ;;
    esac
}

# ---- 1. Metamod:Source (distributed via sourcemm.net, not GitHub Releases) ----
echo "[plugins]   Fetching latest Metamod:Source build..."
MM_URL=$(curl -fsSL "https://www.sourcemm.net/downloads.php?branch=master&all=1" \
    | grep -oP 'https://mms\.alliedmods\.net/mmsdrop/2\.0/mmsource-[^"]+linux\.tar\.gz' \
    | head -1)
if [ -z "$MM_URL" ]; then
    echo "[plugins]   ERROR: could not find Metamod:Source download URL" >&2
    exit 1
fi
echo "[plugins]   Downloading $(basename "$MM_URL")..."
curl -fsSL -o "$TMP_DIR/metamod.tar.gz" "$MM_URL"
mkdir -p "$CSGO_DIR"
tar -xzf "$TMP_DIR/metamod.tar.gz" -C "$CSGO_DIR"

# Patch gameinfo.gi to load Metamod
GAMEINFO="$CSGO_DIR/gameinfo.gi"
if ! grep -q "csgo/addons/metamod" "$GAMEINFO" 2>/dev/null; then
    echo "[plugins]   Patching gameinfo.gi for Metamod..."
    sed -i '/Game_LowViolence/a\\t\t\tGame\tcsgo/addons/metamod' "$GAMEINFO"
fi

# ---- 2. CounterStrikeSharp (with runtime) ----
gh_download "roflmuffin/CounterStrikeSharp" "with-runtime.*linux" "$CSGO_DIR"

# Disable CS2 server guidelines (required for skin plugins)
CSS_CORE="$CSGO_DIR/addons/counterstrikesharp/configs/core.json"
if [ -f "$CSS_CORE" ]; then
    echo "[plugins]   Setting FollowCS2ServerGuidelines to false..."
    TMP_CORE=$(mktemp)
    jq '.FollowCS2ServerGuidelines = false' "$CSS_CORE" > "$TMP_CORE" && mv "$TMP_CORE" "$CSS_CORE"
fi

# ---- 3. AnyBaseLibCS2 ----
gh_download "NickFox007/AnyBaseLibCS2" "\\.zip" "$CSGO_DIR"

# ---- 4. PlayerSettingsCS2 ----
gh_download "NickFox007/PlayerSettingsCS2" "\\.zip" "$CSGO_DIR"

# ---- 5. MenuManagerCS2 ----
gh_download "NickFox007/MenuManagerCS2" "\\.zip" "$CSGO_DIR"

# ---- 6. MultiAddonManager ----
gh_download "Source2ZE/MultiAddonManager" "linux\\.tar\\.gz" "$CSGO_DIR"

# ---- 7. PlayerModelChanger ----
gh_download "samyycX/CS2-PlayerModelChanger" "^PlayerModelChanger\\.zip$" \
    "$CSGO_DIR/addons/counterstrikesharp/plugins"

# ---- 8. CS2Rcon ----
gh_download "LordFetznschaedl/CS2Rcon" "CS2Rcon.*\\.zip" \
    "$CSGO_DIR/addons/counterstrikesharp/plugins"

# ---- 9. Map ----
gh_download "oscar-wos/Map" "^Map\\.zip$" \
    "$CSGO_DIR/addons/counterstrikesharp/plugins"

# ---- 10. WeaponPaints ----
# The zip contains a WeaponPaints/ folder, so extract to plugins/ (not plugins/WeaponPaints/)
gh_download "Nereziel/cs2-WeaponPaints" "^WeaponPaints\\.zip$" \
    "$CSGO_DIR/addons/counterstrikesharp/plugins"

# Copy gamedata to the CSS global gamedata directory
WP_GAMEDATA="$CSGO_DIR/addons/counterstrikesharp/plugins/WeaponPaints/gamedata/weaponpaints.json"
if [ -f "$WP_GAMEDATA" ]; then
    mkdir -p "$CSGO_DIR/addons/counterstrikesharp/gamedata"
    cp "$WP_GAMEDATA" "$CSGO_DIR/addons/counterstrikesharp/gamedata/weaponpaints.json"
    echo "[plugins]   Copied weaponpaints.json gamedata"
fi

# ---- Cleanup ----
rm -rf "$TMP_DIR"
touch "$MARKER"
echo "[plugins] All plugins installed successfully."
