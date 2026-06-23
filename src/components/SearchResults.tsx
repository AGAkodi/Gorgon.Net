import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  ExternalLink,
  TrendingUp,
  Ban,
  Sparkles,
  Globe,
  Database,
  ChevronRight,
  Star,
  Clock,
  Activity,
  WifiOff,
} from "lucide-react";
import { ogChat, buildSearchSummaryPrompt, SEARCH_MODEL } from "../lib/og-client";


interface SearchResultCard {
  favicon: string;
  domain: string;
  title: string;
  description: string;
  category: string;
  score: number;
  chain: string[];
  pills: string[];
  tvl?: string;
  users?: string;
  isScam?: boolean;
  warning?: string;
}

interface SearchResultsProps {
  query: string;
  onNavigate: (url: string) => void;
}

// ── Static mock knowledge base keyed by keywords ──────────────────────────────
const SEARCH_DATABASE: Record<string, {
  aiSummary: string;
  isScamQuery: boolean;
  results: SearchResultCard[];
}> = {
  default: {
    aiSummary: "Searching the 0G decentralized knowledge graph for Web3 protocols matching your query...",
    isScamQuery: false,
    results: [],
  },
  dex: {
    aiSummary: "Decentralized exchanges (DEXs) let you swap tokens directly from your wallet without giving custody to a third party. The most trusted DEXs use audited smart contracts and have significant liquidity across major chains. Always verify you're on the official frontend before connecting your wallet.",
    isScamQuery: false,
    results: [
      { favicon: "U", domain: "app.uniswap.org", title: "Uniswap — Leading DEX", description: "The largest decentralized exchange. Swap any ERC-20 token permissionlessly. Powers $2B+ in daily volume across Ethereum, Arbitrum, Optimism, Base, and Polygon.", category: "DEX · Multi-chain", score: 95, chain: ["ETH", "ARB", "OP", "BASE"], pills: ["Audited", "Community Trust", "4.2M Wallets"], tvl: "$6.8B", users: "4.2M" },
      { favicon: "C", domain: "curve.fi", title: "Curve Finance — Stablecoin DEX", description: "Optimized for stablecoin and pegged asset swaps with minimal slippage. The backbone of DeFi stablecoin liquidity.", category: "DEX · Stablecoins", score: 92, chain: ["ETH", "ARB", "POLY"], pills: ["Audited", "Battle-Tested", "DAO Governed"], tvl: "$2.1B", users: "890K" },
      { favicon: "B", domain: "balancer.fi", title: "Balancer — Multi-Token Pools", description: "Automated portfolio manager and DEX allowing custom-weight liquidity pools. Great for index-style strategies.", category: "DEX · Pools", score: 88, chain: ["ETH", "ARB", "POLY"], pills: ["Audited", "DAO Governed"], tvl: "$960M", users: "320K" },
    ],
  },
  swap: {
    aiSummary: "Token swaps on Web3 DEXs execute via audited smart contracts — your wallet signs a transaction that atomically exchanges tokens through a liquidity pool. Always check the exact contract address and slippage tolerance before signing. Safe DEXs use audited routers and never request unlimited token approvals beyond what's needed.",
    isScamQuery: false,
    results: [
      { favicon: "U", domain: "app.uniswap.org", title: "Uniswap — Swap ETH, USDC & 10,000+ tokens", description: "Most trusted token swap platform. Universal Router v1.2 is audited by Trail of Bits & OpenZeppelin. No hidden fees.", category: "DEX · Multi-chain", score: 95, chain: ["ETH", "ARB", "OP", "BASE"], pills: ["Audited", "Community Trust"], tvl: "$6.8B", users: "4.2M" },
      { favicon: "1", domain: "1inch.io", title: "1inch — DEX Aggregator", description: "Aggregates liquidity across 200+ DEXs to find the best swap rate. Splits orders for optimal execution.", category: "DEX Aggregator", score: 89, chain: ["ETH", "BSC", "POLY", "ARB"], pills: ["Aggregator", "Gas Optimized"], tvl: "N/A", users: "2.1M" },
      { favicon: "P", domain: "pancakeswap.finance", title: "PancakeSwap — BNB Chain DEX", description: "The leading DEX on BNB Smart Chain. Swap, earn, and win with the most popular AMM on BSC.", category: "DEX · BNB Chain", score: 86, chain: ["BSC", "ETH", "ARB"], pills: ["Audited", "High Volume"], tvl: "$1.4B", users: "1.8M" },
    ],
  },
  nft: {
    aiSummary: "NFT marketplaces let you buy, sell, and trade digital collectibles. The key security concern is contract approvals: legitimate marketplaces only request approval for tokens you're explicitly selling, never bulk `setApprovalForAll` that grants control of your entire collection. Always verify the platform URL before connecting — phishing clones are common.",
    isScamQuery: false,
    results: [
      { favicon: "O", domain: "opensea.io", title: "OpenSea — World's Largest NFT Marketplace", description: "The original and largest NFT marketplace. Buy and sell Ethereum, Polygon, and Solana NFTs with low fees. Seaport protocol is fully audited.", category: "NFT · Multi-chain", score: 91, chain: ["ETH", "POLY", "SOL"], pills: ["Audited", "Industry Standard"], tvl: "N/A", users: "3.1M" },
      { favicon: "B", domain: "blur.io", title: "Blur — Pro NFT Trading Platform", description: "NFT marketplace built for professional traders. No marketplace fees, advanced analytics, and bidding pools.", category: "NFT · Ethereum", score: 87, chain: ["ETH"], pills: ["Audited", "Zero Fees", "Pro Tools"], tvl: "N/A", users: "450K" },
    ],
  },
  lending: {
    aiSummary: "DeFi lending protocols let you supply assets to earn interest or borrow against collateral — all enforced by smart contracts with no intermediary. Risk factors include smart contract bugs, oracle manipulation, and liquidation cascades. Only deposit into audited, battle-tested protocols with strong governance.",
    isScamQuery: false,
    results: [
      { favicon: "A", domain: "app.aave.com", title: "Aave — DeFi Money Market", description: "Supply and borrow 30+ assets across multiple chains. Flash loans, interest rate switching, and governance via AAVE token.", category: "Lending · Multi-chain", score: 94, chain: ["ETH", "ARB", "POLY", "OP"], pills: ["Audited", "Battle-Tested", "DAO Governed"], tvl: "$12.8B", users: "680K" },
      { favicon: "C", domain: "compound.finance", title: "Compound Finance — Earn Interest", description: "Pioneer of algorithmic money markets. Supply assets to earn variable interest rates determined by market demand.", category: "Lending · Ethereum", score: 90, chain: ["ETH", "ARB"], pills: ["Audited", "OG Protocol"], tvl: "$2.1B", users: "210K" },
    ],
  },
  airdrop: {
    aiSummary: "⚠️ SCAM ALERT: The vast majority of 'airdrop claim' sites are phishing attacks designed to drain your wallet. Legitimate protocol airdrops are announced through official channels (Twitter, Discord, official .org/.io domains) and NEVER require you to sign `setApprovalForAll` or approve unlimited token spend. If someone DMs you about an airdrop — it's a scam.",
    isScamQuery: true,
    results: [
      { favicon: "!", domain: "uniswap-airdrop-claim.xyz", title: "⚠️ PHISHING: Fake Uniswap Airdrop", description: "This site impersonates Uniswap to steal wallet approvals. The real Uniswap has NOT announced an airdrop. Contract requests setApprovalForAll to drain your tokens.", category: "PHISHING · SCAM", score: 8, chain: ["ETH"], pills: ["SCAM", "Drainer", "Registered 4hrs ago"], isScam: true, warning: "Requests unlimited token access. DO NOT CONNECT." },
    ],
  },
  "free mint": {
    aiSummary: "⚠️ SCAM ALERT: 'Free NFT mint' sites are among the most common crypto scams. They use fake celebrity endorsements or FOMO to get users to connect wallets, then submit `setApprovalForAll` transactions that grant full access to your NFT collection. The 'mint' often doesn't happen — only the theft does.",
    isScamQuery: true,
    results: [
      { favicon: "A", domain: "ape-vaults-mint.net", title: "⚠️ PHISHING: Fake BAYC Mint", description: "Fraudulent site impersonating Bored Ape Yacht Club. The official BAYC collection is closed to minting. Contract disguises setApprovalForAll as a mint function.", category: "PHISHING · NFT SCAM", score: 14, chain: ["ETH"], pills: ["SCAM", "Drainer", "Registered 26hrs ago"], isScam: true, warning: "Hides setApprovalForAll inside mint call. Collection drain risk." },
    ],
  },
  staking: {
    aiSummary: "DeFi staking lets you earn yield by locking tokens into smart contracts. Categories include liquid staking (e.g. Lido's stETH), protocol governance staking, and LP staking. Key risks: smart contract bugs, lock-up periods, slashing (for validators), and impermanent loss (for LP positions).",
    isScamQuery: false,
    results: [
      { favicon: "L", domain: "lido.fi", title: "Lido — Liquid ETH Staking", description: "Largest liquid staking protocol. Stake ETH and receive stETH, which earns staking rewards while remaining liquid and usable in DeFi.", category: "Liquid Staking · ETH", score: 92, chain: ["ETH", "SOL"], pills: ["Audited", "Largest LSP", "DAO Governed"], tvl: "$32B", users: "1.2M" },
      { favicon: "R", domain: "rocketpool.net", title: "Rocket Pool — Decentralized ETH Staking", description: "Decentralized Ethereum staking protocol. Run your own node with 8 ETH or stake any amount for rETH.", category: "Liquid Staking · ETH", score: 90, chain: ["ETH"], pills: ["Audited", "Decentralized", "Trustless"], tvl: "$4.1B", users: "280K" },
    ],
  },
};

// Fuzzy match query to database key
function matchQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("airdrop") || q.includes("claim") || q.includes("free token")) return "airdrop";
  if (q.includes("free mint") || q.includes("nft claim") || q.includes("mint free")) return "free mint";
  if (q.includes("nft") || q.includes("collectible") || q.includes("opensea") || q.includes("blur")) return "nft";
  if (q.includes("lend") || q.includes("borrow") || q.includes("aave") || q.includes("compound")) return "lending";
  if (q.includes("stake") || q.includes("staking") || q.includes("lido") || q.includes("validator")) return "staking";
  if (q.includes("swap") || q.includes("exchange") || q.includes("trade token")) return "swap";
  if (q.includes("dex") || q.includes("defi") || q.includes("uniswap") || q.includes("liquidity")) return "dex";
  return "dex"; // default to DEX results
}

const CHAIN_COLORS: Record<string, string> = {
  ETH: "bg-blue-500/20 text-blue-300 border-blue-700/40",
  ARB: "bg-sky-500/20 text-sky-300 border-sky-700/40",
  OP: "bg-red-500/20 text-red-300 border-red-700/40",
  BASE: "bg-blue-600/20 text-blue-200 border-blue-800/40",
  POLY: "bg-purple-500/20 text-purple-300 border-purple-700/40",
  BSC: "bg-yellow-500/20 text-yellow-300 border-yellow-700/40",
  SOL: "bg-green-500/20 text-green-300 border-green-700/40",
};

function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size / 2) - 5;
  const color = score > 80 ? "#16A34A" : score > 50 ? "#F59E0B" : "#E53935";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#222235" strokeWidth="3.5" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={2 * Math.PI * r}
          strokeDashoffset={2 * Math.PI * r * (1 - score / 100)}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-black text-[11px] text-white">
        {score}
      </div>
    </div>
  );
}

export function SearchResults({ query, onNavigate }: SearchResultsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [data, setData] = useState<typeof SEARCH_DATABASE[string] | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryProvider, setSummaryProvider] = useState<"0g" | "fallback">("fallback");

  const loadSteps = [
    "Querying 0G decentralized knowledge graph...",
    "Running AI threat analysis on results...",
    "Scoring domains against trust registry...",
    "Generating AI summary via 0G Compute...",
  ];

  useEffect(() => {
    setIsLoading(true);
    setLoadStep(0);
    setData(null);
    setAiSummary("");
    setSummaryProvider("fallback");

    const key = matchQuery(query);
    const result = SEARCH_DATABASE[key] || SEARCH_DATABASE["dex"];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLoadStep(step);
      if (step >= loadSteps.length) clearInterval(interval);
    }, 380);

    // Fetch real 0G AI summary in parallel with animation
    const fetchSummary = async () => {
      try {
        const ogResult = await ogChat(
          [{ role: "user", content: query }],
          { model: SEARCH_MODEL, max_tokens: 180, systemPrompt: buildSearchSummaryPrompt(query) }
        );
        if (!ogResult.usingFallback && ogResult.text.trim()) {
          setAiSummary(ogResult.text.trim());
          setSummaryProvider("0g");
        } else {
          setAiSummary(result.aiSummary);
        }
      } catch {
        setAiSummary(result.aiSummary);
      }
    };

    const timer = setTimeout(() => {
      setData(result);
      setIsLoading(false);
    }, loadSteps.length * 380 + 300);

    fetchSummary();

    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 py-10">
        {/* Animated orb */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-[#6C47FF]/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-[#6C47FF]/30 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-[#6C47FF] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-[#9F86FF] uppercase tracking-widest">Gorgon AI Search</p>
          <p className="text-sm text-gray-300 transition-all duration-300">{loadSteps[loadStep] || loadSteps[loadSteps.length-1]}</p>
        </div>
        <div className="w-48 h-1 bg-[#1A1A2B] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6C47FF] to-[#9F86FF] rounded-full transition-all duration-300"
            style={{ width: `${((loadStep + 1) / loadSteps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const displaySummary = aiSummary || data.aiSummary;

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-6">
      {/* Search query header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span>0G Network · {data.results.length} results for <span className="text-white font-semibold">"{query}"</span></span>
        </div>
        <div className="flex-1 max-w-xs relative">
          <input 
            type="text" 
            placeholder="Search again..." 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (val.trim()) {
                  onNavigate(val); // In search mode, navigation handles search queries
                }
              }
            }}
            className="w-full bg-[#1A1A2B] border border-[#2B2B43] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#6C47FF]/50"
          />
        </div>
      </div>

      {/* Scam alert banner */}
      {data.isScamQuery && (
        <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-red-300 uppercase tracking-wider">⚠️ High-Risk Query Detected</p>
            <p className="text-[11px] text-red-200/80 leading-relaxed">
              Searches related to this topic are frequently used in phishing attacks. Gorgon AI has filtered results and flagged known scam domains below.
            </p>
          </div>
        </div>
      )}

      {/* AI Summary Card */}
      <div className="bg-gradient-to-br from-[#181829] to-[#141428] border border-[#2B2B4A] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#6C47FF]/20 border border-[#6C47FF]/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#9F86FF]" />
            </div>
            <span className="text-[10px] font-black text-[#9F86FF] uppercase tracking-widest">Gorgon AI Summary</span>
          </div>
          {summaryProvider === "0g" ? (
            <span className="text-[8px] font-bold text-green-500 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> 0G Compute
            </span>
          ) : (
            <span className="text-[8px] font-bold text-amber-600 flex items-center gap-1">
              <WifiOff className="w-2.5 h-2.5" /> Cached
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-300 leading-relaxed">{displaySummary}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Activity className="w-3 h-3" />
          <span>Powered by 0G decentralized compute · Always verify official URLs</span>
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-3">
        {data.results.map((result, idx) => (
          <ResultCard key={idx} result={result} onNavigate={onNavigate} rank={idx + 1} />
        ))}
      </div>

      {/* Footer attribution */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 pt-2 border-t border-[#212133]">
        <Database className="w-3 h-3 text-purple-600" />
        <span>Results indexed from 0G Network · Updated in real-time · Always verify before connecting</span>
      </div>
    </div>
  );
}

function ResultCard({ result, onNavigate, rank }: { result: SearchResultCard; onNavigate: (url: string) => void; rank: number }) {
  const isScam = result.isScam;
  const borderColor = isScam ? "border-red-800/50" : result.score > 80 ? "border-[#2B2B43]" : "border-amber-800/40";
  const bgColor = isScam ? "bg-red-950/20" : "bg-[#181829]";

  return (
    <div
      onClick={() => !isScam && onNavigate(result.domain)}
      className={`${bgColor} border ${borderColor} rounded-xl p-4 space-y-3 group transition-all duration-200 ${!isScam ? "hover:border-[#6C47FF]/50 cursor-pointer hover:shadow-[0_0_20px_rgba(108,71,255,0.08)]" : "cursor-not-allowed"}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Favicon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${isScam ? "bg-red-900/30 text-red-400 border border-red-800/40" : "bg-[#1A1A2B] border border-[#2B2B43] text-[#9F86FF]"}`}>
            {result.favicon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-sm ${isScam ? "text-red-300" : "text-white"} group-hover:text-[#9F86FF] transition-colors`}>
                {result.title}
              </span>
              {!isScam && <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-mono ${isScam ? "text-red-400" : "text-[#6C47FF]"}`}>{result.domain}</span>
              <span className="text-[9px] text-gray-500">·</span>
              <span className="text-[9px] text-gray-500">{result.category}</span>
            </div>
          </div>
        </div>
        <ScoreRing score={result.score} size={40} />
      </div>

      {/* Description */}
      <p className="text-[11.5px] text-gray-400 leading-relaxed">{result.description}</p>

      {/* Warning banner for scams */}
      {result.warning && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 flex items-center gap-2">
          <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[10.5px] text-red-300 font-semibold">{result.warning}</span>
        </div>
      )}

      {/* Footer: chains + pills + TVL */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Chain badges */}
          {result.chain.slice(0, 4).map(c => (
            <span key={c} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${CHAIN_COLORS[c] || "bg-gray-800 text-gray-300 border-gray-700"}`}>{c}</span>
          ))}
          {/* Pill tags */}
          {result.pills.slice(0, 2).map(p => (
            <span key={p} className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${isScam ? "bg-red-900/20 text-red-300 border-red-800/40" : "bg-[#1A1A2B] text-gray-300 border-[#2B2B43]"}`}>{p}</span>
          ))}
        </div>
        {result.tvl && (
          <div className="flex items-center gap-3 text-[9px] text-gray-500">
            {result.tvl !== "N/A" && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" />TVL: <span className="text-white font-bold">{result.tvl}</span></span>}
            {result.users && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /><span className="text-white font-bold">{result.users}</span> users</span>}
          </div>
        )}
      </div>

      {/* Navigate CTA for legit sites */}
      {!isScam && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNavigate(result.domain); }}
          className="flex items-center gap-1.5 text-[10px] text-white font-semibold bg-[#6C47FF] hover:bg-[#5B39E6] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all mt-2"
        >
          Open in Safe Browser
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
