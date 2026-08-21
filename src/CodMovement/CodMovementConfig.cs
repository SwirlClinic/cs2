using System.Text.Json.Serialization;
using CounterStrikeSharp.API.Core;

namespace CodMovement;

public class CodMovementConfig : BasePluginConfig
{
    // "hold"  = sprint while the Speed (walk) key is held — repurposed as sprint
    // "auto"  = always sprint while moving forward on the ground
    [JsonPropertyName("SprintMode")]
    public string SprintMode { get; set; } = "hold";

    // Movement-speed multipliers (1.0 = default CS2 speed).
    [JsonPropertyName("BaseSpeedMultiplier")]
    public float BaseSpeedMultiplier { get; set; } = 1.0f;

    [JsonPropertyName("SprintSpeedMultiplier")]
    public float SprintSpeedMultiplier { get; set; } = 1.45f;

    // "hold" mode only: Shift is CS2's walk key, so holding it also applies the
    // engine's walk slowdown (~0.52x). This factor cancels that so a held Shift
    // sprints instead of walks — effective modifier = Sprint x Compensation.
    // ~1.0/0.52. Tune if the held speed doesn't match the auto-sprint speed.
    [JsonPropertyName("HoldWalkCompensation")]
    public float HoldWalkCompensation { get; set; } = 1.92f;

    // Slide: tap Duck while sprinting and moving fast on the ground.
    [JsonPropertyName("EnableSlide")]
    public bool EnableSlide { get; set; } = true;

    // Initial slide speed as a multiple of the player's current speed.
    [JsonPropertyName("SlideBoostMultiplier")]
    public float SlideBoostMultiplier { get; set; } = 1.6f;

    [JsonPropertyName("SlideDurationSeconds")]
    public float SlideDurationSeconds { get; set; } = 0.85f;

    [JsonPropertyName("SlideCooldownSeconds")]
    public float SlideCooldownSeconds { get; set; } = 1.4f;

    // Minimum horizontal speed (units/sec) required to start a slide.
    [JsonPropertyName("MinSpeedToSlide")]
    public float MinSpeedToSlide { get; set; } = 210.0f;

    // Show the controls in chat when a player spawns.
    [JsonPropertyName("AnnounceControls")]
    public bool AnnounceControls { get; set; } = true;
}
