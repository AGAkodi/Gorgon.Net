/**
 * session.ts — Lightweight localStorage persistence for Gorgon.Net
 *
 * Persists: search history, selected model, theme preference.
 * Uses versioned key so old data is safely ignored after schema changes.
 */

const SESSION_KEY = "gorgon_session_v1";

export interface GorgonSession {
  searchHistory: string[]; // last 20 unique queries
  selectedModel: string;   // active 0G model id
  apiKeyConfigured: boolean;
}

const DEFAULT_SESSION: GorgonSession = {
  searchHistory: [],
  selectedModel: "deepseek-v4-flash",
  apiKeyConfigured: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSession(): GorgonSession {
  if (!isBrowser()) return { ...DEFAULT_SESSION };
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { ...DEFAULT_SESSION };
    const parsed = JSON.parse(raw) as Partial<GorgonSession>;
    return { ...DEFAULT_SESSION, ...parsed };
  } catch {
    return { ...DEFAULT_SESSION };
  }
}

export function saveSession(session: Partial<GorgonSession>): void {
  if (!isBrowser()) return;
  try {
    const current = loadSession();
    const next = { ...current, ...session };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

export function addSearchHistory(query: string): string[] {
  const session = loadSession();
  const filtered = session.searchHistory.filter(
    (q) => q.toLowerCase() !== query.toLowerCase()
  );
  const next = [query, ...filtered].slice(0, 20);
  saveSession({ searchHistory: next });
  return next;
}

export function clearSearchHistory(): void {
  saveSession({ searchHistory: [] });
}
