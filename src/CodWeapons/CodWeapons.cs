using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Memory;
using CounterStrikeSharp.API.Modules.Utils;

namespace CodWeapons;

// Custom weapon models/animations for the CoD gamemode. Applies per-weapon
// model swaps two ways:
//   - WeaponSubclass: ChangeSubclass input (animgraph2-safe) -> swaps to another
//     defined weapon subclass (shipped variants by item-definition index, or a
//     custom subclass name from a mounted Workshop addon).
//   - ModelOverride: direct SetModel of a custom .vmdl (view + world) for
//     fully-bespoke assets shipped in a mounted addon.
public class CodWeapons : BasePlugin, IPluginConfig<CodWeaponsConfig>
{
    public override string ModuleName => "CodWeapons";
    public override string ModuleVersion => "1.0.0";
    public override string ModuleAuthor => "SwirlClinic";
    public override string ModuleDescription => "Custom weapon models/animations for the CoD gamemode";

    public CodWeaponsConfig Config { get; set; } = new();

    public void OnConfigParsed(CodWeaponsConfig config) => Config = config;

    public override void Load(bool hotReload)
    {
        // Re-apply whenever a weapon is equipped (covers pickups and switches).
        RegisterEventHandler<EventItemEquip>((ev, _) =>
        {
            var player = ev.Userid;
            if (player is { IsValid: true })
                ApplyToPlayerWeapons(player);
            return HookResult.Continue;
        });

        RegisterEventHandler<EventPlayerSpawn>((ev, _) =>
        {
            var player = ev.Userid;
            if (player is not { IsValid: true } || player.IsBot)
                return HookResult.Continue;
            if (Config.AnnounceLoadout && (Config.WeaponSubclass.Count > 0 || Config.ModelOverride.Count > 0))
            {
                player.PrintToChat(
                    $" {ChatColors.Green}[CoD]{ChatColors.Default} Custom weapon models are active in this arena.");
            }
            return HookResult.Continue;
        });
    }

    private void ApplyToPlayerWeapons(CCSPlayerController player)
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

            if (Config.WeaponSubclass.TryGetValue(designer, out var subclass) && !string.IsNullOrWhiteSpace(subclass))
                ChangeSubclass(weapon, subclass);

            if (Config.ModelOverride.TryGetValue(designer, out var model) && !string.IsNullOrWhiteSpace(model))
                SetWeaponModel(player, weapon, model);
        }
    }

    // Swap the weapon to another defined subclass (model + animations). Deferred
    // to the next world update, mirroring the proven cs2-store technique.
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

    // Direct model replacement for bespoke .vmdl content from a mounted addon.
    private void SetWeaponModel(CCSPlayerController player, CBasePlayerWeapon weapon, string model)
    {
        try
        {
            var isActive = weapon.Handle == player.PlayerPawn.Value?.WeaponServices?.ActiveWeapon.Value?.Handle;
            weapon.SetModel(model);
            if (isActive)
                GetViewModel(player)?.SetModel(model);
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
