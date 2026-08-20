using System.Text.Json.Serialization;
using CounterStrikeSharp.API.Core;

namespace CodWeapons;

public class CodWeaponsConfig : BasePluginConfig
{
    // Weapon designer name -> subclass id. Applied with the ChangeSubclass
    // input (animgraph2-safe), swapping the weapon's model AND animations to
    // another defined subclass. Numeric ids are item-definition indexes of
    // shipped variants; you can also use a custom subclass name defined by a
    // Workshop addon you mount via mm_extra_addons (see presets/cod/cfg).
    [JsonPropertyName("WeaponSubclass")]
    public Dictionary<string, string> WeaponSubclass { get; set; } = new()
    {
        // Give the arena a distinct arsenal out of the box:
        ["weapon_m4a1"] = "60",    // -> M4A1-S (suppressed model + animations)
        ["weapon_hkp2000"] = "61", // -> USP-S
        ["weapon_deagle"] = "64",  // -> R8 Revolver
        ["weapon_mp7"] = "23",     // -> MP5-SD
    };

    // Weapon designer name -> custom viewmodel .vmdl path from a mounted
    // Workshop addon. Empty by default; this is the hook for fully-bespoke
    // models/animations. World model is set to the same path.
    [JsonPropertyName("ModelOverride")]
    public Dictionary<string, string> ModelOverride { get; set; } = new();

    // Tell players in chat which arsenal is active when they spawn.
    [JsonPropertyName("AnnounceLoadout")]
    public bool AnnounceLoadout { get; set; } = true;
}
