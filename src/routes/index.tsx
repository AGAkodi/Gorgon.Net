import { createFileRoute } from "@tanstack/react-router";
import { BrowserLayout } from "../components/BrowserLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gorgon.Net — AI Web3 Search Engine" },
      { name: "description", content: "Search, discover, and securely browse Web3 protocols with AI-powered trust scoring. Powered by the 0G decentralized knowledge graph." },
      { property: "og:title", content: "Gorgon.Net — AI Web3 Search Engine" },
      { property: "og:description", content: "AI-powered Web3 search engine. Discover safe DeFi protocols, detect scams, and understand any transaction before you sign." },
    ],
  }),
  component: Index,
});

function Index() {
  return <BrowserLayout />;
}

