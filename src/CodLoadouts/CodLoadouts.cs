using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Memory;
using CounterStrikeSharp.API.Modules.Utils;

namespace CodLoadouts;

// Class-based loadouts for the CoD gamemode: pick a class with !class, spawn
// with its weapons — each class can carry its own custom weapon models
// (view + world) and subclass swaps, so every slot is a distinct weapon.
public class CodLoadouts : BasePlugin, IPluginConfig<CodLoadoutsConfig>
{
    public override string ModuleName => "CodLoadouts";
    public override string ModuleVersion => "1.1.0";
    public override string ModuleAuthor => "SwirlClinic";
    public override string ModuleDescription => "CoD-style class loadouts with per-class custom weapons";

    public CodLoadoutsConfig Config { get; set; } = new();

    private readonly string?[] _selected = new string?[64];

    public void OnConfigParsed(CodLoadoutsConfig config) => Config = config;

    public override void Load(bool hotReload)
    {
        AddCommand("css_class", "Select your loadout class", OnClassCommand);
        AddCommand("css_loadout", "Select your loadout class", OnClassCommand);
        AddCommand("css_classes", "List loadout classes", (player, _) =>
        {
            if (player is { IsValid: true })
                PrintClasses(player);
        });

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

        // The engine re-sets the viewmodel every weapon deploy, so per-class
        // viewmodel overrides must be re-applied each time a weapon is equipped.
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

        RegisterEventHandler<EventPlayerDisconnect>((ev, _) =>
        {
            var player = ev.Userid;
            if (player is { IsValid: true } && player.Slot >= 0 && player.Slot < _selected.Length)
                _selected[player.Slot] = null;
            return HookResult.Continue;
        });
    }

    private LoadoutSpec? CurrentLoadout(CCSPlayerController player)
    {
        var name = (player.Slot >= 0 && player.Slot < _selected.Length ? _selected[player.Slot] : null)
                   ?? Config.DefaultLoadout;
        return Config.Loadouts.TryGetValue(name, out var loadout) ? loadout : null;
    }

    private void OnClassCommand(CCSPlayerController? player, CommandInfo info)
    {
        if (player is not { IsValid: true })
            return;

        var arg = info.GetArg(1).Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(arg) || !Config.Loadouts.ContainsKey(arg))
        {
            PrintClasses(player);
            return;
        }

        if (player.Slot >= 0 && player.Slot < _selected.Length)
            _selected[player.Slot] = arg;
        player.PrintToChat($" {ChatColors.Green}[CoD]{ChatColors.Default} Class set: {ChatColors.Yellow}{arg}{ChatColors.Default}");
        if (player.PawnIsAlive)
            ApplyLoadout(player, announce: false);
    }

    private void PrintClasses(CCSPlayerController player)
    {
        player.PrintToChat(
            $" {ChatColors.Green}[CoD]{ChatColors.Default} Classes: " +
            $"{ChatColors.Yellow}{string.Join(", ", Config.Loadouts.Keys)}{ChatColors.Default} — !class <name>");
    }

    private void ApplyLoadout(CCSPlayerController player, bool announce)
    {
        var name = (player.Slot >= 0 && player.Slot < _selected.Length ? _selected[player.Slot] : null)
                   ?? Config.DefaultLoadout;
        if (!Config.Loadouts.TryGetValue(name, out var loadout))
            return;

        player.RemoveWeapons();
        player.GiveNamedItem("weapon_knife");
        foreach (var weapon in loadout.Weapons)
            player.GiveNamedItem(weapon);
        foreach (var grenade in loadout.Grenades)
            player.GiveNamedItem(grenade);
        if (Config.GiveArmor)
            player.GiveNamedItem("item_assaultsuit");

        // Customize the granted weapons once they exist as entities.
        var slot = player.Slot;
        AddTimer(0.1f, () =>
        {
            var p = Utilities.GetPlayerFromSlot(slot);
            if (p is { IsValid: true } && p.PawnIsAlive)
                ApplyCustoms(p, loadout);
        });

        if (announce && !player.IsBot)
        {
            player.PrintToChat(
                $" {ChatColors.Green}[CoD]{ChatColors.Default} Class: {ChatColors.Yellow}{name}{ChatColors.Default} — !class to change");
        }
    }

    private void ApplyCustoms(CCSPlayerController player, LoadoutSpec loadout)
    {
        var weaponServices = player.PlayerPawn.Value?.WeaponServices;
        if (weaponServices == null)
            return;

        foreach (var handle in weaponServices.MyWeapons)
        {
            var weapon = handle.Value;
            if (weapon is not { IsValid: true })
                continue;
            var designer = weapon.DesignerName;

            if (loadout.Subclasses.TryGetValue(designer, out var subclass) && !string.IsNullOrWhiteSpace(subclass))
                ChangeSubclass(weapon, subclass);

            if (loadout.Models.TryGetValue(designer, out var model) && !string.IsNullOrWhiteSpace(model))
                SetWorldModel(weapon, model);
        }
        ApplyViewModelForActiveWeapon(player);
    }

    private void ApplyViewModelForActiveWeapon(CCSPlayerController player)
    {
        var loadout = CurrentLoadout(player);
        if (loadout == null || loadout.Models.Count == 0)
            return;

        var active = player.PlayerPawn.Value?.WeaponServices?.ActiveWeapon.Value;
        if (active is not { IsValid: true })
            return;
        if (!loadout.Models.TryGetValue(active.DesignerName, out var model) || string.IsNullOrWhiteSpace(model))
            return;

        try
        {
            GetViewModel(player)?.SetModel(model);
        }
        catch (Exception ex)
        {
            Logger.LogWarning("Viewmodel SetModel failed for {Model}: {Message}", model, ex.Message);
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

    private static CBaseViewModel? GetViewModel(CCSPlayerController player)
    {
        var vmServicesHandle = player.PlayerPawn.Value?.ViewModelServices?.Handle;
        if (vmServicesHandle is not { } h)
            return null;

        var vmServices = new CCSPlayer_ViewModelServices(h);
        var ptr = vmServices.Handle + Schema.GetSchemaOffset("CCSPlayer_ViewModelServices", "m_hViewModel");
        Span<nint> viewModels = MemoryMarshal.CreateSpan(ref ptr, 3);
        return new CHandle<CBaseViewModel>(viewModels[0]).Value;
    }
}
