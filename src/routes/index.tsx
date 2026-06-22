import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aegis — AI Trust Layer for Web3" },
      { name: "description", content: "Aegis is the AI trust layer for Web3 — a Chrome sidebar that explains, scores, and sandboxes every site and transaction before you sign." },
      { property: "og:title", content: "Aegis — AI Trust Layer for Web3" },
      { property: "og:description", content: "Sidebar AI that explains, scores, and sandboxes every Web3 interaction before you sign." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div style={{ width: "100%", height: "100vh", background: "#F0F2F5" }}>
      <iframe
        src="/aegis.html"
        title="Aegis sidebar prototype"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    </div>
  );
}
