# CS2 Community Server

Dockerized Counter-Strike 2 dedicated server with gamemode presets, a plugin
stack (Metamod + CounterStrikeSharp + WeaponPaints skins, VIP perks, database
admins, RCON), and a web UI for skins and server management. One repo spins up
any server in the fleet — the gamemode is a single `.env` variable.

## Quick start (new machine)

Requirements: Docker with the compose plugin, ~70GB disk for game files.

```bash
git clone https://github.com/SwirlClinic/cs2.git && cd cs2
cp .env.example .env
```

Edit `.env`:

1. `STEAM_API_KEY` — from <https://steamcommunity.com/dev/apikey>
2. `SRCDS_TOKEN` — run `./scripts/gslt.sh create` (uses the API key; no website needed)
3. `CS2_PRESET` — pick the gamemode (below)
4. `CS2_SERVERNAME`, `CS2_RCONPW`, `SESSION_SECRET` (`openssl rand -hex 32`)

```bash
docker compose up -d
```

First boot downloads ~60GB of game files plus all plugins, so give it a while
(`docker logs -f cs2-server`). The web UI is at `http://<host>:8080`. Players
connect with `connect <host>:27015` from the console.

## Gamemode presets

Set `CS2_PRESET` in `.env` and restart (`docker compose up -d --force-recreate cs2`):

| Preset | What you get |
|---|---|
| `awp-lego` | 24/7 AWP Lego (workshop map, AWP+Deagle only, alltalk) |
| `casual` | Standard casual, active-duty rotation |
| `competitive` | Standard competitive (MR12) |
| `deathmatch` | Deathmatch (optionally bot-filled) |
| `wingman` | 2v2 wingman |
| `retakes` | Retakes via [B3none/cs2-retakes](https://github.com/B3none/cs2-retakes) (auto-installed) |
| `custom` | Template — copy `presets/custom/`, make your own |

A preset owns the game mode, start map, cvars (`preset.cfg`), any plugin
configs, and an optional one-time install hook. Config precedence, last wins:
game mode defaults → `preset.cfg` → `custom_overrides.cfg`. Per-server tweaks
belong in `data/cs2/game/csgo/cfg/custom_overrides.cfg` (or the web UI's config
editor) — presets never touch it. Explicit `CS2_*` values in `.env` override
the preset's env defaults.

Switching presets overwrites preset-owned plugin configs (e.g. weapon
restrictions) and runs the new preset's install hook once.

## Fleet / multiple servers

One server per host: just clone and configure. Several on one host: one clone
per instance, each with unique `CS2_INSTANCE`, `CS2_PORT`, `TV_PORT`, and
`WP_WEB_PORT` in its `.env`. Each instance keeps its own `data/` (game files,
database).

Optional public HTTPS for the web UI: copy `Caddyfile.example` to `Caddyfile`
with your domain, and set `COMPOSE_PROFILES=caddy` in `.env` (needs host ports
80/443).

## How it stays current

- **CS2 updates**: every container start runs a steamcmd update (with automatic
  repair of manifests corrupted by interrupted updates).
- **Metamod**: refreshed from the latest sourcemm master on every boot — CS2
  updates routinely break older builds, and master usually has the fix.
- **Other plugins**: installed once from each project's latest GitHub release.
  After a big CS2 update breaks plugins, set `FORCE_PLUGIN_REINSTALL=1` in
  `.env` and recreate the container to pull everything fresh (set it back
  after). Set `GITHUB_TOKEN` to dodge GitHub API rate limits.
- **Server image**: built and pushed to `ghcr.io/swirlclinic/cs2:latest` by CI
  on every push to main; `docker compose pull && docker compose up -d` to
  upgrade a host. The web UI builds locally from `web/`.

## Operations

```bash
docker logs -f cs2-server            # watch the server
docker compose pull && docker compose up -d   # upgrade to latest image
./scripts/gslt.sh list               # check token status (expired tokens
./scripts/gslt.sh reset              #   break Steam auth — reissue and update .env)
python3 scripts/map-reload.py        # hot-reload a map's spawn/config changes
```

Admins are managed in the database via the DbAdmins plugin (`/add-admin` Claude
command, or insert into the admins table). VIP perks: `!vip` in chat.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Error! App '730' state is 0x6` loops | Handled automatically (manifest reset). If it persists: delete `data/cs2/steamapps/appmanifest_730.acf` and restart with `STEAMAPPVALIDATE=1`. |
| `MMS: Fatal error ... undefined symbol` | Metamod predates the latest CS2 update — restart the container (Metamod refreshes on boot). |
| `AuthStatus ... Failed to connect to Steam` / cert reason 5005 | GSLT expired or invalid: `./scripts/gslt.sh reset`, update `SRCDS_TOKEN`, recreate the container. |
| Plugins missing after CS2 update | `FORCE_PLUGIN_REINSTALL=1` + recreate. |
| Workshop map not loading | The server must reach Steam first (see auth above); check `CS2_ADDITIONAL_ARGS=+host_workshop_map <id>`. |

## Layout

```
entrypoint.sh        boot: update CS2, install plugins, apply preset, launch
install-plugins.sh   Metamod/CSS/plugin installer (layout-normalizing)
presets/<name>/      gamemode presets (env, cfg, plugin configs, install hook)
plugins/             in-repo plugins baked into the image (DbAdmins, VipPlugin)
web/                 Next.js skin picker + server manager (port 8080)
wp-data/             curated WeaponPaints data files baked into the image
data/                runtime state (gitignored): game files, MySQL, Caddy
scripts/             gslt.sh (token management), map-reload.py
```
