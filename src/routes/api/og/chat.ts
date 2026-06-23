import { createAPIFileRoute } from "@tanstack/react-start/api";

const OG_ROUTER_BASE = "https://router-api.0g.ai/v1";

/**
 * POST /api/og/chat
 *
 * Proxies chat completion requests to the 0G Compute Network Router API.
 * Keeps the API key server-side (never exposed to the browser).
 *
 * Request body: { messages: [{role, content}][], model?: string, stream?: boolean }
 * Response: OpenAI-compatible chat completion object
 */
export const APIRoute = createAPIFileRoute("/api/og/chat")({
  POST: async ({ request }) => {
    const apiKey = process.env.VITE_0G_API_KEY ?? import.meta.env.VITE_0G_API_KEY;

    if (!apiKey || apiKey === "sk-your-0g-api-key-here" || apiKey.trim() === "") {
      return new Response(
        JSON.stringify({
          error: "missing_api_key",
          message:
            "0G API key not configured. Add VITE_0G_API_KEY=sk-... to your .env file. Get a key at https://pc.0g.ai",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, model = "deepseek-v4-flash", stream = false, max_tokens = 1024 } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages_required", message: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const upstream = await fetch(`${OG_ROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream, max_tokens }),
      });

      // Stream passthrough
      if (stream && upstream.body) {
        return new Response(upstream.body as any, {
          status: upstream.status,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-0G-Status": upstream.status.toString(),
          },
        });
      }

      const data = await upstream.json();

      if (!upstream.ok) {
        return new Response(
          JSON.stringify({
            error: "upstream_error",
            status: upstream.status,
            detail: data,
          }),
          {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-0G-Model": data.model ?? model,
          "X-0G-Provider": upstream.headers.get("x-provider") ?? "unknown",
        },
      });
    } catch (err) {
      console.error("[0G proxy error]", err);
      return new Response(
        JSON.stringify({
          error: "proxy_error",
          message: err instanceof Error ? err.message : "Unknown error contacting 0G Router",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
