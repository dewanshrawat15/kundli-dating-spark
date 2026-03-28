import client from "./client";

export interface ScoreBreakdown {
  varna: number;
  vasya: number;
  tara: number;
  yoni: number;
  graha_maitri: number;
  gana: number;
  bhakoot: number;
  nadi: number;
}

export interface MatchItem {
  profile_id: string;
  name: string;
  age: number;
  city: string;
  bio_snippet: string;
  primary_photo_url: string | null;
  email: string;
  guna_milan_total: number;
  overall_score: number;
  is_manglik_compatible: boolean;
  narrative: string | null;
  score_breakdown: ScoreBreakdown;
}

export interface MatchDetail extends MatchItem {
  bio: string;
  photos: string[];
  rashi_name: string;
  nakshatra_name: string;
  gana: string;
  nadi: string;
  is_manglik: boolean | null;
}

export interface MatchListResponse {
  results: MatchItem[];
  total_unseen: number;
  page: number;
  page_size: number;
}

export const getMatches = (params?: {
  page?: number;
  page_size?: number;
  min_score?: number;
  religion?: string;
}) => client.get<MatchListResponse>("/matches/", { params });

export const getMatchDetail = (profileId: string) =>
  client.get<MatchDetail>(`/matches/${profileId}/`);

export const recordDecision = (profileId: string, decision: "accepted" | "rejected") =>
  client.post(`/matches/${profileId}/decide/`, { decision });
