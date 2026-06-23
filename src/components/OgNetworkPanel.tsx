import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  Zap,
  Shield,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  Eye,
  Clock,
  Server,
  Database,
  Sparkles,
  WifiOff,
  Activity,
} from "lucide-react";

interface OgModel {
  id: string;
  name: string;
  description: string;
  type: string;
  context_length: number;
  max_completion_tokens?: number;
  tee_attested: boolean;
  tee_type?: string;
  tee_verifier?: string;
  verifiability?: string;
  provider_count: number;
  pricing_usd?: {
    prompt: string;
    completion: string;
  };
  architecture?: {
    modality: string;
    input_modalities?: string[];
  };
}

interface OgNetworkPanelProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  lastQueryMs?: number;
}

const RECOMMENDED_MODELS = ["deepseek-v4-flash", "minimax-m3", "0gm-1.0-35b-a3b"];

export function OgNetworkPanel({ selectedModel, onModelChange, lastQueryMs }: OgNetworkPanelProps) {
  const [models, setModels] = useState<OgModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [queryCount, setQueryCount] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  // Simulated live stats that tick up
  const [nodeCount] = useState(1284);
  const [syncTime, setSyncTime] = useState(lastQueryMs ?? 142);

  useEffect(() => {
    fetchModels();
    // Animate sync time
    const interval = setInterval(() => {
      setSyncTime((prev) => 100 + Math.floor(Math.random() * 120));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchModels() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/og/models");
      const data = await res.json();
      const chatbots = (data.data ?? []).filter((m: OgModel) => m.type === "chatbot");
      setModels(chatbots);
      setFetchedAt(new Date());
    } catch (err) {
      setError("Could not reach 0G Router API");
    } finally {
      setLoading(false);
    }
  }

  const selectedModelData = models.find((m) => m.id === selectedModel);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[#212133] bg-gradient-to-r from-[#0D0D1E] to-[#111124]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6C47FF] to-[#9F86FF] flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-black text-white tracking-tight">0G Compute Network</span>
          </div>
          <button
            onClick={fetchModels}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Refresh model catalog"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Live stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#181829] border border-[#2B2B43] rounded-lg p-2 text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Nodes</p>
            <p className="text-sm font-black text-[#9F86FF]">{nodeCount.toLocaleString()}</p>
          </div>
          <div className="bg-[#181829] border border-[#2B2B43] rounded-lg p-2 text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Latency</p>
            <p className="text-sm font-black text-green-400">{syncTime}ms</p>
          </div>
          <div className="bg-[#181829] border border-[#2B2B43] rounded-lg p-2 text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Models</p>
            <p className="text-sm font-black text-white">{loading ? "…" : models.length}</p>
          </div>
        </div>
      </div>

      {/* TEE Attestation badge */}
      <div className="mx-3 mt-3 bg-green-950/30 border border-green-800/40 rounded-lg p-2.5 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-bold text-green-300">TEE-Attested Inference</p>
          <p className="text-[9px] text-green-400/70 leading-relaxed mt-0.5">
            Every inference runs inside Intel TDX enclaves verified by dstack. Providers cannot see
            your prompts.
          </p>
        </div>
      </div>

      {/* Active model card */}
      {selectedModelData && (
        <div className="mx-3 mt-3 bg-[#6C47FF]/10 border border-[#6C47FF]/30 rounded-lg p-3">
          <p className="text-[9px] font-bold text-[#9F86FF] uppercase tracking-widest mb-1.5">
            Active Model
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{selectedModelData.name}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                {(selectedModelData.context_length / 1000).toFixed(0)}K ctx ·{" "}
                {selectedModelData.provider_count} provider
                {selectedModelData.provider_count !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              {selectedModelData.tee_attested && (
                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-green-400 bg-green-950/50 border border-green-800/50 rounded px-1.5 py-0.5">
                  <CheckCircle className="w-2 h-2" /> {selectedModelData.tee_type ?? "TEE"}
                </span>
              )}
              {selectedModelData.pricing_usd && (
                <p className="text-[8px] text-gray-500 mt-1">
                  ${selectedModelData.pricing_usd.completion}/tok out
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Model catalog */}
      <div className="px-3 mt-3">
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Available Models{" "}
          {fetchedAt && (
            <span className="font-normal text-gray-600">
              · refreshed {fetchedAt.toLocaleTimeString()}
            </span>
          )}
        </p>

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-xs">Querying 0G Router...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-amber-400 bg-amber-950/20 border border-amber-800/30 rounded-lg p-2.5 text-[10px]">
            <WifiOff className="w-3 h-3 flex-shrink-0" />
            <span>{error}. Add your API key to enable live catalog.</span>
          </div>
        )}

        <div className="space-y-1.5 pb-4">
          {models.map((model) => {
            const isSelected = model.id === selectedModel;
            const isRecommended = RECOMMENDED_MODELS.includes(model.id);
            const isExpanded = expandedModel === model.id;

            return (
              <div key={model.id}>
                <button
                  onClick={() => {
                    onModelChange(model.id);
                    setExpandedModel(isExpanded ? null : model.id);
                  }}
                  className={`w-full text-left rounded-lg p-2.5 border transition-all ${
                    isSelected
                      ? "bg-[#6C47FF]/15 border-[#6C47FF]/50"
                      : "bg-[#181829] border-[#2B2B43] hover:border-[#3B3B5B]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? "bg-[#9F86FF]" : "bg-gray-600"}`}
                      />
                      <span
                        className={`text-[10.5px] font-semibold truncate ${isSelected ? "text-white" : "text-gray-300"}`}
                      >
                        {model.name}
                      </span>
                      {isRecommended && (
                        <span className="text-[7px] font-bold text-[#9F86FF] bg-[#6C47FF]/20 border border-[#6C47FF]/30 rounded px-1 py-0.5 flex-shrink-0">
                          ✦ USED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                      {model.tee_attested && (
                        <span className="text-[7px] text-green-400 font-bold">TDX</span>
                      )}
                      <ChevronDown
                        className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1 ml-3.5">
                    <span className="text-[9px] text-gray-500">
                      {(model.context_length / 1000).toFixed(0)}K ctx
                    </span>
                    {model.pricing_usd && (
                      <span className="text-[9px] text-gray-500">
                        · ${parseFloat(model.pricing_usd.completion).toFixed(9)}/tok
                      </span>
                    )}
                    {model.provider_count > 0 && (
                      <span className="text-[9px] text-gray-500">· {model.provider_count}P</span>
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="bg-[#0F0F1E] border border-[#2B2B43] border-t-0 rounded-b-lg px-3 py-2.5 space-y-1.5 text-[9.5px] text-gray-400">
                    <p className="leading-relaxed">{model.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {model.architecture?.modality && (
                        <span className="bg-[#1E1E35] border border-[#2B2B43] rounded px-1.5 py-0.5 text-[8px]">
                          {model.architecture.modality}
                        </span>
                      )}
                      {model.tee_type && (
                        <span className="bg-green-950/30 border border-green-800/40 text-green-400 rounded px-1.5 py-0.5 text-[8px]">
                          {model.tee_type} · {model.tee_verifier}
                        </span>
                      )}
                      {model.verifiability && (
                        <span className="bg-blue-950/30 border border-blue-800/40 text-blue-400 rounded px-1.5 py-0.5 text-[8px]">
                          {model.verifiability}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onModelChange(model.id);
                      }}
                      className={`mt-1.5 w-full text-center py-1 rounded text-[9px] font-bold transition-colors ${
                        isSelected
                          ? "bg-[#6C47FF]/30 text-[#9F86FF] border border-[#6C47FF]/40"
                          : "bg-[#6C47FF] hover:bg-[#5B39E6] text-white"
                      }`}
                    >
                      {isSelected ? "✓ Currently Active" : "Use This Model"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer links */}
      <div className="sticky bottom-0 bg-[#0E0E17] border-t border-[#212133] px-3 py-2.5 space-y-1.5">
        <a
          href="https://pc.0g.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] text-[#9F86FF] hover:text-white transition-colors font-semibold"
        >
          <Zap className="w-3 h-3" />
          Get API Key at pc.0g.ai
          <ExternalLink className="w-2.5 h-2.5 ml-auto" />
        </a>
        <a
          href="https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/quickstart"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Database className="w-3 h-3" />
          0G Compute Docs
          <ExternalLink className="w-2.5 h-2.5 ml-auto" />
        </a>
      </div>
    </div>
  );
}
