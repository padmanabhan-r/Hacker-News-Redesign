"use client";

import { useCallback, useState } from "react";
import type { BotState, BotTurn } from "@/lib/bot-types";
import { parseSources } from "@/lib/bot-types";

export type BotControl = {
  state: BotState;
  turns: BotTurn[];
  error: string | null;
  searchLabel: string;
  setError: (m: string | null) => void;
  reset: () => void;
  onMode: (mode: "speaking" | "listening") => void;
  onStatus: (status: string) => void;
  onSearching: (label?: string) => void;
  onShowSources: (query: string, rawSources: string) => void;
};

export function useBotConversation(): BotControl {
  const [state, setState] = useState<BotState>("idle");
  const [turns, setTurns] = useState<BotTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchLabel, setSearchLabel] = useState<string>("Searching HN…");

  const reset = useCallback(() => {
    setTurns([]);
    setError(null);
    setSearchLabel("Searching HN…");
    setState("idle");
  }, []);

  const onMode = useCallback((mode: "speaking" | "listening") => {
    setState((prev) => {
      if (prev === "searching" && mode === "listening") return "searching";
      return mode === "speaking" ? "speaking" : "listening";
    });
  }, []);

  const onStatus = useCallback((status: string) => {
    if (status === "disconnected") setState("idle");
    if (status === "connected") setState((p) => (p === "idle" ? "listening" : p));
  }, []);

  const onSearching = useCallback((label?: string) => {
    if (label) setSearchLabel(label);
    setState("searching");
  }, []);

  const onShowSources = useCallback((query: string, rawSources: string) => {
    const sources = parseSources(rawSources);
    setTurns((prev) => [...prev, { query: query || "", sources }]);
  }, []);

  return {
    state,
    turns,
    error,
    searchLabel,
    setError,
    reset,
    onMode,
    onStatus,
    onSearching,
    onShowSources,
  };
}
