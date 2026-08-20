using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Utils;

namespace CodMovement;

// Call-of-Duty-style movement for CS2: hold-to-sprint plus a momentum slide.
// Sprint scales CCSPlayerPawn.m_flVelocityModifier; slide drives m_vecAbsVelocity
// directly for its duration, decaying the boost back to run speed.
public class CodMovement : BasePlugin, IPluginConfig<CodMovementConfig>
{
    public override string ModuleName => "CodMovement";
    public override string ModuleVersion => "1.0.0";
    public override string ModuleAuthor => "SwirlClinic";
    public override string ModuleDescription => "CoD-style sprint + slide movement";

    public CodMovementConfig Config { get; set; } = new();

    private sealed class State
    {
        public bool Sliding;
        public float SlideEndTime;
        public float NextSlideTime;
        public float SlideDirX;
        public float SlideDirY;
        public float SlideStartSpeed;
        public PlayerButtons PrevButtons;
    }

    private readonly State[] _state = new State[64];

    public void OnConfigParsed(CodMovementConfig config) => Config = config;

    public override void Load(bool hotReload)
    {
        for (var i = 0; i < _state.Length; i++)
            _state[i] = new State();

        RegisterListener<Listeners.OnTick>(OnTick);

        RegisterEventHandler<EventPlayerSpawn>((ev, _) =>
        {
            var player = ev.Userid;
            if (player is { IsValid: true } && player.Slot >= 0 && player.Slot < _state.Length)
            {
                _state[player.Slot] = new State();
                if (Config.AnnounceControls && !player.IsBot)
                {
                    var sprintHint = Config.SprintMode == "auto"
                        ? $"You {ChatColors.Yellow}auto-sprint{ChatColors.Default} while moving"
                        : $"Hold {ChatColors.Yellow}Shift{ChatColors.Default} to sprint";
                    player.PrintToChat(
                        $" {ChatColors.Green}[CoD]{ChatColors.Default} {sprintHint} — tap " +
                        $"{ChatColors.Yellow}Duck{ChatColors.Default} at speed to slide.");
                }
            }
            return HookResult.Continue;
        });
    }

    private void OnTick()
    {
        var now = Server.CurrentTime;

        foreach (var player in Utilities.GetPlayers())
        {
            if (player is not { IsValid: true } || player.IsHLTV || !player.PawnIsAlive)
                continue;
            if (player.Slot < 0 || player.Slot >= _state.Length)
                continue;

            var pawn = player.PlayerPawn.Value;
            if (pawn is not { IsValid: true })
                continue;

            var st = _state[player.Slot];
            var buttons = player.Buttons;
            var flags = (PlayerFlags)pawn.Flags;
            var grounded = (flags & PlayerFlags.FL_ONGROUND) != 0;

            var vel = pawn.AbsVelocity;
            var speed = MathF.Sqrt(vel.X * vel.X + vel.Y * vel.Y);

            var movingForward = (buttons & PlayerButtons.Forward) != 0;
            var sprintHeld = (buttons & PlayerButtons.Speed) != 0;
            var wantSprint = Config.SprintMode == "auto" ? movingForward : sprintHeld;

            var duckTapped = (buttons & PlayerButtons.Duck) != 0
                             && (st.PrevButtons & PlayerButtons.Duck) == 0;
            var jumpHeld = (buttons & PlayerButtons.Jump) != 0;

            // ----- Start a slide -----
            if (Config.EnableSlide && !st.Sliding && grounded
                && now >= st.NextSlideTime
                && wantSprint && speed >= Config.MinSpeedToSlide
                && duckTapped)
            {
                st.Sliding = true;
                st.SlideEndTime = now + Config.SlideDurationSeconds;
                st.SlideStartSpeed = speed * Config.SlideBoostMultiplier;
                st.SlideDirX = vel.X / speed;
                st.SlideDirY = vel.Y / speed;
            }

            if (st.Sliding)
            {
                // End conditions: time up, airborne, or jumping out of the slide.
                if (now >= st.SlideEndTime || !grounded || jumpHeld)
                {
                    st.Sliding = false;
                    st.NextSlideTime = now + Config.SlideCooldownSeconds;
                }
                else
                {
                    // Decay slide speed from the boosted start back toward run speed.
                    var runSpeed = 250f * Config.SprintSpeedMultiplier;
                    var t = (st.SlideEndTime - now) / Config.SlideDurationSeconds; // 1 -> 0
                    var cur = runSpeed + (st.SlideStartSpeed - runSpeed) * t;
                    vel.X = st.SlideDirX * cur;
                    vel.Y = st.SlideDirY * cur;
                    // Velocity modifier is neutral during a slide (velocity is driven directly).
                    ApplyModifier(pawn, 1.0f);
                    st.PrevButtons = buttons;
                    continue;
                }
            }

            // ----- Sprint (when not sliding) -----
            var target = wantSprint ? Config.SprintSpeedMultiplier : Config.BaseSpeedMultiplier;
            ApplyModifier(pawn, target);

            st.PrevButtons = buttons;
        }
    }

    // Re-applied every tick: the engine resets m_flVelocityModifier frame to
    // frame, so a one-shot set silently decays back to 1.0.
    private static void ApplyModifier(CCSPlayerPawn pawn, float value)
    {
        pawn.VelocityModifier = value;
        Utilities.SetStateChanged(pawn, "CCSPlayerPawn", "m_flVelocityModifier");
    }
}
