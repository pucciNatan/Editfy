import { httpGet, httpPost, httpPatch, httpDelete } from "@/api/http";

// Shape vindo do backend Django (JobReadSerializer)
export interface JobApi {
  id: number;
  contractor: number;
  title: string;
  description: string;
  video_example_urls: string[];
  video_duration: string | null;
  type: "FREELANCE" | "FIXED" | "HOURLY" | "CLT" | "PJ" | "TEMP";
  work_mode: "REMOTE" | "HYBRID" | "ONSITE";
  location: string | null;
  min_payment: string | null;      // "1000.00"
  max_payment: string | null;      // "2500.00"
  fixed_payment: string | null;    // "1500.00"
  payment_display: string;         // "R$ 1.500,00" ou "R$ 1.000,00 - R$ 2.500,00"
  tags: string[];

  applications_count: number;
  has_applied: boolean;
  my_application_id: number | null;

  created_at: string;
  updated_at: string;
}

export interface JobApplicationApi {
  id: number;
  job: number;
  editor?: number;
  note?: string | null;
  created_at: string;
  updated_at?: string;
}


export type JobsFilter = {
  ordering?: "recommended" | "random";
  work_mode?: "remoto" | "presencial" | "hibrido";
  min_price?: number;
  max_price?: number;
  categories?: string; // "games,marketing"
};

export async function fetchJobs(filters?: JobsFilter) {
  const params = new URLSearchParams();

  if (filters?.ordering) params.set("ordering", filters.ordering);
  if (filters?.work_mode) params.set("work_mode", filters.work_mode);
  if (typeof filters?.min_price === "number") {
    params.set("min_price", String(filters.min_price));
  }
  if (typeof filters?.max_price === "number") {
    params.set("max_price", String(filters.max_price));
  }
  if (filters?.categories) params.set("categories", filters.categories);

  const qs = params.toString();
  const path = qs ? `/api/jobs/?${qs}` : "/api/jobs/";

  return httpGet<JobApi[]>(path);
}

/**
 * POST /api/jobs/{id}/apply/
 */
export async function applyToJob(
  jobId: number,
  payload: { note?: string }
): Promise<any> {
  return httpPost<any>(`/api/jobs/${jobId}/apply/`, payload);
}

/**
 * GET /api/jobs/{id}/applications/
 */
export async function fetchJobApplications(jobId: number): Promise<any[]> {
  return httpGet<any[]>(`/api/jobs/${jobId}/applications/`);
}

/**
 * DELETE /api/jobs/{jobId}/applications/{appId}/
 */
export async function deleteJobApplication(jobId: number, appId: number): Promise<void> {
  return httpDelete<void>(`/api/jobs/${jobId}/applications/${appId}/`);
}

export async function createJob(payload: any) {
  // POST /api/jobs/
  return httpPost<JobApi>("/api/jobs/", payload);
}

export async function updateJob(id: number, payload: any) {
  // PATCH /api/jobs/{id}/
  return httpPatch<JobApi>(`/api/jobs/${id}/`, payload);
}

export async function deleteJob(id: number) {
  // DELETE /api/jobs/{id}/
  return httpDelete<void>(`/api/jobs/${id}/`);
}

// ✅ NOVO: Lista as vagas em que o editor logado já se candidatou
export async function fetchMyAppliedJobs(): Promise<JobApi[]> {
  return httpGet<JobApi[]>("/api/jobs/my-applied/");
}
