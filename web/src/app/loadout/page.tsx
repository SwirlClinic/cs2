"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamToggle from "./TeamToggle";
import WeaponGrid from "./WeaponGrid";
import SkinPicker from "./SkinPicker";
import KnifePicker from "./KnifePicker";
import GlovePicker from "./GlovePicker";
import AgentPicker from "./AgentPicker";
import MusicPicker from "./MusicPicker";
import PinPicker from "./PinPicker";
import { DEFINDEX_TO_WEAPON, WEAPON_NAMES } from "@/lib/weapons";
import type { Loadout, SkinItem } from "@/lib/types";

export default function LoadoutPage() {
  const [category, setCategory] = useState("pistols");
  const [team, setTeam] = useState(2); // 2=T, 3=CT
  const [loadout, setLoadout] = useState<Loadout | null>(null);
  const [skinCatalog, setSkinCatalog] = useState<SkinItem[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Fetch loadout
  const fetchLoadout = useCallback(async () => {
    try {
      const res = await fetch("/api/loadout");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setLoadout(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchLoadout();
  }, [fetchLoadout]);

  // Fetch skin catalog for current weapon category
  useEffect(() => {
    if (
      ["pistols", "rifles", "smgs", "shotguns", "machineguns"].includes(
        category
      )
    ) {
      fetch(`/api/items/${category}`)
        .then((r) => r.json())
        .then(setSkinCatalog)
        .catch(() => {});
    }
  }, [category]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  // Save skin
  const handleSaveSkin = async (data: {
    weapon_defindex: number;
    weapon_paint_id: number;
    weapon_wear: number;
    weapon_seed: number;
  }) => {
    setSaving(true);
    try {
      await fetch("/api/skins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weapon_team: team, ...data }),
      });
      showToast("Skin saved!");
      setSelectedWeapon(null);
      fetchLoadout();
    } catch {
      showToast("Failed to save");
    }
    setSaving(false);
  };

  // Save knife
  const handleSaveKnife = async (
    knife: string,
    weapon_defindex: number,
    weapon_paint_id: number,
    weapon_wear: number,
    weapon_seed: number
  ) => {
    setSaving(true);
    try {
      await fetch("/api/knife", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weapon_team: team, knife, weapon_defindex,
          weapon_paint_id, weapon_wear, weapon_seed,
        }),
      });
      showToast("Knife saved!");
      fetchLoadout();
    } catch {
      showToast("Failed to save");
    }
    setSaving(false);
  };

  // Save gloves
  const handleSaveGloves = async (weapon_defindex: number, paint: number) => {
    setSaving(true);
    try {
      await fetch("/api/gloves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weapon_team: team, weapon_defindex, paint }),
      });
      showToast("Gloves saved!");
      fetchLoadout();
    } catch {
      showToast("Failed to save");
    }
    setSaving(false);
  };

  // Save agents
  const handleSaveAgents = async (agent_ct: string, agent_t: string) => {
    setSaving(true);
    try {
      await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_ct, agent_t }),
      });
      showToast("Agent saved!");
      fetchLoadout();
    } catch {
      showToast("Failed to save");
    }
    setSaving(false);
  };

  // Save music
  const handleSaveMusic = async (music_id: number) => {
    setSaving(true);
    try {
      await fetch("/api/music", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weapon_team: team, music_id }),
      });
      showToast("Music kit saved!");
      fetchLoadout();
    } catch {
      showToast("Failed to save");
    }
    setSaving(false);
  };

  // Save pin
  const handleSavePin = async (id: number) => {
    setSaving(true);
    try {
      await fetch("/api/pins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weapon_team: team, id }),
      });
      showToast("Pin saved!");
      fetchLoadout();
    } catch {
      showToast("Failed to save");
    }
    setSaving(false);
  };

  const isWeaponCategory = [
    "pistols",
    "rifles",
    "smgs",
    "shotguns",
    "machineguns",
  ].includes(category);

  // Get current equipped items for pickers
  const currentKnife = loadout?.knife.find((k) => k.weapon_team === team);
  const currentGlove = loadout?.gloves.find((g) => g.weapon_team === team);
  const currentGloveSkin = loadout?.skins.find(
    (s) => s.weapon_defindex === currentGlove?.weapon_defindex && s.weapon_team === team
  );
  // Find knife skin — knife defindexes are 500+
  const currentKnifeSkin = loadout?.skins.find(
    (s) => s.weapon_defindex >= 500 && s.weapon_defindex < 600 && s.weapon_team === team
  );
  const currentMusic = loadout?.music.find((m) => m.weapon_team === team);
  const currentPin = loadout?.pins.find((p) => p.weapon_team === team);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeCategory={category} onCategoryChange={setCategory} />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Team toggle + category title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-bright capitalize">
              {category === "machineguns" ? "Machine Guns" : category}
            </h2>
            {category !== "agents" && (
              <TeamToggle team={team} onChange={setTeam} />
            )}
          </div>

          {!loadout ? (
            <div className="flex items-center justify-center h-64 text-text-dim">
              Loading loadout...
            </div>
          ) : (
            <>
              {isWeaponCategory && (
                <WeaponGrid
                  category={category}
                  team={team}
                  skins={loadout.skins}
                  skinCatalog={skinCatalog}
                  onSelectWeapon={setSelectedWeapon}
                />
              )}

              {category === "knives" && (
                <KnifePicker
                  team={team}
                  currentKnife={currentKnife?.knife}
                  currentDefindex={currentKnifeSkin?.weapon_defindex}
                  currentPaintId={currentKnifeSkin?.weapon_paint_id}
                  onSave={handleSaveKnife}
                />
              )}

              {category === "gloves" && (
                <GlovePicker
                  team={team}
                  currentDefindex={currentGlove?.weapon_defindex}
                  currentPaint={currentGloveSkin?.weapon_paint_id}
                  onSave={handleSaveGloves}
                />
              )}

              {category === "agents" && (
                <AgentPicker
                  currentAgentCT={loadout.agents?.agent_ct}
                  currentAgentT={loadout.agents?.agent_t}
                  onSave={handleSaveAgents}
                />
              )}

              {category === "music" && (
                <MusicPicker
                  team={team}
                  currentMusicId={currentMusic?.music_id}
                  onSave={handleSaveMusic}
                />
              )}

              {category === "pins" && (
                <PinPicker
                  team={team}
                  currentPinId={currentPin?.id}
                  onSave={handleSavePin}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Skin picker slide-out */}
      {selectedWeapon !== null && (
        <SkinPicker
          weaponDefindex={selectedWeapon}
          weaponName={
            WEAPON_NAMES[DEFINDEX_TO_WEAPON[selectedWeapon]] ||
            `Weapon ${selectedWeapon}`
          }
          currentPaintId={
            loadout?.skins.find(
              (s) =>
                s.weapon_defindex === selectedWeapon &&
                s.weapon_team === team
            )?.weapon_paint_id
          }
          team={team}
          onSave={handleSaveSkin}
          onClose={() => setSelectedWeapon(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-accent text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg px-4 py-2 text-sm text-text">
            Saving...
          </div>
        </div>
      )}
    </div>
  );
}
