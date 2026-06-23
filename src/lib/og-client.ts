/**
 * useOgChat — React hook for 0G Compute Network inference
 *
 * Models selected from live catalog (curl https://router-api.0g.ai/v1/models):
 * - CHAT_MODEL: deepseek-v4-flash  — fastest, cheapest, 1M context (ideal for Q&A)
 * - SEARCH_MODEL: minimax-m3       — best reasoning + native tools (ideal for summaries)
 * - FALLBACK_MODEL: 0gm-1.0-35b-a3b — 0G's own in-house model as backup
 */

export interface OgMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OgChatOptions {
  model?: string;
  max_tokens?: number;
  systemPrompt?: string;
}

export interface OgChatResult {
  text: string;
  model: string;
  provider: string;
  usingFallback: boolean;
}

/** Primary chat / Q&A model — low-latency, 1M context, very cheap */
export const CHAT_MODEL = "deepseek-v4-flash";

/** Search summary model — best structured reasoning, native tool support */
export const SEARCH_MODEL = "minimax-m3";

/** 0G in-house fallback — 0G Foundation's own model */
export const FALLBACK_MODEL = "0gm-1.0-35b-a3b";

/** @deprecated kept for backwards compat — use CHAT_MODEL instead */
const DEFAULT_MODEL = CHAT_MODEL;

/**
 * Send a chat completion request through the 0G Router.
 * Returns the assistant message text and metadata.
 */
export async function ogChat(
  messages: OgMessage[],
  options: OgChatOptions = {},
): Promise<OgChatResult> {
  const { model = DEFAULT_MODEL, max_tokens = 512, systemPrompt } = options;

  const allMessages: OgMessage[] = [];
  if (systemPrompt) {
    allMessages.push({ role: "system", content: systemPrompt });
  }
  allMessages.push(...messages);

  const res = await fetch("/api/og/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: allMessages, model, max_tokens }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.error === "missing_api_key") {
      return { text: "", model, provider: "none", usingFallback: true };
    }
    throw new Error(data.message ?? `0G API error ${res.status}`);
  }

  const text: string = data.choices?.[0]?.message?.content ?? "";
  const returnedModel: string = data.model ?? model;
  const provider: string = res.headers.get("X-0G-Provider") ?? "0G Network";

  return { text, model: returnedModel, provider, usingFallback: false };
}

/**
 * Build a Web3 security analysis system prompt for the given URL/domain.
 */
export function buildSecuritySystemPrompt(domain: string, score: number): string {
  return `You are Gorgon AI, an expert Web3 security assistant embedded in the Gorgon.Net browser — an AI-powered Web3 search engine secured by the 0G decentralized compute network.

You are currently helping a user who is browsing: ${domain} (Gorgon trust score: ${score}/100)

Your role:
- Explain Web3 concepts, DeFi protocols, and smart contract interactions in plain English
- Warn about phishing, drainers, fake airdrops, and malicious approvals  
- Help users understand transactions BEFORE they sign
- Be concise — users are actively browsing and need quick answers
- Use simple language — not everyone is a developer

Key Web3 security rules you enforce:
- NEVER sign setApprovalForAll unless you explicitly intend to sell ALL your NFTs
- NEVER type your seed phrase into any website  
- Domain age matters — scam sites register domains days before launching
- Verify URLs exactly — even one character difference is a phishing site
- Legitimate protocols don't DM you or promise unexpected airdrops

Current site trust level: ${score > 80 ? "HIGH (safe to interact)" : score > 40 ? "MEDIUM (use caution)" : "LOW (HIGH RISK - do not connect wallet)"}

Keep responses under 200 words. Use bullet points for clarity. Be direct and helpful.`;
}

/**
 * Build an AI summary prompt for a Web3 search query.
 */
export function buildSearchSummaryPrompt(query: string): string {
  return `You are Gorgon AI, a Web3 security and DeFi research assistant powered by the 0G decentralized compute network.

A user searched for: "${query}"

Provide a brief, helpful summary (2-4 sentences) that:
1. Explains what this topic is in plain English
2. Mentions key safety considerations if relevant
3. Names 1-2 reputable protocols/sites if applicable

If the query mentions airdrops, free tokens, or suspicious claims, include a scam warning.
Keep it under 120 words. Be factual and balanced.`;
}
