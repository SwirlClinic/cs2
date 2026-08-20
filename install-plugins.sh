#!/bin/bash
#
# Downloads and installs Metamod, CounterStrikeSharp, and all plugins.
# Full install runs once (marker file); Metamod is refreshed on every boot
# because CS2 updates routinely break older Metamod builds.
#
set -e

CSGO_DIR="$CS2_DIR/game/csgo"
PLUGINS_DIR="$CSGO_DIR/addons/counterstrikesharp/plugins"
MARKER="$CSGO_DIR/.plugins-installed"
TMP_DIR="/tmp/plugin-install"

mkdir -p "$TMP_DIR"

# --- helper: download latest release asset from GitHub ---
# usage: gh_download <owner/repo> <filename-pattern> <dest-dir>
# The GitHub API intermittently returns empty/failed responses (and rate
# limits unauthenticated callers), so the lookup retries before giving up —
# a single blip here would otherwise kill the boot and crash-loop the
# container, burning more API quota each cycle.
gh_download() {
    local repo="$1" pattern="$2" dest="$3"
    echo "[plugins]   Fetching latest release from $repo..."
    local auth_header=()
    if [ -n "$GITHUB_TOKEN" ]; then
        auth_header=(-H "Authorization: Bearer $GITHUB_TOKEN")
    fi
    local url="" attempt
    for attempt in 1 2 3; do
        url=$(curl -fsSL --retry 3 --retry-delay 2 "${auth_header[@]}" \
                "https://api.github.com/repos/${repo}/releases/latest" 2>/dev/null \
            | jq -r --arg pat "${pattern}" '.assets[] | select(.name | test($pat)) | .browser_download_url' \
            | head -1) || true
        if [ -n "$url" ] && [ "$url" != "null" ]; then
            break
        fi
        url=""
        echo "[plugins]   attempt $attempt: no asset matching '$pattern' from $repo API — retrying..." >&2
        sleep 5
    done
    if [ -z "$url" ]; then
        echo "[plugins]   ERROR: no asset matching '$pattern' in $repo after 3 attempts" >&2
        return 1
    fi
    local fname
    fname=$(basename "$url")
    echo "[plugins]   Downloading $fname..."
    curl -fsSL --retry 3 --retry-delay 2 -o "$TMP_DIR/$fname" "$url"
    mkdir -p "$dest"
    case "$fname" in
        *.tar.gz|*.tgz) tar -xzf "$TMP_DIR/$fname" -C "$dest" ;;
        *.zip)          unzip -qo "$TMP_DIR/$fname" -d "$dest" ;;
        *)              echo "[plugins]   WARNING: unknown archive format $fname" ;;
    esac
}

# --- helper: install a CounterStrikeSharp plugin regardless of archive layout ---
# Release zips nest their plugin folder inconsistently (some at the root, some
# under addons/counterstrikesharp/plugins/, some under plugins/). Extract to a
# scratch dir, locate <Name>.dll, and install its directory as plugins/<Name>/.
# usage: install_css_plugin <owner/repo> <filename-pattern> <PluginName>
install_css_plugin() {
    local repo="$1" pattern="$2" name="$3"
    local extract="$TMP_DIR/extract-$name"
    rm -rf "$extract"
    mkdir -p "$extract"
    gh_download "$repo" "$pattern" "$extract"
    local dll_path
    dll_path=$(find "$extract" -name "$name.dll" -print -quit)
    if [ -z "$dll_path" ]; then
        echo "[plugins]   ERROR: $name.dll not found in archive from $repo" >&2
        return 1
    fi
    mkdir -p "$PLUGINS_DIR/$name"
    cp -r "$(dirname "$dll_path")/." "$PLUGINS_DIR/$name/"
    rm -rf "$extract"
    echo "[plugins]   Installed $name"
}

# --- helper: install/refresh Metamod:Source (distributed via sourcemm.net) ---
# Runs on EVERY boot: CS2 updates frequently break older Metamod builds
# (undefined-symbol load failures), and master usually has a fix within days.
# The tarball extracts over addons/metamod without touching the *.vdf files
# other plugins (CounterStrikeSharp, MultiAddonManager) drop in there.
install_metamod() {
    echo "[plugins] Refreshing Metamod:Source (latest master build)..."
    local mm_base="https://mms.alliedmods.net/mmsdrop/2.0"
    local mm_file
    # The mmsource-latest-linux pointer file names the newest build. Query it
    # with a cache-buster: the human downloads page sits behind a CDN whose
    # edges can serve a stale copy that points at builds broken by newer CS2.
    mm_file=$(curl -fsSL "$mm_base/mmsource-latest-linux?nocache=$$" | tr -d '[:space:]') || true
    if [ -z "$mm_file" ]; then
        mm_file=$(curl -fsSL "https://www.sourcemm.net/downloads.php?branch=master&all=1" \
            | grep -oP 'mmsource-[^"/]+linux\.tar\.gz' \
            | head -1) || true
    fi
    if [ -z "$mm_file" ] || ! curl -fsSL -o "$TMP_DIR/metamod.tar.gz" "$mm_base/$mm_file"; then
        if [ -d "$CSGO_DIR/addons/metamod" ]; then
            echo "[plugins]   WARNING: Metamod download failed — keeping existing install" >&2
            return 0
        fi
        echo "[plugins]   ERROR: Metamod download failed and no existing install" >&2
        return 1
    fi
    echo "[plugins]   Installing $mm_file..."
    mkdir -p "$CSGO_DIR"
    if ! tar -xzf "$TMP_DIR/metamod.tar.gz" -C "$CSGO_DIR"; then
        if [ -d "$CSGO_DIR/addons/metamod" ]; then
            echo "[plugins]   WARNING: Metamod extraction failed — keeping existing install" >&2
            return 0
        fi
        echo "[plugins]   ERROR: Metamod extraction failed and no existing install" >&2
        return 1
    fi
}

# Allow forcing a reinstall via env var
if [ "$FORCE_PLUGIN_REINSTALL" = "1" ] && [ -f "$MARKER" ]; then
    echo "[plugins] FORCE_PLUGIN_REINSTALL=1 — removing marker to reinstall"
    rm -f "$MARKER"
fi

if [ -f "$MARKER" ]; then
    echo "[plugins] Already installed — refreshing Metamod only (set FORCE_PLUGIN_REINSTALL=1 or delete $MARKER to reinstall everything)"
    install_metamod
    rm -rf "$TMP_DIR"
    return 0 2>/dev/null || exit 0
fi

echo "[plugins] Installing Metamod + CounterStrikeSharp + plugins..."

# ---- 1. Metamod:Source ----
install_metamod

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
# steamrt3 is the runtime CS2 dedicated servers use (steamrt4 targets newer
# host distros). Upstream has renamed these assets twice (*-linux.tar.gz ->
# *-linux-steamrt3.tar.gz -> *-steamrt3.tar.gz), so match loosely.
gh_download "Source2ZE/MultiAddonManager" "steamrt3.*\\.tar\\.gz" "$CSGO_DIR"

# ---- 7. PlayerModelChanger ----
install_css_plugin "samyycX/CS2-PlayerModelChanger" "^PlayerModelChanger\\.zip$" "PlayerModelChanger"

# ---- 8. CS2Rcon ----
install_css_plugin "LordFetznschaedl/CS2Rcon" "CS2Rcon.*\\.zip" "CS2Rcon"

# ---- 9. Map ----
install_css_plugin "oscar-wos/Map" "^Map\\.zip$" "Map"

# ---- 10. WeaponRestrict ----
echo "[plugins]   Fetching latest WeaponRestrict release..."
WR_DIR="$PLUGINS_DIR/WeaponRestrict"
mkdir -p "$WR_DIR"
WR_AUTH=()
if [ -n "$GITHUB_TOKEN" ]; then
    WR_AUTH=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi
WR_URL=$(curl -fsSL --retry 3 --retry-delay 2 "${WR_AUTH[@]}" "https://api.github.com/repos/CS2Plugins/WeaponRestrict/releases/latest" \
    | jq -r '.assets[] | select(.name | test("WeaponRestrict\\.dll")) | .browser_download_url' \
    | head -1)
if [ -n "$WR_URL" ] && [ "$WR_URL" != "null" ]; then
    echo "[plugins]   Downloading WeaponRestrict.dll..."
    curl -fsSL --retry 3 --retry-delay 2 -o "$WR_DIR/WeaponRestrict.dll" "$WR_URL"
else
    echo "[plugins]   WARNING: could not find WeaponRestrict release" >&2
fi

# ---- 11. WeaponPaints ----
install_css_plugin "SwirlClinic/cs2-WeaponPaints" "^WeaponPaints\\.zip$" "WeaponPaints"

# Copy gamedata to the CSS global gamedata directory
WP_GAMEDATA="$PLUGINS_DIR/WeaponPaints/gamedata/weaponpaints.json"
if [ -f "$WP_GAMEDATA" ]; then
    mkdir -p "$CSGO_DIR/addons/counterstrikesharp/gamedata"
    cp "$WP_GAMEDATA" "$CSGO_DIR/addons/counterstrikesharp/gamedata/weaponpaints.json"
    echo "[plugins]   Copied weaponpaints.json gamedata"
fi

# ---- 12. Built-in plugins baked into the image (DbAdmins, VipPlugin,
#         CodMovement, ...) — install every directory under plugins-builtin. ----
if [ -d "/home/steam/plugins-builtin" ]; then
    for builtin in /home/steam/plugins-builtin/*/; do
        [ -d "$builtin" ] || continue
        name=$(basename "$builtin")
        echo "[plugins]   Installing built-in $name..."
        mkdir -p "$PLUGINS_DIR/$name"
        cp -r "$builtin". "$PLUGINS_DIR/$name/"
    done
fi

# ---- Restore curated data files ----
# The upstream release ships with empty/incomplete data files (e.g. agents_en.json).
# Overwrite them with our backups baked into the Docker image.
WP_DATA="$PLUGINS_DIR/WeaponPaints/data"
if [ -d "/home/steam/wp-data-backup" ]; then
    cp /home/steam/wp-data-backup/*_en.json "$WP_DATA/"
    echo "[plugins]   Restored curated English data files from backup"
fi

# ---- Cleanup ----
rm -rf "$TMP_DIR"
touch "$MARKER"
echo "[plugins] All plugins installed successfully."
