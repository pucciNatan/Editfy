import { httpGet, httpPost } from "@/api/http";

export interface AccountPublic {
  id: number;
  role: string;
  nick: string | null;
  full_name: string | null;
  profile_photo_url: string | null;
}

export async function getAccountPublic(id: number): Promise<AccountPublic> {
  return httpGet<AccountPublic>(`/api/accounts/${id}/`, { auth: false });
}

export async function uploadProfilePhoto(file: File): Promise<{ profile_photo_url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return httpPost<{ profile_photo_url: string }>(
    `/api/accounts/me/profile-photo/`,
    formData
  );
}
