import { createAPIFileRoute } from "@tanstack/react-start/api";

const OG_ROUTER_BASE = "https://router-api.0g.ai/v1";

// Cache models for 5 minutes so we don't spam the endpoint
let modelsCache: { data: any; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * GET /api/og/models
 *
 * Proxies the 0G Router model catalog. Cached 5 min server-side.
 * Returns the full OpenAI-compatible /v1/models response.
 */
export const APIRoute = createAPIFileRoute("/api/og/models")({
  GET: async () => {
    // Serve from cache if fresh
    if (modelsCache && Date.now() - modelsCache.fetchedAt < CACHE_TTL_MS) {
      return new Response(JSON.stringify(modelsCache.data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          "X-Cache": "HIT",
        },
      });
    }

    try {
      const upstream = await fetch(`${OG_ROUTER_BASE}/models`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!upstream.ok) {
        return new Response(JSON.stringify({ error: "upstream_error", status: upstream.status }), {
          status: upstream.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = await upstream.json();
      modelsCache = { data, fetchedAt: Date.now() };

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          "X-Cache": "MISS",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "proxy_error",
          message: err instanceof Error ? err.message : "Failed to fetch 0G models",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
