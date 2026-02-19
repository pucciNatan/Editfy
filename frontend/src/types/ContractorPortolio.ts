// src/types/ContractorPortfolio.ts

export interface ContractorJobApi {
  id: number;
  contractor: number;
  title: string;
  description: string;
  video_example_urls: string[];
  video_duration: string | null;

  type: "FREELANCE" | "FIXED";

  work_mode: "REMOTE" | "HYBRID" | "ONSITE";
  location: string | null;

  min_payment: string | null;
  max_payment: string | null;
  fixed_payment: string | null;

  payment_display: string | null;
  tags: string[];
  applications_count: number;

  // campos derivados do editor logado (vêm do backend no portfólio)
  has_applied?: boolean;
  my_application_id?: number | null;

  created_at: string;
  updated_at: string;
}

export interface ContractorPortfolioApi {
  id: number;
  contractor: number;             // id do contratante
  banner: string | null;
  biography: string | null;
  language: string | null;        // "pt-BR"
  min_price: string | null;       // "100.00" | null
  max_price: string | null;       // "700.00" | null
  fixed_price: string | null;     // "1222.00" | null
  price_display: string;          // "R$ 100,00 - R$ 700,00"
  tags: string[];
  categories: string[];
  created_at: string;
  updated_at: string;
  jobs: ContractorJobApi[];
}
