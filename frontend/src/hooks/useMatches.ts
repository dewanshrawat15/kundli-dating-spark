import { useState, useCallback } from "react";
import * as matchesApi from "@/api/matches";
import type { MatchItem } from "@/api/matches";

interface UseMatchesOptions {
  minScore?: number;
  religion?: string;
}

export const useMatches = (options: UseMatchesOptions = {}) => {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalUnseen, setTotalUnseen] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMatches = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    const currentPage = reset ? 1 : page;
    try {
      const { data } = await matchesApi.getMatches({
        page: currentPage,
        page_size: 20,
        min_score: options.minScore,
        religion: options.religion,
      });
      const newMatches = reset ? data.results : [...matches, ...data.results];
      setMatches(newMatches);
      setTotalUnseen(data.total_unseen);
      setHasMore(newMatches.length < data.total_unseen);
      if (reset) setPage(2);
      else setPage((p) => p + 1);
    } catch {
      setError("Failed to load matches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, matches, options.minScore, options.religion]);

  const recordDecision = useCallback(
    async (profileId: string, decision: "accepted" | "rejected") => {
      await matchesApi.recordDecision(profileId, decision);
      setMatches((prev) => prev.filter((m) => m.profile_id !== profileId));
      setTotalUnseen((t) => Math.max(0, t - 1));
    },
    []
  );

  return {
    matches,
    loading,
    error,
    hasMore,
    totalUnseen,
    fetchMatches,
    recordDecision,
  };
};
