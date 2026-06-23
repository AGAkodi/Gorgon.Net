import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SearchResults } from "../components/SearchResults";
import { BrowserLayout } from "../components/BrowserLayout";
import { useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Gorgon.Net" },
      { name: "description", content: "AI-powered Web3 search results. Discover safe DeFi protocols, detect scams, and understand any token or contract." },
      { property: "og:title", content: "Search — Gorgon.Net" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  // Render the full browser layout with the search pre-populated
  return <BrowserLayout initialQuery={q} />;
}
