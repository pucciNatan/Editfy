import type { Portfolio, RecommendationPost } from "@/types/Portfolio";

// Tipos que seus componentes esperam
export interface UIBannerProfileData {
  editor_name: string;
  profile_picture: string | null;
  banner: string | null;
  languages: string[];
  price_display: string;
  categories: string[];
  tags: string[];
  biography: string | null;
}

export interface UIRecommendation {
  id: number;
  author_name: string;
  comment: string;
  created_at: string;
}

function formatBRL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!isFinite(n)) return "-";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toBannerProfileData(p: Portfolio) {
  return {
    editor_name: `Editor #${p.editor}`,
    profile_picture: null,
    banner: p.banner,
    languages: p.language ? [p.language] : ["pt-BR"],   // UI
    language: p.language ?? "pt-BR",                    // 👈 backend STRING
    price_display: p.price_display ?? "—",
    fixed_price: p.fixed_price ?? null,                 // 👈 ADD
    min_price: p.min_price ?? null,                     // 👈 ADD
    max_price: p.max_price ?? null,                     // 👈 ADD
    categories: p.categories ?? [],
    tags: p.tags ?? [],
    biography: p.biography ?? "",
  };
}

export function toRecommendations(p: Portfolio) {
  return (p.recommendation_posts ?? []).map((r) => ({
    id: r.id,
    author_id: r.author,              // ⬅️ agora enviamos o id do autor
    author_name: `Cliente #${r.author}`,
    comment: r.comment,
    created_at: r.created_at,
  }));
}

export function toUIRecommendationItem(r: RecommendationPost) {
  return {
    id: r.id,
    author_id: r.author,
    author_name: `Cliente #${r.author}`,
    comment: r.comment,
    created_at: r.created_at ?? new Date().toISOString(),
  };
}