import type { JobApi } from "@/services/job";
import type { Job } from "@/lib/mockJobsData"; // Reaproveitando o tipo UI existente

function brlToNumberOrUndefined(v?: string | null) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function toJobUI(api: JobApi): Job {
  return {
    id: api.id,
    title: (api.title || "").trim(),
    type: api.type as Job["type"],
    work_mode: api.work_mode as Job["work_mode"],
    location: (api.location || "").trim(),
    payment_display: (api.payment_display || "").trim(),
    fixed_payment: brlToNumberOrUndefined(api.fixed_payment),
    video_duration: api.video_duration || "",
    description: (api.description || "").trim(),
    video_example_urls: Array.isArray(api.video_example_urls) ? api.video_example_urls : [],
    tags: Array.isArray(api.tags) ? api.tags : [],
    applications_count: api.applications_count ?? 0,
    has_applied: api.has_applied ?? false,
    my_application_id: api.my_application_id ?? null,

    contractor_id: api.contractor,
    contractor_name: `Contratante #${api.contractor}`,
    contractor_avatar: "https://i.pravatar.cc/150?img=12",
    created_at: api.created_at,
  };
}

export function toJobsUI(list: JobApi[]): Job[] {
  return list.map(toJobUI);
}
