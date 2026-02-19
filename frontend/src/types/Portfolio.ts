// src/types/Portfolio.ts
import type { Video } from "@/types/Video";

export interface RecommendationPost {
  id: number;
  portfolio: number;
  author: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: number;
  editor: number;           // dono do portfólio
  banner: string | null;
  biography: string | null;
  language: string | null;
  min_price: string | null; // strings do backend
  max_price: string | null;
  fixed_price: string | null;
  price_display: string | null; // ex.: "R$ 2.500,00"
  videos: Video[];
  tags: string[];
  categories: string[];
  created_at: string;
  updated_at: string;
  recommendation_posts: RecommendationPost[];
}

export interface BannerProfileData {
  editor_name: string;
  profile_picture: string | null;
  banner: string | null;
  languages: string[];         // seu componente usa array
  price_display: string;       // sempre pt-BR
  categories: string[];
  tags: string[];
  biography: string | null;
}