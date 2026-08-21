using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Utils;

namespace CodLoadouts;

// Class-based loadouts for the CoD gamemode: pick a class with !class, spawn
// with its weapons. The spawn grant replaces whatever the game mode handed out.
public class CodLoadouts : BasePlugin, IPluginConfig<CodLoadoutsConfig>
{
    public override string ModuleName => "CodLoadouts";
    public override string ModuleVersion => "1.0.0";
    public override string ModuleAuthor => "SwirlClinic";
    public override string ModuleDescription => "CoD-style class loadouts";

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

        RegisterEventHandler<EventPlayerDisconnect>((ev, _) =>
        {
            var player = ev.Userid;
            if (player is { IsValid: true } && player.Slot >= 0 && player.Slot < _selected.Length)
                _selected[player.Slot] = null;
            return HookResult.Continue;
        });
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

        if (announce && !player.IsBot)
        {
            player.PrintToChat(
                $" {ChatColors.Green}[CoD]{ChatColors.Default} Class: {ChatColors.Yellow}{name}{ChatColors.Default} — !class to change");
        }
    }
}
