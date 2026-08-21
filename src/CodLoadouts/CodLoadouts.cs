using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Memory;
using CounterStrikeSharp.API.Modules.Utils;

namespace CodLoadouts;

// Create-a-class loadouts for the CoD gamemode. Every player has a personal
// loadout (persisted by SteamID): copy a preset with !class, then customize
// slot by slot with !primary / !secondary / !nades. Weapons listed in
// WeaponCustoms get their custom model or subclass applied to any carrier.
public class CodLoadouts : BasePlugin, IPluginConfig<CodLoadoutsConfig>
{
    public override string ModuleName => "CodLoadouts";
    public override string ModuleVersion => "2.0.0";
    public override string ModuleAuthor => "SwirlClinic";
    public override string ModuleDescription => "CoD-style create-a-class loadouts";

    public CodLoadoutsConfig Config { get; set; } = new();

    private sealed class PlayerLoadout
    {
        public string Primary { get; set; } = "";
        public string Secondary { get; set; } = "";
        public List<string> Grenades { get; set; } = new();
    }

    private Dictionary<ulong, PlayerLoadout> _loadouts = new();
    private string _storePath = "";

    public void OnConfigParsed(CodLoadoutsConfig config) => Config = config;

    public override void Load(bool hotReload)
    {
        // Persist next to the plugin's config: that directory survives both
        // image redeploys and the optional-plugin reinstall (ModuleDirectory
        // itself is wiped every boot).
        var cfgDir = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "configs", "plugins", "CodLoadouts"));
        Directory.CreateDirectory(cfgDir);
        _storePath = Path.Combine(cfgDir, "playerloadouts.json");
        LoadStore();

        // Custom models must be precached at map load or SetModel shows the
        // ERROR (checkered) model. Mounting the addon only makes the files
        // available; this registers each one so it can actually be applied.
        RegisterListener<Listeners.OnServerPrecacheResources>(manifest =>
        {
            foreach (var custom in Config.WeaponCustoms.Values)
            {
                if (!string.IsNullOrWhiteSpace(custom.Model))
                    manifest.AddResource(custom.Model!);
            }
        });

        AddCommand("css_class", "Copy a preset into your loadout", OnClassCommand);
        AddCommand("css_classes", "List presets", (p, _) => { if (p is { IsValid: true }) PrintPresets(p); });
        AddCommand("css_primary", "Set your primary weapon", (p, info) => OnSlotCommand(p, info, "primary"));
        AddCommand("css_secondary", "Set your secondary weapon", (p, info) => OnSlotCommand(p, info, "secondary"));
        AddCommand("css_nades", "Set your grenades", (p, info) => OnSlotCommand(p, info, "nades"));
        AddCommand("css_myclass", "Show your loadout", (p, _) => { if (p is { IsValid: true }) PrintLoadout(p); });
        AddCommand("css_guns", "List weapons for each slot", (p, _) => { if (p is { IsValid: true }) PrintPools(p); });

        RegisterEventHandler<EventPlayerSpawn>((ev, _) =>
        {
            var player = ev.Userid;
            if (player is not { IsValid: true })
                return HookResult.Continue;
            if (player.IsBot && !Config.ApplyToBots)
                return HookResult.Continue;

            var slot = player.Slot;
            AddTimer(0.2f, () =>
            {
                var p = Utilities.GetPlayerFromSlot(slot);
                if (p is { IsValid: true } && p.PawnIsAlive)
                    ApplyLoadout(p, announce: Config.AnnounceOnSpawn);
            });
            return HookResult.Continue;
        });

        // The engine re-sets the viewmodel every weapon deploy; custom
        // viewmodels must be re-applied on each equip.
        RegisterEventHandler<EventItemEquip>((ev, _) =>
        {
            var player = ev.Userid;
            if (player is not { IsValid: true })
                return HookResult.Continue;
            var slot = player.Slot;
            Server.NextFrame(() =>
            {
                var p = Utilities.GetPlayerFromSlot(slot);
                if (p is { IsValid: true } && p.PawnIsAlive)
                    ApplyViewModelForActiveWeapon(p);
            });
            return HookResult.Continue;
        });
    }

    // ----- persistence -----

    private void LoadStore()
    {
        try
        {
            if (File.Exists(_storePath))
                _loadouts = JsonSerializer.Deserialize<Dictionary<ulong, PlayerLoadout>>(File.ReadAllText(_storePath)) ?? new();
        }
        catch (Exception ex)
        {
            Logger.LogWarning("Could not load loadout store: {Message}", ex.Message);
        }
    }

    private void SaveStore()
    {
        try
        {
            File.WriteAllText(_storePath, JsonSerializer.Serialize(_loadouts));
        }
        catch (Exception ex)
        {
            Logger.LogWarning("Could not save loadout store: {Message}", ex.Message);
        }
    }

    private PlayerLoadout GetLoadout(CCSPlayerController player)
    {
        var id = player.IsBot ? 0UL : player.SteamID;
        if (_loadouts.TryGetValue(id, out var lo) && !string.IsNullOrEmpty(lo.Primary))
            return lo;

        var preset = Config.Presets.TryGetValue(Config.DefaultPreset, out var d) ? d : new PresetLoadout();
        var fresh = new PlayerLoadout
        {
            Primary = preset.Primary,
            Secondary = preset.Secondary,
            Grenades = new List<string>(preset.Grenades),
        };
        _loadouts[id] = fresh;
        return fresh;
    }

    // ----- commands -----

    private void OnClassCommand(CCSPlayerController? player, CommandInfo info)
    {
        if (player is not { IsValid: true })
            return;

        var arg = info.GetArg(1).Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(arg) || !Config.Presets.TryGetValue(arg, out var preset))
        {
            PrintPresets(player);
            return;
        }

        var lo = GetLoadout(player);
        lo.Primary = preset.Primary;
        lo.Secondary = preset.Secondary;
        lo.Grenades = new List<string>(preset.Grenades);
        SaveStore();

        player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} Class set: {ChatColors.Yellow}{arg}{ChatColors.Default} — customize with !primary, !secondary, !nades");
        if (player.PawnIsAlive)
            ApplyLoadout(player, announce: false);
    }

    private void OnSlotCommand(CCSPlayerController? player, CommandInfo info, string slotKind)
    {
        if (player is not { IsValid: true })
            return;

        var lo = GetLoadout(player);
        switch (slotKind)
        {
            case "primary":
            case "secondary":
            {
                var pool = slotKind == "primary" ? Config.Primaries : Config.Secondaries;
                var pick = Resolve(pool, info.GetArg(1));
                if (pick == null)
                {
                    player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} !{slotKind} <name> — options: {ChatColors.Yellow}{string.Join(", ", pool.Keys)}");
                    return;
                }
                if (slotKind == "primary") lo.Primary = pick; else lo.Secondary = pick;
                break;
            }
            case "nades":
            {
                var picks = new List<string>();
                for (var i = 1; i <= Config.MaxGrenades; i++)
                {
                    var pick = Resolve(Config.GrenadePool, info.GetArg(i));
                    if (pick != null)
                        picks.Add(pick);
                }
                if (picks.Count == 0)
                {
                    player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} !nades <n1> [n2] — options: {ChatColors.Yellow}{string.Join(", ", Config.GrenadePool.Keys)}");
                    return;
                }
                lo.Grenades = picks;
                break;
            }
        }

        SaveStore();
        PrintLoadout(player);
        if (player.PawnIsAlive)
            ApplyLoadout(player, announce: false);
    }

    private static string? Resolve(Dictionary<string, string> pool, string arg)
    {
        arg = arg.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(arg))
            return null;
        if (pool.TryGetValue(arg, out var item))
            return item;
        // also accept full item names present in the pool
        return pool.Values.FirstOrDefault(v => v == arg || v == $"weapon_{arg}");
    }

    private void PrintPresets(CCSPlayerController player)
    {
        player.PrintToChat(
            $" {ChatColors.Green}[CoD]{ChatColors.Default} Presets: {ChatColors.Yellow}{string.Join(", ", Config.Presets.Keys)}{ChatColors.Default} — !class <name>, then !primary/!secondary/!nades to customize");
    }

    private void PrintPools(CCSPlayerController player)
    {
        player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} Primaries: {ChatColors.Yellow}{string.Join(", ", Config.Primaries.Keys)}");
        player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} Secondaries: {ChatColors.Yellow}{string.Join(", ", Config.Secondaries.Keys)}");
        player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} Grenades: {ChatColors.Yellow}{string.Join(", ", Config.GrenadePool.Keys)}");
    }

    private void PrintLoadout(CCSPlayerController player)
    {
        var lo = GetLoadout(player);
        string Short(string item) => item.StartsWith("weapon_") ? item[7..] : item;
        player.PrintToChat(
            $" {ChatColors.Green}[CoD]{ChatColors.Default} Loadout: {ChatColors.Yellow}{Short(lo.Primary)}{ChatColors.Default} + " +
            $"{ChatColors.Yellow}{Short(lo.Secondary)}{ChatColors.Default} + " +
            $"{ChatColors.Yellow}{string.Join("/", lo.Grenades.Select(Short))}");
    }

    // ----- application -----

    private void ApplyLoadout(CCSPlayerController player, bool announce)
    {
        var lo = GetLoadout(player);

        player.RemoveWeapons();
        player.GiveNamedItem("weapon_knife");
        if (!string.IsNullOrEmpty(lo.Primary))
            player.GiveNamedItem(lo.Primary);
        if (!string.IsNullOrEmpty(lo.Secondary))
            player.GiveNamedItem(lo.Secondary);
        foreach (var grenade in lo.Grenades)
            player.GiveNamedItem(grenade);
        if (Config.GiveArmor)
            player.GiveNamedItem("item_assaultsuit");

        var slot = player.Slot;
        AddTimer(0.1f, () =>
        {
            var p = Utilities.GetPlayerFromSlot(slot);
            if (p is { IsValid: true } && p.PawnIsAlive)
                ApplyCustoms(p);
        });

        if (announce && !player.IsBot)
        {
            PrintLoadout(player);
            player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} !class for presets, !primary/!secondary/!nades to customize, !guns for options");
        }
    }

    private void ApplyCustoms(CCSPlayerController player)
    {
        var weaponServices = player.PlayerPawn.Value?.WeaponServices;
        if (weaponServices == null)
            return;

        foreach (var handle in weaponServices.MyWeapons)
        {
            var weapon = handle.Value;
            if (weapon is not { IsValid: true })
                continue;
            if (!Config.WeaponCustoms.TryGetValue(weapon.DesignerName, out var custom))
                continue;

            if (!string.IsNullOrWhiteSpace(custom.Subclass))
                ChangeSubclass(weapon, custom.Subclass);
            if (!string.IsNullOrWhiteSpace(custom.Model))
                SetWorldModel(weapon, custom.Model);
        }
        ApplyViewModelForActiveWeapon(player);
    }

    private void ApplyViewModelForActiveWeapon(CCSPlayerController player)
    {
        var active = player.PlayerPawn.Value?.WeaponServices?.ActiveWeapon.Value;
        if (active is not { IsValid: true })
            return;
        if (!Config.WeaponCustoms.TryGetValue(active.DesignerName, out var custom)
            || string.IsNullOrWhiteSpace(custom.Model))
            return;

        try
        {
            GetViewModel(player)?.SetModel(custom.Model);
        }
        catch (Exception ex)
        {
            Logger.LogWarning("Viewmodel SetModel failed for {Model}: {Message}", custom.Model, ex.Message);
        }
    }

    private void ChangeSubclass(CBasePlayerWeapon weapon, string subclass)
    {
        var target = weapon.Handle;
        Server.NextWorldUpdate(() =>
        {
            try
            {
                if (!weapon.IsValid || weapon.Handle != target)
                    return;
                weapon.InitiallyPopulateInterpHistory = true;
                weapon.AcceptInput("ChangeSubclass", weapon, weapon, subclass);
            }
            catch (Exception ex)
            {
                Logger.LogWarning("ChangeSubclass failed for {Subclass}: {Message}", subclass, ex.Message);
            }
        });
    }

    private void SetWorldModel(CBasePlayerWeapon weapon, string model)
    {
        try
        {
            weapon.SetModel(model);
        }
        catch (Exception ex)
        {
            Logger.LogWarning("SetModel failed for {Model}: {Message}", model, ex.Message);
        }
    }

    // CBaseViewModel was removed from the CSS API; the viewmodel entity is a
    // CBaseModelEntity (which is what carries SetModel), so use that type.
    private static CBaseModelEntity? GetViewModel(CCSPlayerController player)
    {
        var vmServicesHandle = player.PlayerPawn.Value?.ViewModelServices?.Handle;
        if (vmServicesHandle is not { } h)
            return null;

        var vmServices = new CCSPlayer_ViewModelServices(h);
        var ptr = vmServices.Handle + Schema.GetSchemaOffset("CCSPlayer_ViewModelServices", "m_hViewModel");
        Span<nint> viewModels = MemoryMarshal.CreateSpan(ref ptr, 3);
        return new CHandle<CBaseModelEntity>(viewModels[0]).Value;
    }
}
