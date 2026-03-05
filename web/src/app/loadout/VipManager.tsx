"use client";

import { useState, useEffect, useCallback } from "react";
import type { VipGroup, VipPlayer } from "@/lib/types";

type Tab = "groups" | "players";

// ---- Shared styles ----

const btnPrimary =
  "bg-accent hover:bg-accent-hover text-white text-sm px-3 py-1.5 rounded-lg transition-colors";
const btnDanger =
  "bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors";
const btnSecondary =
  "bg-surface-hover hover:bg-border text-text text-sm px-3 py-1.5 rounded-lg transition-colors";
const inputClass =
  "bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors";
const checkboxClass =
  "w-4 h-4 rounded border-border bg-surface accent-accent";
const thClass =
  "text-left text-xs uppercase tracking-wider text-text-dim px-3 py-2";
const tdClass = "px-3 py-2 text-sm text-text";

// ---- Spawn items (grenades/equipment) ----

const SPAWN_ITEMS: { value: string; label: string; group: string }[] = [
  // Grenades
  { value: "weapon_hegrenade", label: "HE Grenade", group: "Grenades" },
  { value: "weapon_flashbang", label: "Flashbang", group: "Grenades" },
  { value: "weapon_smokegrenade", label: "Smoke Grenade", group: "Grenades" },
  { value: "weapon_molotov", label: "Molotov", group: "Grenades" },
  { value: "weapon_incgrenade", label: "Incendiary Grenade", group: "Grenades" },
  { value: "weapon_decoy", label: "Decoy Grenade", group: "Grenades" },
  // Rifles
  { value: "weapon_ak47", label: "AK-47", group: "Rifles" },
  { value: "weapon_m4a1", label: "M4A4", group: "Rifles" },
  { value: "weapon_m4a1_silencer", label: "M4A1-S", group: "Rifles" },
  { value: "weapon_awp", label: "AWP", group: "Rifles" },
  { value: "weapon_aug", label: "AUG", group: "Rifles" },
  { value: "weapon_sg556", label: "SG 553", group: "Rifles" },
  { value: "weapon_famas", label: "FAMAS", group: "Rifles" },
  { value: "weapon_galilar", label: "Galil AR", group: "Rifles" },
  { value: "weapon_ssg08", label: "SSG 08", group: "Rifles" },
  { value: "weapon_scar20", label: "SCAR-20", group: "Rifles" },
  { value: "weapon_g3sg1", label: "G3SG1", group: "Rifles" },
  // SMGs
  { value: "weapon_p90", label: "P90", group: "SMGs" },
  { value: "weapon_mac10", label: "MAC-10", group: "SMGs" },
  { value: "weapon_mp9", label: "MP9", group: "SMGs" },
  { value: "weapon_mp7", label: "MP7", group: "SMGs" },
  { value: "weapon_mp5sd", label: "MP5-SD", group: "SMGs" },
  { value: "weapon_ump45", label: "UMP-45", group: "SMGs" },
  { value: "weapon_bizon", label: "PP-Bizon", group: "SMGs" },
  // Shotguns
  { value: "weapon_nova", label: "Nova", group: "Shotguns" },
  { value: "weapon_xm1014", label: "XM1014", group: "Shotguns" },
  { value: "weapon_mag7", label: "MAG-7", group: "Shotguns" },
  { value: "weapon_sawedoff", label: "Sawed-Off", group: "Shotguns" },
  // Machine Guns
  { value: "weapon_m249", label: "M249", group: "Machine Guns" },
  { value: "weapon_negev", label: "Negev", group: "Machine Guns" },
  // Pistols
  { value: "weapon_deagle", label: "Desert Eagle", group: "Pistols" },
  { value: "weapon_glock", label: "Glock-18", group: "Pistols" },
  { value: "weapon_usp_silencer", label: "USP-S", group: "Pistols" },
  { value: "weapon_hkp2000", label: "P2000", group: "Pistols" },
  { value: "weapon_p250", label: "P250", group: "Pistols" },
  { value: "weapon_fiveseven", label: "Five-SeveN", group: "Pistols" },
  { value: "weapon_tec9", label: "Tec-9", group: "Pistols" },
  { value: "weapon_elite", label: "Dual Berettas", group: "Pistols" },
  { value: "weapon_cz75a", label: "CZ75-Auto", group: "Pistols" },
  { value: "weapon_revolver", label: "R8 Revolver", group: "Pistols" },
];

// ---- Helper: perks summary for table ----

function perksSummary(perks: Record<string, number | boolean>): string {
  const parts: string[] = [];
  if (typeof perks.health_bonus === "number" && perks.health_bonus > 0)
    parts.push(`+${perks.health_bonus} HP`);
  if (perks.armor) parts.push("Armor");
  if (perks.helmet) parts.push("Helmet");
  if (perks.defuser) parts.push("Defuser");
  if (typeof perks.extra_money === "number" && perks.extra_money > 0)
    parts.push(`+$${perks.extra_money}`);
  if (perks.bhop) parts.push("Bhop");
  if (perks.unlimited_ammo) parts.push("Unlimited Ammo");
  for (const [key, val] of Object.entries(perks)) {
    if (key.startsWith("weapon_") && typeof val === "number" && val > 0) {
      const item = SPAWN_ITEMS.find((i) => i.value === key);
      parts.push(`${val}x ${item?.label ?? key}`);
    }
  }
  return parts.length > 0 ? parts.join(", ") : "-";
}

// ---- Empty group template ----

interface GroupForm {
  id?: number;
  group_name: string;
  perks: Record<string, number | boolean>;
  weapons: string;
}

const emptyGroup: GroupForm = {
  group_name: "",
  perks: {},
  weapons: "",
};

// ---- Spawn item row type ----

interface SpawnItemRow {
  key: string;
  item: string;
  count: number;
}

export default function VipManager() {
  const [tab, setTab] = useState<Tab>("groups");
  const [groups, setGroups] = useState<VipGroup[]>([]);
  const [players, setPlayers] = useState<VipPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Group form
  const [editingGroup, setEditingGroup] = useState<GroupForm | null>(null);
  const [spawnItems, setSpawnItems] = useState<SpawnItemRow[]>([]);

  // Player form
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    steamid: "",
    player_name: "",
    vip_group: "",
    days: 30,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/vip/groups");
      if (res.ok) setGroups(await res.json());
    } catch {}
  }, []);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/vip/players");
      if (res.ok) setPlayers(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchGroups(), fetchPlayers()]).then(() => setLoading(false));
  }, [fetchGroups, fetchPlayers]);

  // ---- Open group form (extract spawn items from perks) ----

  const openGroupForm = (group?: VipGroup) => {
    if (group) {
      const perks = { ...group.perks };
      const items: SpawnItemRow[] = [];
      for (const [key, val] of Object.entries(perks)) {
        if (key.startsWith("weapon_") && typeof val === "number") {
          items.push({ key: crypto.randomUUID(), item: key, count: val });
        }
      }
      setSpawnItems(items);
      setEditingGroup({
        id: group.id,
        group_name: group.group_name,
        perks,
        weapons: group.weapons ?? "",
      });
    } else {
      setSpawnItems([]);
      setEditingGroup({ ...emptyGroup });
    }
  };

  // ---- Build perks from form state ----

  const buildPerks = (): Record<string, number | boolean> => {
    if (!editingGroup) return {};
    const perks: Record<string, number | boolean> = {};
    // Settings
    const hp = editingGroup.perks.health_bonus;
    if (typeof hp === "number" && hp > 0) perks.health_bonus = hp;
    if (editingGroup.perks.armor) perks.armor = true;
    if (editingGroup.perks.helmet) perks.helmet = true;
    if (editingGroup.perks.defuser) perks.defuser = true;
    if (editingGroup.perks.bhop) perks.bhop = true;
    if (editingGroup.perks.unlimited_ammo) perks.unlimited_ammo = true;
    const money = editingGroup.perks.extra_money;
    if (typeof money === "number" && money > 0) perks.extra_money = money;
    // Spawn items
    for (const row of spawnItems) {
      if (row.item && row.count > 0) perks[row.item] = row.count;
    }
    return perks;
  };

  // ---- Group CRUD ----

  const saveGroup = async () => {
    if (!editingGroup?.group_name) return;
    const method = editingGroup.id ? "PUT" : "POST";
    const payload = {
      id: editingGroup.id,
      group_name: editingGroup.group_name,
      perks: buildPerks(),
      weapons: editingGroup.weapons || null,
    };
    try {
      const res = await fetch("/api/vip/groups", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingGroup.id ? "Group updated" : "Group created");
        setEditingGroup(null);
        setSpawnItems([]);
        fetchGroups();
      }
    } catch {
      showToast("Failed to save group");
    }
  };

  const deleteGroup = async (id: number) => {
    try {
      const res = await fetch("/api/vip/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("Group deleted");
        fetchGroups();
      }
    } catch {
      showToast("Failed to delete group");
    }
  };

  // ---- Player CRUD ----

  const addPlayer = async () => {
    if (!playerForm.steamid || !playerForm.vip_group) return;
    try {
      const res = await fetch("/api/vip/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerForm),
      });
      if (res.ok) {
        showToast("Player added");
        setShowPlayerForm(false);
        setPlayerForm({ steamid: "", player_name: "", vip_group: "", days: 30 });
        fetchPlayers();
      }
    } catch {
      showToast("Failed to add player");
    }
  };

  const deletePlayer = async (id: number) => {
    try {
      const res = await fetch("/api/vip/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("Player removed");
        fetchPlayers();
      }
    } catch {
      showToast("Failed to remove player");
    }
  };

  // ---- Spawn Items handlers ----

  const addSpawnItem = () => {
    // Pick the first item not already used, or default to first
    const usedItems = new Set(spawnItems.map((r) => r.item));
    const available = SPAWN_ITEMS.find((i) => !usedItems.has(i.value));
    setSpawnItems([
      ...spawnItems,
      { key: crypto.randomUUID(), item: available?.value ?? SPAWN_ITEMS[0].value, count: 1 },
    ]);
  };

  const updateSpawnItem = (key: string, field: "item" | "count", value: string | number) => {
    setSpawnItems(
      spawnItems.map((r) =>
        r.key === key ? { ...r, [field]: field === "count" ? Number(value) : value } : r
      )
    );
  };

  const removeSpawnItem = (key: string) => {
    setSpawnItems(spawnItems.filter((r) => r.key !== key));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-dim">
        Loading VIP data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
        {(["groups", "players"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-accent text-white"
                : "text-text-dim hover:text-text hover:bg-surface-hover"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ========== GROUPS TAB ========== */}
      {tab === "groups" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-bright">
              VIP Groups ({groups.length})
            </h3>
            {!editingGroup && (
              <button onClick={() => openGroupForm()} className={btnPrimary}>
                + Add Group
              </button>
            )}
          </div>

          {/* Group form (add/edit) */}
          {editingGroup && (
            <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
              <p className="text-sm font-medium text-text-bright">
                {editingGroup.id ? "Edit Group" : "New Group"}
              </p>

              {/* Name */}
              <div>
                <label className="block text-xs text-text-dim mb-1">Group Name</label>
                <input
                  className={inputClass + " w-full max-w-xs"}
                  value={editingGroup.group_name}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, group_name: e.target.value })
                  }
                  placeholder="e.g. Gold"
                />
              </div>

              {/* Settings section */}
              <div>
                <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
                  Settings
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-text-dim mb-1">Health Bonus</label>
                    <input
                      type="number"
                      className={inputClass + " w-full"}
                      value={(editingGroup.perks.health_bonus as number) ?? 0}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          perks: { ...editingGroup.perks, health_bonus: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-dim mb-1">Extra $/round</label>
                    <input
                      type="number"
                      className={inputClass + " w-full"}
                      value={(editingGroup.perks.extra_money as number) ?? 0}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          perks: { ...editingGroup.perks, extra_money: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={!!editingGroup.perks.armor}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          perks: { ...editingGroup.perks, armor: e.target.checked },
                        })
                      }
                    />
                    Armor
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={!!editingGroup.perks.helmet}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          perks: { ...editingGroup.perks, helmet: e.target.checked },
                        })
                      }
                    />
                    Helmet
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={!!editingGroup.perks.defuser}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          perks: { ...editingGroup.perks, defuser: e.target.checked },
                        })
                      }
                    />
                    Defuser
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={!!editingGroup.perks.bhop}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          perks: { ...editingGroup.perks, bhop: e.target.checked },
                        })
                      }
                    />
                    Bunny Hop
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={!!editingGroup.perks.unlimited_ammo}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          perks: { ...editingGroup.perks, unlimited_ammo: e.target.checked },
                        })
                      }
                    />
                    Unlimited Grenades
                  </label>
                </div>
              </div>

              {/* Spawn Items section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-text-dim uppercase tracking-wider">
                    Spawn Items
                  </p>
                  <button onClick={addSpawnItem} className={btnSecondary + " text-xs"}>
                    + Add Item
                  </button>
                </div>
                {spawnItems.length === 0 && (
                  <p className="text-xs text-text-dim">No spawn items configured.</p>
                )}
                <div className="space-y-2">
                  {spawnItems.map((row) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <select
                        className={inputClass}
                        value={row.item}
                        onChange={(e) => updateSpawnItem(row.key, "item", e.target.value)}
                      >
                        {Object.entries(
                          SPAWN_ITEMS.reduce<Record<string, typeof SPAWN_ITEMS>>((acc, si) => {
                            (acc[si.group] ??= []).push(si);
                            return acc;
                          }, {})
                        ).map(([group, items]) => (
                          <optgroup key={group} label={group}>
                            {items.map((si) => (
                              <option key={si.value} value={si.value}>
                                {si.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <input
                        type="number"
                        className={inputClass + " w-20"}
                        value={row.count}
                        min={1}
                        onChange={(e) => updateSpawnItem(row.key, "count", e.target.value)}
                      />
                      <button
                        onClick={() => removeSpawnItem(row.key)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-surface-hover transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weapons (VIP menu list) */}
              <div>
                <label className="block text-xs text-text-dim mb-1">
                  Weapons Menu (comma-separated, e.g. weapon_ak47,weapon_m4a1)
                </label>
                <input
                  className={inputClass + " w-full"}
                  value={editingGroup.weapons}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, weapons: e.target.value })
                  }
                  placeholder="weapon_ak47,weapon_m4a1_silencer"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={saveGroup} className={btnPrimary}>
                  {editingGroup.id ? "Save Changes" : "Create Group"}
                </button>
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setSpawnItems([]);
                  }}
                  className={btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Groups table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Perks</th>
                    <th className={thClass}>Weapons</th>
                    <th className={thClass}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groups.map((g) => (
                    <tr key={g.id} className="hover:bg-surface-hover transition-colors">
                      <td className={tdClass + " font-medium text-text-bright"}>
                        {g.group_name}
                      </td>
                      <td className={tdClass + " max-w-[400px]"}>
                        {perksSummary(g.perks ?? {})}
                      </td>
                      <td className={tdClass + " max-w-[200px] truncate text-text-dim"}>
                        {g.weapons || "-"}
                      </td>
                      <td className={tdClass}>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openGroupForm(g)}
                            className="text-accent hover:text-accent-hover text-xs px-2 py-1 rounded hover:bg-surface-hover transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteGroup(g.id)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-surface-hover transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-text-dim text-sm">
                        No VIP groups yet. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== PLAYERS TAB ========== */}
      {tab === "players" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-bright">
              VIP Players ({players.length})
            </h3>
            {!showPlayerForm && (
              <button
                onClick={() => setShowPlayerForm(true)}
                className={btnPrimary}
              >
                + Add Player
              </button>
            )}
          </div>

          {/* Player form */}
          {showPlayerForm && (
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-text-bright">Add VIP Player</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-text-dim mb-1">Steam ID</label>
                  <input
                    className={inputClass + " w-full"}
                    value={playerForm.steamid}
                    onChange={(e) =>
                      setPlayerForm({ ...playerForm, steamid: e.target.value })
                    }
                    placeholder="76561198..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1">Name</label>
                  <input
                    className={inputClass + " w-full"}
                    value={playerForm.player_name}
                    onChange={(e) =>
                      setPlayerForm({ ...playerForm, player_name: e.target.value })
                    }
                    placeholder="Player name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1">Group</label>
                  <select
                    className={inputClass + " w-full"}
                    value={playerForm.vip_group}
                    onChange={(e) =>
                      setPlayerForm({ ...playerForm, vip_group: e.target.value })
                    }
                  >
                    <option value="">Select group...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.group_name}>
                        {g.group_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1">Days</label>
                  <input
                    type="number"
                    className={inputClass + " w-full"}
                    value={playerForm.days}
                    onChange={(e) =>
                      setPlayerForm({ ...playerForm, days: Number(e.target.value) })
                    }
                    min={1}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addPlayer} className={btnPrimary}>
                  Add Player
                </button>
                <button
                  onClick={() => setShowPlayerForm(false)}
                  className={btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Players table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Steam ID</th>
                    <th className={thClass}>Group</th>
                    <th className={thClass}>Expires</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {players.map((p) => {
                    const expired = new Date(p.expire_date) < new Date();
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-surface-hover transition-colors ${expired ? "opacity-50" : ""}`}
                      >
                        <td className={tdClass + " font-medium text-text-bright"}>
                          {p.player_name || "-"}
                        </td>
                        <td className={tdClass + " font-mono text-xs"}>{p.steamid}</td>
                        <td className={tdClass}>{p.vip_group}</td>
                        <td className={tdClass}>
                          {new Date(p.expire_date).toLocaleDateString()}
                        </td>
                        <td className={tdClass}>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              expired
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {expired ? "Expired" : "Active"}
                          </span>
                        </td>
                        <td className={tdClass}>
                          <button
                            onClick={() => deletePlayer(p.id)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-surface-hover transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {players.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-text-dim text-sm">
                        No VIP players yet. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-accent text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
