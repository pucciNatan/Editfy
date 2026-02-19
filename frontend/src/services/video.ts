import { httpGet, httpPost, httpPatch, httpDelete } from "@/api/http";
import type { Video } from "@/types/Video";

export type VideoListFilters = {
  ordering?: "recommended" | "random";
  work_mode?: "remoto" | "presencial" | "hibrido";
  categories?: string; // "games,marketing"
};

export function listVideos(filters?: VideoListFilters): Promise<Video[]> {
  if (!filters) {
    return httpGet<Video[]>("/api/videos/");
  }

  const params = new URLSearchParams();

  if (filters.ordering) params.set("ordering", filters.ordering);
  if (filters.work_mode) params.set("work_mode", filters.work_mode);
  if (filters.categories) params.set("categories", filters.categories);

  const qs = params.toString();
  const path = qs ? `/api/videos/?${qs}` : "/api/videos/";

  return httpGet<Video[]>(path);
}

// cria vídeo — AGORA COM author
export function createVideo(payload: {
  title: string;
  url: string;
  description: string;
  tags: string[];
  author: number; // 👈 OBRIGATÓRIO pro seu backend
}) {
  return httpPost<Video>("/api/videos/", payload);
}

// edita vídeo — usar PATCH
export function updateVideo(
  videoId: number,
  payload: Partial<Pick<Video, "title" | "description" | "tags" | "url">>
) {
  return httpPatch<Video>(`/api/videos/${videoId}/`, payload);
}

export function deleteVideo(videoId: number) {
  return httpDelete(`/api/videos/${videoId}/`);
}
