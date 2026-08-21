using System.Text.Json.Serialization;
using CounterStrikeSharp.API.Core;

namespace CodLoadouts;

// Custom look for a weapon, applied to whoever carries it: either a direct
// model replacement (.vmdl from a mounted Workshop addon, view + world) or a
// ChangeSubclass swap (shipped variant id or addon-defined subclass name).
public class WeaponCustom
{
    [JsonPropertyName("Model")]
    public string? Model { get; set; }

    [JsonPropertyName("Subclass")]
    public string? Subclass { get; set; }
}

// A preset template players can copy with !class and then edit slot by slot.
public class PresetLoadout
{
    [JsonPropertyName("Primary")]
    public string Primary { get; set; } = "";

    [JsonPropertyName("Secondary")]
    public string Secondary { get; set; } = "";

    [JsonPropertyName("Grenades")]
    public List<string> Grenades { get; set; } = new();
}

public class CodLoadoutsConfig : BasePluginConfig
{
    [JsonPropertyName("DefaultPreset")]
    public string DefaultPreset { get; set; } = "assault";

    [JsonPropertyName("GiveArmor")]
    public bool GiveArmor { get; set; } = false;

    [JsonPropertyName("ApplyToBots")]
    public bool ApplyToBots { get; set; } = true;

    [JsonPropertyName("AnnounceOnSpawn")]
    public bool AnnounceOnSpawn { get; set; } = true;

    [JsonPropertyName("MaxGrenades")]
    public int MaxGrenades { get; set; } = 2;

    // Slot pools: chat alias -> item name. Players pick with
    // !primary <alias>, !secondary <alias>, !nades <alias> [alias].
    [JsonPropertyName("Primaries")]
    public Dictionary<string, string> Primaries { get; set; } = new()
    {
        ["ak"] = "weapon_ak47",
        ["m4"] = "weapon_m4a4",
        ["m4a1s"] = "weapon_m4a1_silencer",
        ["awp"] = "weapon_awp",
        ["scout"] = "weapon_ssg08",
        ["mp5"] = "weapon_mp5sd",
        ["mp7"] = "weapon_mp7",
        ["mp9"] = "weapon_mp9",
        ["mac10"] = "weapon_mac10",
        ["ump"] = "weapon_ump45",
        ["p90"] = "weapon_p90",
        ["bizon"] = "weapon_bizon",
        ["famas"] = "weapon_famas",
        ["galil"] = "weapon_galilar",
        ["aug"] = "weapon_aug",
        ["sg553"] = "weapon_sg556",
        ["xm1014"] = "weapon_xm1014",
        ["nova"] = "weapon_nova",
        ["mag7"] = "weapon_mag7",
        ["sawedoff"] = "weapon_sawedoff",
        ["negev"] = "weapon_negev",
        ["m249"] = "weapon_m249",
        ["scar20"] = "weapon_scar20",
        ["g3sg1"] = "weapon_g3sg1",
    };

    [JsonPropertyName("Secondaries")]
    public Dictionary<string, string> Secondaries { get; set; } = new()
    {
        ["deagle"] = "weapon_deagle",
        ["glock"] = "weapon_glock",
        ["usps"] = "weapon_usp_silencer",
        ["p2000"] = "weapon_hkp2000",
        ["p250"] = "weapon_p250",
        ["fiveseven"] = "weapon_fiveseven",
        ["tec9"] = "weapon_tec9",
        ["cz75"] = "weapon_cz75a",
        ["dualies"] = "weapon_elite",
        ["revolver"] = "weapon_revolver",
    };

    [JsonPropertyName("GrenadePool")]
    public Dictionary<string, string> GrenadePool { get; set; } = new()
    {
        ["he"] = "weapon_hegrenade",
        ["flash"] = "weapon_flashbang",
        ["smoke"] = "weapon_smokegrenade",
        ["molotov"] = "weapon_molotov",
        ["decoy"] = "weapon_decoy",
    };

    // Weapon designer name -> custom look, applied to whoever carries it.
    [JsonPropertyName("WeaponCustoms")]
    public Dictionary<string, WeaponCustom> WeaponCustoms { get; set; } = new();

    // Starting templates; !class <name> copies one into your personal loadout.
    [JsonPropertyName("Presets")]
    public Dictionary<string, PresetLoadout> Presets { get; set; } = new()
    {
        ["assault"] = new PresetLoadout
        {
            Primary = "weapon_m4a1_silencer",
            Secondary = "weapon_deagle",
            Grenades = ["weapon_flashbang", "weapon_smokegrenade"],
        },
        ["rifleman"] = new PresetLoadout
        {
            Primary = "weapon_ak47",
            Secondary = "weapon_glock",
            Grenades = ["weapon_hegrenade", "weapon_flashbang"],
        },
        ["smg"] = new PresetLoadout
        {
            Primary = "weapon_mp5sd",
            Secondary = "weapon_usp_silencer",
            Grenades = ["weapon_flashbang", "weapon_hegrenade"],
        },
        ["shotgun"] = new PresetLoadout
        {
            Primary = "weapon_xm1014",
            Secondary = "weapon_tec9",
            Grenades = ["weapon_hegrenade"],
        },
        ["sniper"] = new PresetLoadout
        {
            Primary = "weapon_awp",
            Secondary = "weapon_deagle",
            Grenades = ["weapon_smokegrenade"],
        },
    };
}
