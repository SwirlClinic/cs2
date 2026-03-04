"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Tab = "settings" | "maps" | "rcon" | "config" | "players";

const btnPrimary =
  "bg-accent hover:bg-accent-hover text-white text-sm px-3 py-1.5 rounded-lg transition-colors";
const btnDanger =
  "bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors";
const btnSecondary =
  "bg-surface-hover hover:bg-border text-text text-sm px-3 py-1.5 rounded-lg transition-colors";
const inputClass =
  "bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors";

// ---- Quick Settings cvar definitions ----

interface CvarDef {
  key: string;
  label: string;
  type: "text" | "number" | "toggle";
}

const CVARS: CvarDef[] = [
  { key: "hostname", label: "Server Name", type: "text" },
  { key: "mp_maxrounds", label: "Max Rounds", type: "number" },
  { key: "mp_roundtime", label: "Round Time", type: "number" },
  { key: "mp_freezetime", label: "Freeze Time", type: "number" },
  { key: "mp_buytime", label: "Buy Time", type: "number" },
  { key: "mp_warmuptime", label: "Warmup Time", type: "number" },
  { key: "sv_alltalk", label: "All Talk", type: "toggle" },
  { key: "mp_autoteambalance", label: "Auto Team Balance", type: "toggle" },
  { key: "mp_friendlyfire", label: "Friendly Fire", type: "toggle" },
];

const WEAPON_LIST = [
  { value: "weapon_ak47", label: "AK-47" },
  { value: "weapon_m4a1", label: "M4A4" },
  { value: "weapon_m4a1_silencer", label: "M4A1-S" },
  { value: "weapon_awp", label: "AWP" },
  { value: "weapon_deagle", label: "Desert Eagle" },
  { value: "weapon_aug", label: "AUG" },
  { value: "weapon_sg556", label: "SG 553" },
  { value: "weapon_famas", label: "FAMAS" },
  { value: "weapon_galilar", label: "Galil AR" },
  { value: "weapon_ssg08", label: "SSG 08" },
  { value: "weapon_scar20", label: "SCAR-20" },
  { value: "weapon_g3sg1", label: "G3SG1" },
  { value: "weapon_p90", label: "P90" },
  { value: "weapon_mac10", label: "MAC-10" },
  { value: "weapon_mp9", label: "MP9" },
  { value: "weapon_mp7", label: "MP7" },
  { value: "weapon_mp5sd", label: "MP5-SD" },
  { value: "weapon_ump45", label: "UMP-45" },
  { value: "weapon_bizon", label: "PP-Bizon" },
  { value: "weapon_nova", label: "Nova" },
  { value: "weapon_xm1014", label: "XM1014" },
  { value: "weapon_mag7", label: "MAG-7" },
  { value: "weapon_sawedoff", label: "Sawed-Off" },
  { value: "weapon_m249", label: "M249" },
  { value: "weapon_negev", label: "Negev" },
  { value: "weapon_glock", label: "Glock-18" },
  { value: "weapon_usp_silencer", label: "USP-S" },
  { value: "weapon_hkp2000", label: "P2000" },
  { value: "weapon_p250", label: "P250" },
  { value: "weapon_fiveseven", label: "Five-SeveN" },
  { value: "weapon_tec9", label: "Tec-9" },
  { value: "weapon_elite", label: "Dual Berettas" },
  { value: "weapon_cz75a", label: "CZ75-Auto" },
  { value: "weapon_revolver", label: "R8 Revolver" },
  { value: "weapon_hegrenade", label: "HE Grenade" },
  { value: "weapon_flashbang", label: "Flashbang" },
  { value: "weapon_smokegrenade", label: "Smoke Grenade" },
  { value: "weapon_molotov", label: "Molotov" },
  { value: "weapon_incgrenade", label: "Incendiary Grenade" },
  { value: "weapon_decoy", label: "Decoy Grenade" },
];

// ---- Helper ----

async function rcon(command: string): Promise<string> {
  const res = await fetch("/api/server/rcon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "RCON error");
  return data.response;
}

export default function ServerManager() {
  const [tab, setTab] = useState<Tab>("settings");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Quick Settings state
  const [cvarValues, setCvarValues] = useState<Record<string, string>>({});
  const [cvarOriginal, setCvarOriginal] = useState<Record<string, string>>({});

  // Map Control state
  const [currentMap, setCurrentMap] = useState("Unknown");
  const [mapInput, setMapInput] = useState("");
  const [workshopInput, setWorkshopInput] = useState("");
  const [availableMaps, setAvailableMaps] = useState<string[]>([]);
  const [workshopMaps, setWorkshopMaps] = useState<{ id: string; title: string }[]>([]);

  // RCON Console state
  const [rconInput, setRconInput] = useState("");
  const [rconHistory, setRconHistory] = useState<{ cmd: string; res: string }[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Config Editor state
  const [configContent, setConfigContent] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

  // Players tab state
  const [onlinePlayers, setOnlinePlayers] = useState<{ name: string; steamId: string; userId: string }[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playerWeapons, setPlayerWeapons] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  // ---- Load Quick Settings values ----

  const fetchCvarValues = useCallback(async () => {
    setLoading(true);
    const values: Record<string, string> = {};
    try {
      // Batch fetch: get each cvar value
      const results = await Promise.allSettled(
        CVARS.map(async (cvar) => {
          const response = await rcon(cvar.key);
          // CS2 format: "cvarname = value\n"
          // Source 1 format: '"cvarname" = "value" (...)'
          const quoted = response.match(/"([^"]*)"[^"]*"([^"]*)"/);
          if (quoted) return { key: cvar.key, value: quoted[2] };
          const plain = response.match(/^\s*\S+\s*=\s*(.*)/);
          return { key: cvar.key, value: plain ? plain[1].trim() : response.trim() };
        })
      );
      for (const result of results) {
        if (result.status === "fulfilled") {
          values[result.value.key] = result.value.value;
        }
      }
    } catch {
      // ignore individual failures
    }
    setCvarValues(values);
    setCvarOriginal(values);
    setLoading(false);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/server/status");
      if (res.ok) {
        const data = await res.json();
        setCurrentMap(data.map);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchMaps = useCallback(async () => {
    try {
      const res = await fetch("/api/server/maps");
      if (res.ok) {
        const data = await res.json();
        setAvailableMaps(data.maps);
        setWorkshopMaps(data.workshopMaps);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/server/config");
      if (res.ok) {
        const data = await res.json();
        setConfigContent(data.content);
      }
    } catch {
      // ignore
    }
    setConfigLoading(false);
  }, []);

  const fetchPlayers = useCallback(async () => {
    setPlayersLoading(true);
    try {
      const res = await fetch("/api/server/players");
      if (res.ok) setOnlinePlayers(await res.json());
    } catch {}
    setPlayersLoading(false);
  }, []);

  useEffect(() => {
    fetchCvarValues();
    fetchStatus();
    fetchMaps();
  }, [fetchCvarValues, fetchStatus, fetchMaps]);

  useEffect(() => {
    if (tab === "config") fetchConfig();
    if (tab === "players") fetchPlayers();
  }, [tab, fetchConfig, fetchPlayers]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rconHistory]);

  // ---- Quick Settings handlers ----

  const handleCvarChange = (key: string, value: string) => {
    setCvarValues((prev) => ({ ...prev, [key]: value }));
  };

  const applySettings = async () => {
    const changed = CVARS.filter((c) => cvarValues[c.key] !== cvarOriginal[c.key]);
    if (changed.length === 0) {
      showToast("No changes to apply");
      return;
    }

    try {
      for (const cvar of changed) {
        await rcon(`${cvar.key} ${cvarValues[cvar.key]}`);
      }
      setCvarOriginal({ ...cvarValues });

      // Also update server.cfg with changed values
      try {
        const cfgRes = await fetch("/api/server/config");
        if (cfgRes.ok) {
          const { content } = await cfgRes.json();
          let lines = content.split("\n");
          for (const cvar of changed) {
            const regex = new RegExp(`^\\s*${cvar.key}\\s+`, "m");
            const newLine = `${cvar.key} ${cvarValues[cvar.key]}`;
            const idx = lines.findIndex((l: string) => regex.test(l));
            if (idx >= 0) {
              lines[idx] = newLine;
            } else {
              lines.push(newLine);
            }
          }
          await fetch("/api/server/config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: lines.join("\n") }),
          });
        }
      } catch {
        // Config write failed but RCON succeeded — non-critical
      }

      showToast(`Applied ${changed.length} setting(s)`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to apply");
    }
  };

  // ---- Map Control handlers ----

  const changeMap = async () => {
    if (!mapInput.trim()) return;
    try {
      await rcon(`changelevel ${mapInput.trim()}`);
      showToast(`Changing map to ${mapInput.trim()}`);
      setMapInput("");
      setTimeout(fetchStatus, 3000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to change map");
    }
  };

  const loadWorkshopMap = async () => {
    if (!workshopInput.trim()) return;
    try {
      await rcon(`host_workshop_map ${workshopInput.trim()}`);
      showToast(`Loading workshop map ${workshopInput.trim()}`);
      setWorkshopInput("");
      setTimeout(fetchStatus, 3000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load workshop map");
    }
  };

  const restartRound = async () => {
    try {
      await rcon("mp_restartgame 1");
      showToast("Restarting round...");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to restart");
    }
  };

  // ---- RCON Console handlers ----

  const executeRcon = async () => {
    const cmd = rconInput.trim();
    if (!cmd) return;
    setRconInput("");
    setCmdHistory((prev) => [cmd, ...prev]);
    setCmdHistoryIdx(-1);
    try {
      const res = await rcon(cmd);
      setRconHistory((prev) => [...prev, { cmd, res }]);
    } catch (err) {
      setRconHistory((prev) => [
        ...prev,
        { cmd, res: `Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      ]);
    }
  };

  const handleRconKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeRcon();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(cmdHistoryIdx + 1, cmdHistory.length - 1);
        setCmdHistoryIdx(newIdx);
        setRconInput(cmdHistory[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistoryIdx > 0) {
        const newIdx = cmdHistoryIdx - 1;
        setCmdHistoryIdx(newIdx);
        setRconInput(cmdHistory[newIdx]);
      } else {
        setCmdHistoryIdx(-1);
        setRconInput("");
      }
    }
  };

  // ---- Config Editor handlers ----

  const saveConfig = async (execAfter: boolean) => {
    try {
      const res = await fetch("/api/server/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: configContent }),
      });
      if (!res.ok) throw new Error("Failed to save");
      if (execAfter) {
        await rcon("exec custom_overrides.cfg");
        showToast("Config saved & executed");
      } else {
        showToast("Config saved");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save config");
    }
  };

  // ---- Render ----

  const hasChanges = CVARS.some((c) => cvarValues[c.key] !== cvarOriginal[c.key]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
        {(
          [
            { key: "settings", label: "Quick Settings" },
            { key: "maps", label: "Map Control" },
            { key: "rcon", label: "RCON Console" },
            { key: "config", label: "Config Editor" },
            { key: "players", label: "Players" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-white"
                : "text-text-dim hover:text-text hover:bg-surface-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========== QUICK SETTINGS TAB ========== */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-bright">Server Settings</h3>
            <div className="flex gap-2">
              <button
                onClick={fetchCvarValues}
                className={btnSecondary}
                disabled={loading}
              >
                Refresh
              </button>
              <button
                onClick={applySettings}
                className={btnPrimary}
                disabled={!hasChanges}
              >
                Apply Changes
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32 text-text-dim">
              Loading server settings...
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CVARS.map((cvar) => (
                  <div key={cvar.key}>
                    <label className="block text-xs text-text-dim mb-1">
                      {cvar.label}
                      <span className="ml-1 text-text-dim/50 font-mono">{cvar.key}</span>
                    </label>
                    {cvar.type === "toggle" ? (
                      <button
                        onClick={() =>
                          handleCvarChange(
                            cvar.key,
                            cvarValues[cvar.key] === "1" ? "0" : "1"
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          cvarValues[cvar.key] === "1"
                            ? "bg-green-600 text-white"
                            : "bg-surface-hover text-text-dim"
                        }`}
                      >
                        {cvarValues[cvar.key] === "1" ? "ON" : "OFF"}
                      </button>
                    ) : (
                      <input
                        type={cvar.type}
                        className={inputClass + " w-full"}
                        value={cvarValues[cvar.key] ?? ""}
                        onChange={(e) => handleCvarChange(cvar.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== MAP CONTROL TAB ========== */}
      {tab === "maps" && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-dim">Current Map:</span>
              <span className="text-sm font-medium text-text-bright font-mono">
                {currentMap}
              </span>
              <button onClick={fetchStatus} className={btnSecondary}>
                Refresh
              </button>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <label className="block text-xs text-text-dim mb-1">Change Level</label>
                <div className="flex gap-2">
                  <input
                    list="map-list"
                    className={inputClass + " flex-1"}
                    value={mapInput}
                    onChange={(e) => setMapInput(e.target.value)}
                    placeholder="Select or type a map name..."
                    onKeyDown={(e) => e.key === "Enter" && changeMap()}
                  />
                  <datalist id="map-list">
                    {availableMaps.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  <button onClick={changeMap} className={btnPrimary} disabled={!mapInput}>
                    Change Map
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-dim mb-1">
                  Workshop Map
                </label>
                <div className="flex gap-2">
                  <input
                    list="workshop-list"
                    className={inputClass + " flex-1"}
                    value={workshopInput}
                    onChange={(e) => setWorkshopInput(e.target.value)}
                    placeholder="Select or type a workshop map ID..."
                    onKeyDown={(e) => e.key === "Enter" && loadWorkshopMap()}
                  />
                  <datalist id="workshop-list">
                    {workshopMaps.map((w) => (
                      <option key={w.id} value={w.id} label={`${w.title} (${w.id})`} />
                    ))}
                  </datalist>
                  <button onClick={loadWorkshopMap} className={btnPrimary} disabled={!workshopInput}>
                    Load Workshop Map
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <button onClick={restartRound} className={btnDanger}>
                Restart Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== RCON CONSOLE TAB ========== */}
      {tab === "rcon" && (
        <div className="space-y-2">
          <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col" style={{ height: "500px" }}>
            {/* Output area */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2">
              {rconHistory.length === 0 && (
                <p className="text-text-dim">
                  Type a command below and press Enter to execute via RCON.
                </p>
              )}
              {rconHistory.map((entry, i) => (
                <div key={i}>
                  <div className="text-accent">
                    {">"} {entry.cmd}
                  </div>
                  <pre className="text-text whitespace-pre-wrap break-all">
                    {entry.res || "(no output)"}
                  </pre>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-2 flex gap-2">
              <span className="text-accent font-mono text-sm py-1">{">"}</span>
              <input
                className="flex-1 bg-transparent text-sm text-text font-mono focus:outline-none placeholder:text-text-dim"
                value={rconInput}
                onChange={(e) => setRconInput(e.target.value)}
                onKeyDown={handleRconKeyDown}
                placeholder="Enter RCON command..."
                autoFocus
              />
              <button onClick={executeRcon} className={btnPrimary}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CONFIG EDITOR TAB ========== */}
      {tab === "config" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-bright">custom_overrides.cfg</h3>
            <div className="flex gap-2">
              <button onClick={() => saveConfig(false)} className={btnSecondary}>
                Save
              </button>
              <button onClick={() => saveConfig(true)} className={btnPrimary}>
                Save & Execute
              </button>
            </div>
          </div>

          {configLoading ? (
            <div className="flex items-center justify-center h-32 text-text-dim">
              Loading config...
            </div>
          ) : (
            <textarea
              className="w-full bg-surface border border-border rounded-lg p-4 font-mono text-xs text-text focus:outline-none focus:border-accent transition-colors resize-y"
              style={{ minHeight: "400px" }}
              value={configContent}
              onChange={(e) => setConfigContent(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>
      )}

      {/* ========== PLAYERS TAB ========== */}
      {tab === "players" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-bright">
              Online Players ({onlinePlayers.length})
            </h3>
            <button onClick={fetchPlayers} className={btnSecondary} disabled={playersLoading}>
              {playersLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left text-xs uppercase tracking-wider text-text-dim px-3 py-2">Name</th>
                    <th className="text-left text-xs uppercase tracking-wider text-text-dim px-3 py-2">Steam ID</th>
                    <th className="text-left text-xs uppercase tracking-wider text-text-dim px-3 py-2">Give Weapon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {onlinePlayers.map((p) => (
                    <tr key={p.userId} className="hover:bg-surface-hover transition-colors">
                      <td className="px-3 py-2 text-sm text-text-bright font-medium">{p.name}</td>
                      <td className="px-3 py-2 text-sm text-text font-mono text-xs">{p.steamId}</td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex gap-2">
                          <select
                            className={inputClass}
                            value={playerWeapons[p.userId] ?? "weapon_ak47"}
                            onChange={(e) =>
                              setPlayerWeapons((prev) => ({ ...prev, [p.userId]: e.target.value }))
                            }
                          >
                            {WEAPON_LIST.map((w) => (
                              <option key={w.value} value={w.value}>
                                {w.label}
                              </option>
                            ))}
                          </select>
                          <button
                            className={btnPrimary}
                            onClick={async () => {
                              const weapon = playerWeapons[p.userId] ?? "weapon_ak47";
                              try {
                                await rcon(`css_giveweapon ${p.steamId} ${weapon}`);
                                showToast(`Gave ${weapon} to ${p.name}`);
                              } catch (err) {
                                showToast(err instanceof Error ? err.message : "Failed");
                              }
                            }}
                          >
                            Give
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {onlinePlayers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-8 text-center text-text-dim text-sm">
                        {playersLoading ? "Loading players..." : "No players online."}
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
