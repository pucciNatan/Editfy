import { httpGet, httpPatch, httpPost } from "@/api/http";
import type { Portfolio } from "@/types/Portfolio";

export function getPortfolio(id: number): Promise<Portfolio> {
  return httpGet<Portfolio>(`/api/portfolio/${id}/`);
}

// retorna o portfólio do usuário autenticado (dono)
export function getMyPortfolio(): Promise<Portfolio> {
  return httpGet<Portfolio>("/api/portfolio/");
}

// PATCH nas infos “principais” do portfólio do dono
export function patchMyPortfolio(updates: Partial<Portfolio>): Promise<Portfolio> {
  return httpPatch<Portfolio>("/api/portfolio/", updates);
}

export function uploadEditorBanner(file: File): Promise<{ banner: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return httpPost<{ banner: string }>(`/api/portfolio/banner/`, formData);
}
