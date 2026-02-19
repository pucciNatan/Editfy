// src/types/Job.ts
export interface ContractorJobApi {
  id: number;
  contractor: number;
  title: string;
  description: string;
  video_example_urls: string[];
  video_duration: string | null;

  // ✅ backend suporta todos esses tipos
  type: "FREELANCE" | "FIXED";

  work_mode: "REMOTE" | "HYBRID" | "ONSITE";
  location: string | null;

  min_payment: string | null;
  max_payment: string | null;
  fixed_payment: string | null;

  payment_display: string | null;
  tags: string[];
  applications_count: number;

  created_at: string;
  updated_at: string;
}
