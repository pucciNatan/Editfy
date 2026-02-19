import { httpDelete, httpPost, httpPatch } from "@/api/http";
import type { RecommendationPost } from "@/types/Portfolio";

export interface CreateRecommendationPayload {
  portfolio: number;
  comment: string;
}

export interface UpdateRecommendationPayload {
  comment: string;
}

export function createRecommendation(payload: CreateRecommendationPayload) {
  return httpPost<RecommendationPost>("/api/recommendations/", payload);
}

export function updateRecommendation(id: number, payload: UpdateRecommendationPayload) {
  return httpPatch<RecommendationPost>(`/api/recommendations/${id}/`, payload);
}

export function deleteRecommendation(id: number) {
  return httpDelete(`/api/recommendations/${id}/`);
}
