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
