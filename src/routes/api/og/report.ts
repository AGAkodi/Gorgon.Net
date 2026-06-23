import { createAPIFileRoute } from "@tanstack/react-start/api";

interface ScamReport {
  id: string;
  domain: string;
  reason: string;
  reporter: string;
  timestamp: string;
  votes: number;
}

// In-memory store (in production this would be a DB or 0G Storage)
const reports: ScamReport[] = [];

/**
 * POST /api/og/report
 *
 * Submit a scam report for a domain.
 * Body: { domain: string, reason: string, reporter?: string }
 *
 * GET /api/og/report?domain=xxx
 * Returns all reports for a domain.
 */
export const APIRoute = createAPIFileRoute("/api/og/report")({
  POST: async ({ request }) => {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { domain, reason, reporter = "anonymous" } = body;

    if (!domain || typeof domain !== "string") {
      return new Response(
        JSON.stringify({ error: "domain_required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!reason || typeof reason !== "string") {
      return new Response(
        JSON.stringify({ error: "reason_required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const report: ScamReport = {
      id: crypto.randomUUID(),
      domain: domain.toLowerCase().trim(),
      reason: reason.slice(0, 500),
      reporter: reporter.slice(0, 100),
      timestamp: new Date().toISOString(),
      votes: 1,
    };

    reports.push(report);

    console.log(`[Gorgon.Net] Scam report filed: ${domain} — "${reason}"`);

    return new Response(
      JSON.stringify({ success: true, reportId: report.id, domain: report.domain }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  },

  GET: async ({ request }) => {
    const url = new URL(request.url);
    const domain = url.searchParams.get("domain");

    if (!domain) {
      // Return all reports (admin view)
      return new Response(
        JSON.stringify({ reports: reports.slice(-50) }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const domainReports = reports.filter(
      (r) => r.domain === domain.toLowerCase().trim()
    );

    return new Response(
      JSON.stringify({ domain, count: domainReports.length, reports: domainReports }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  },
});
