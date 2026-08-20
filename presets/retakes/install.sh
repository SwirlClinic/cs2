#!/bin/bash
# Installs B3none/cs2-retakes (RetakesPlugin) with its bundled map spawn
# configs. Run by the entrypoint when this preset is first selected; the
# release zip is rooted at addons/, so it extracts over the game dir.
set -e

: "${CSGO_DIR:?CSGO_DIR must be set}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

AUTH=()
if [ -n "$GITHUB_TOKEN" ]; then
    AUTH=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

echo "[retakes] Fetching latest RetakesPlugin release..."
URL=$(curl -fsSL "${AUTH[@]}" "https://api.github.com/repos/B3none/cs2-retakes/releases/latest" \
    | jq -r '.assets[] | select(.name | test("^RetakesPlugin-[0-9.]+\\.zip$")) | .browser_download_url' \
    | head -1)
if [ -z "$URL" ] || [ "$URL" = "null" ]; then
    echo "[retakes] ERROR: could not find RetakesPlugin release asset" >&2
    exit 1
fi

echo "[retakes] Downloading $(basename "$URL")..."
curl -fsSL -o "$TMP/retakes.zip" "$URL"
unzip -qo "$TMP/retakes.zip" -d "$CSGO_DIR"
echo "[retakes] Installed RetakesPlugin with map configs"
