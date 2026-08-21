using System.Text.Json.Serialization;
using CounterStrikeSharp.API.Core;

namespace CodLoadouts;

public class LoadoutSpec
{
    [JsonPropertyName("Weapons")]
    public List<string> Weapons { get; set; } = new();

    [JsonPropertyName("Grenades")]
    public List<string> Grenades { get; set; } = new();
}

public class CodLoadoutsConfig : BasePluginConfig
{
    [JsonPropertyName("DefaultLoadout")]
    public string DefaultLoadout { get; set; } = "assault";

    // Give kevlar+helmet with the loadout (the cod preset already sets
    // mp_free_armor, so this is off by default).
    [JsonPropertyName("GiveArmor")]
    public bool GiveArmor { get; set; } = false;

    // Bots spawn with the default loadout too.
    [JsonPropertyName("ApplyToBots")]
    public bool ApplyToBots { get; set; } = true;

    [JsonPropertyName("AnnounceOnSpawn")]
    public bool AnnounceOnSpawn { get; set; } = true;

    // Class name -> weapons/grenades granted on spawn. Selected in chat with
    // !class <name>; weapon names are standard CS2 item names. CodWeapons'
    // model swaps apply on top of whatever is granted here.
    [JsonPropertyName("Loadouts")]
    public Dictionary<string, LoadoutSpec> Loadouts { get; set; } = new()
    {
        ["assault"] = new LoadoutSpec
        {
            Weapons = ["weapon_m4a1", "weapon_deagle"],
            Grenades = ["weapon_flashbang", "weapon_smokegrenade"],
        },
        ["rifleman"] = new LoadoutSpec
        {
            Weapons = ["weapon_ak47", "weapon_glock"],
            Grenades = ["weapon_hegrenade", "weapon_flashbang"],
        },
        ["smg"] = new LoadoutSpec
        {
            Weapons = ["weapon_mp7", "weapon_hkp2000"],
            Grenades = ["weapon_flashbang", "weapon_hegrenade"],
        },
        ["shotgun"] = new LoadoutSpec
        {
            Weapons = ["weapon_xm1014", "weapon_tec9"],
            Grenades = ["weapon_hegrenade"],
        },
        ["sniper"] = new LoadoutSpec
        {
            Weapons = ["weapon_awp", "weapon_deagle"],
            Grenades = ["weapon_smokegrenade"],
        },
    };
}
