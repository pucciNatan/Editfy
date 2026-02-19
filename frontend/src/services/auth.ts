// src/services/auth.ts
import { httpGet, httpPost } from "@/api/http";
import type {
  AuthTokens,
  SignupEditorPayload,
  SignupContractorPayload,
  LoginPayload,
  AuthMe,
} from "@/types/Auth";
import type { Portfolio } from "@/types/Portfolio";

export async function signupEditor(payload: SignupEditorPayload): Promise<void> {
  await httpPost<void>("/api/auth/signup/editor/", payload, { auth: false });
}

export async function signupContractor(
  payload: SignupContractorPayload
): Promise<void> {
  await httpPost<void>("/api/auth/signup/contractor/", payload, { auth: false });
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  return httpPost<AuthTokens>("/api/auth/login/", payload, { auth: false });
}

export async function refreshToken(
  refresh: string
): Promise<{ access: string }> {
  return httpPost<{ access: string }>(
    "/api/auth/refresh/",
    { refresh },
    { auth: false }
  );
}

// ✅ NOVO: pega o usuário logado com role
export async function getMe(): Promise<AuthMe> {
  return httpGet<AuthMe>("/api/auth/me/");
}

export async function getMyPortfolio(): Promise<Portfolio> {
  return httpGet<Portfolio>("/api/portfolio/");
}
