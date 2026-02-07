Add workshop models to CS2 server for use with PlayerModelChanger.

## Instructions

The user will provide:
1. A Steam Workshop ID (or URL) for a model pack
2. The model `.vmdl_c` paths (they may provide these, or you should try to extract them from the downloaded VPK)

## Steps

1. **Add the workshop ID to MultiAddonManager**
   - Config file: `data/cs2/game/csgo/cfg/multiaddonmanager/multiaddonmanager.cfg`
   - Append the new workshop ID to the existing `mm_extra_addons` comma-separated list

2. **Extract model paths** (if not provided by the user)
   - Check if the VPK exists at: `data/cs2/game/bin/linuxsteamrt64/steamapps/workshop/content/730/<WORKSHOP_ID>/<WORKSHOP_ID>.vpk`
   - Try to extract `.vmdl` paths using `strings` inside the cs2-server container: `docker exec cs2-server strings <vpk_path> | grep -i "\.vmdl" | sort -u`
   - If that fails, ask the user for the model paths

3. **Add models to PlayerModelChanger**
   - Config file: `data/cs2/game/csgo/addons/counterstrikesharp/configs/plugins/PlayerModelChanger/PlayerModelChanger.json`
   - Add each model to the `"Models"` object with a unique key, name, `"side": "ALL"`, and the `.vmdl` path (NOT `.vmdl_c`)

4. **Ask if the user wants to restart the server**
   - Restart command: `docker compose -f /mnt/user/appdata/cs2/docker-compose.yml restart cs2`

## Important notes
- Use `.vmdl` extension in PlayerModelChanger config, NOT `.vmdl_c`
- Workshop IDs in MultiAddonManager are comma-separated, no spaces
- Each model key in PlayerModelChanger must be unique

## Argument
$ARGUMENTS
