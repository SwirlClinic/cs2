"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import type { AgentItem } from "@/lib/types";

interface AgentPickerProps {
  currentAgentCT?: string;
  currentAgentT?: string;
  onSave: (agentCT: string, agentT: string) => void;
}

export default function AgentPicker({
  currentAgentCT,
  currentAgentT,
  onSave,
}: AgentPickerProps) {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedCT, setSelectedCT] = useState(currentAgentCT || "null");
  const [selectedT, setSelectedT] = useState(currentAgentT || "null");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/items/agents")
      .then((r) => r.json())
      .then(setAgents)
      .catch(() => {});
  }, []);

  // Exclude the "Default" placeholder entries (model === "null")
  const tAgents = useMemo(() => {
    const list = agents.filter((a) => a.team === 2 && a.model !== "null");
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((a) => a.agent_name.toLowerCase().includes(q));
  }, [agents, search]);

  const ctAgents = useMemo(() => {
    const list = agents.filter((a) => a.team === 3 && a.model !== "null");
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((a) => a.agent_name.toLowerCase().includes(q));
  }, [agents, search]);

  return (
    <div className="space-y-6">
      <SearchBar value={search} onChange={setSearch} placeholder="Search agents..." />

      <div>
        <h3 className="text-sm font-medium text-text-bright mb-3">
          Terrorist Agents
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <SkinCard
            name="Default T"
            image=""
            selected={selectedT === "null"}
            onClick={() => {
              setSelectedT("null");
              onSave(selectedCT, "null");
            }}
          />
          {tAgents.map((agent) => (
            <SkinCard
              key={agent.model}
              name={agent.agent_name}
              image={agent.image}
              selected={selectedT === agent.model}
              onClick={() => {
                setSelectedT(agent.model);
                onSave(selectedCT, agent.model);
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-bright mb-3">
          Counter-Terrorist Agents
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <SkinCard
            name="Default CT"
            image=""
            selected={selectedCT === "null"}
            onClick={() => {
              setSelectedCT("null");
              onSave("null", selectedT);
            }}
          />
          {ctAgents.map((agent) => (
            <SkinCard
              key={agent.model}
              name={agent.agent_name}
              image={agent.image}
              selected={selectedCT === agent.model}
              onClick={() => {
                setSelectedCT(agent.model);
                onSave(agent.model, selectedT);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
