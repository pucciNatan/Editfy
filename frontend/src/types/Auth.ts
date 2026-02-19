// src/types/Auth.ts
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface SignupEditorPayload {
  nick: string;
  full_name: string;
  email: string;
  cep: string;
  profile_photo_url: string;
  birth_date: string; // "YYYY-MM-DD"
  password: string;
}

export interface SignupContractorPayload extends SignupEditorPayload {}

export interface LoginPayload {
  email: string;
  password: string;
}

// ✅ NOVO: resposta do /api/auth/me/
export interface AuthMe {
  id: number;
  role: "EDITOR" | "CONTRACTOR" | string;
  nick: string;
  full_name: string;
  email: string;
  cep: string;
  profile_photo_url: string | null;
  account_created_at: string;
  birth_date: string;
  is_active: boolean;
}
