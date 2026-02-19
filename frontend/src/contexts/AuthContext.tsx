// src/contexts/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authStorage } from "@/lib/authStorage";
import {
  login as loginApi,
  signupEditor as signupEditorApi,
  signupContractor as signupContractorApi,
  getMe,
} from "@/services/auth";
import type {
  LoginPayload,
  SignupEditorPayload,
  SignupContractorPayload,
  AuthMe,
} from "@/types/Auth";

type AuthContextType = {
  isAuthenticated: boolean;
  access: string | null;
  refresh: string | null;

  // ✅ NOVO
  user: AuthMe | null;

  login: (payload: LoginPayload) => Promise<void>;
  signupEditor: (payload: SignupEditorPayload) => Promise<void>;
  signupContractor: (payload: SignupContractorPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<string | null>(authStorage.getAccess());
  const [refresh, setRefresh] = useState<string | null>(authStorage.getRefresh());

  const [user, setUser] = useState<AuthMe | null>(null);

  useEffect(() => {
    const onStorage = () => {
      setAccess(authStorage.getAccess());
      setRefresh(authStorage.getRefresh());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ sempre que tiver access válido, busca /me
  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      if (!access) {
        if (mounted) setUser(null);
        return;
      }
      try {
        const me = await getMe();
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, [access]);

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await loginApi(payload);
    authStorage.setTokens(tokens.access, tokens.refresh);
    setAccess(tokens.access);
    setRefresh(tokens.refresh);

    // opcional: carrega user já no login
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const signupEditor = useCallback(async (payload: SignupEditorPayload) => {
    await signupEditorApi(payload);
  }, []);

  const signupContractor = useCallback(
    async (payload: SignupContractorPayload) => {
      await signupContractorApi(payload);
    },
    []
  );

  const logout = useCallback(() => {
    authStorage.clear();
    setAccess(null);
    setRefresh(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(access && refresh),
      access,
      refresh,
      user, // ✅ agora existe
      login,
      signupEditor,
      signupContractor,
      logout,
    }),
    [access, refresh, user, login, signupEditor, signupContractor, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
