// src/adapters/contractorPortfolioAdapter.tsx
import type {
  ContractorPortfolioApi,
  ContractorJobApi,
} from "@/types/ContractorPortolio";

export interface UIContractorBannerData {
  contractor_name: string;
  profile_picture: string;
  banner: string | null;
  language: string;
  price_display: string;
  categories: string[];
  tags: string[];
  biography: string;
}

function toUIJob(j: ContractorJobApi): ContractorJobApi {
  const count =
    (j as any).applications_count ??
    (j as any).applicationsCount ??
    (j as any).applications?.length ??
    0;

  return {
    ...j,
    location: j.location ?? null,
    payment_display: j.payment_display ?? "Pagamento não informado",
    video_duration: j.video_duration ?? null,
    video_example_urls: j.video_example_urls ?? [],
    tags: j.tags ?? [],
    applications_count: count,
  };
}

export function toUIBannerData(p: ContractorPortfolioApi): UIContractorBannerData {
  return {
    contractor_name: `Contratante #${p.contractor}`,
    profile_picture: "",
    banner: p.banner,
    language: p.language ?? "pt-BR",
    price_display: p.price_display ?? "",
    categories: p.categories ?? [],
    tags: p.tags ?? [],
    biography: p.biography ?? "",
  };
}

export function toUIContractorPortfolio(p: ContractorPortfolioApi) {
  return {
    id: p.id,
    contractorId: p.contractor,
    ...toUIBannerData(p),
    jobs: (p.jobs || []).map(toUIJob), // ✅ agora vem com count certo
  };
}
