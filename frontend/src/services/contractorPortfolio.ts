// src/services/contractorPortfolio.ts
import { httpGet, httpPatch, httpPost } from "@/api/http";
import type { ContractorPortfolioApi } from "@/types/ContractorPortolio";

export function getContractorPortfolio(id: number) {
  return httpGet<ContractorPortfolioApi>(`/api/contractor-portfolio/${id}/`);
}

// PATCH no portfólio do contratante autenticado
export function patchMyContractorPortfolio(payload: Partial<ContractorPortfolioApi>) {
  // backend exposto em: PATCH http://localhost:8000/api/contractor-portfolio/
  return httpPatch<ContractorPortfolioApi>(`/api/contractor-portfolio/`, payload);
}

// Tenta pegar o “self” (para comparar dono). Suporta / e /me/
export async function getMyContractorPortfolio() {
  try {
    return await httpGet<ContractorPortfolioApi>(`/api/contractor-portfolio/`);
  } catch {
    return await httpGet<ContractorPortfolioApi>(`/api/contractor-portfolio/me/`);
  }
}

export function uploadContractorBanner(file: File): Promise<{ banner: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return httpPost<{ banner: string }>(`/api/contractor-portfolio/banner/`, formData);
}
