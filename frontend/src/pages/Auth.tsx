// src/pages/Auth.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logoSemBackground.png";

// ✅ usa o http client já centralizado (com Bearer + auto-refresh)
import { httpPost } from "@/api/http";

// ✅ storage simples p/ tokens
const ACCESS_KEY = "auth_access";
const REFRESH_KEY = "auth_refresh";
const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};

type UserType = "editor" | "contractor" | null;

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);

  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nick: "",
    full_name: "",
    email: "",
    cep: "",
    profile_photo_url: "",
    birth_date: "",
    password: "",
  });

  // Mantém email/senha sincronizados entre abas, o resto só importa no signup
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper de erro
  const getErrorMessage = async (res: Response) => {
    try {
      const data = await res.json();
      // Mostra a primeira mensagem legível que existir
      if (typeof data === "string") return data;
      const flat = Object.entries(data || {})
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
        .join(" | ");
      return flat || `Erro ${res.status}`;
    } catch {
      const txt = await res.text().catch(() => "");
      return txt || `Erro ${res.status}`;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) {
      toast({ title: "Selecione o tipo de conta", description: "Escolha Editor ou Contratante.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        userType === "editor"
          ? "/api/auth/signup/editor/"
          : "/api/auth/signup/contractor/";

      const res = await fetch(
        `${(import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000"}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            nick: formData.nick,
            full_name: formData.full_name,
            email: formData.email,
            cep: formData.cep,
            profile_photo_url: formData.profile_photo_url || null,
            birth_date: formData.birth_date, // "YYYY-MM-DD"
            password: formData.password,
          }),
        }
      );

      if (!res.ok) {
        const msg = await getErrorMessage(res);
        throw new Error(msg);
      }

      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo(a), ${formData.full_name}! Faça login para continuar.`,
      });

      // Alterna para a aba de login:
      setIsLogin(true);
      // Opcional: limpa campos sensíveis
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err: any) {
      toast({ title: "Erro no cadastro", description: err?.message ?? "Falha ao criar conta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Usando httpPost sem auth (rota pública). Se seu httpPost exige {auth:false}, ajuste.
      const data = await httpPost<{ access: string; refresh: string }>(
        "/api/auth/login/",
        { email: formData.email, password: formData.password },
        { auth: false }
      );

      saveTokens(data.access, data.refresh);

    // 🔔 avisa a UI que logou
    window.dispatchEvent(new CustomEvent("auth:login"));

      toast({ title: "Login realizado!", description: "Redirecionando…" });

      // Redireciona: escolha a melhor rota p/ sua UX
      navigate("/"); // ou navigate("/meu-portfolio")
    } catch (err: any) {
      toast({ title: "Erro no login", description: err?.message ?? "Credenciais inválidas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-col items-center gap-2">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                <img src={logo} alt="EditFy" className="h-14 w-auto" />
              </CardTitle>

              <CardDescription className="text-center">
                {isLogin ? "Entre na sua conta" : "Crie sua conta"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs
                value={isLogin ? "login" : "signup"}
                onValueChange={(v) => {
                  setIsLogin(v === "login");
                  // ao trocar para cadastro, reseta escolha de tipo
                  if (v !== "login") setUserType(null);
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Cadastro</TabsTrigger>
                  <TabsTrigger value="login">Login</TabsTrigger>
                </TabsList>

                {/* Cadastro */}
                <TabsContent value="signup" className="space-y-4">
                  {!userType ? (
                    <div className="space-y-3 pt-4">
                      <p className="text-center text-muted-foreground mb-4">Você é:</p>
                      <Button
                        onClick={() => setUserType("editor")}
                        className="w-full h-20 text-lg bg-primary hover:bg-primary/90"
                      >
                        Sou Editor
                      </Button>
                      <Button
                        onClick={() => setUserType("contractor")}
                        variant="outline"
                        className="w-full h-20 text-lg border-primary text-primary hover:bg-primary/10"
                      >
                        Sou Contratante
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="nick">Nickname</Label>
                        <Input
                          id="nick"
                          name="nick"
                          placeholder="@seunick"
                          value={formData.nick}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="Seu nome"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          name="cep"
                          placeholder="00000-000"
                          value={formData.cep}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      {/*
                      <div className="space-y-2">
                        <Label htmlFor="profile_photo_url">URL da Foto de Perfil</Label>
                        <Input
                          id="profile_photo_url"
                          name="profile_photo_url"
                          type="url"
                          placeholder="https://..."
                          value={formData.profile_photo_url}
                          onChange={handleInputChange}
                        />
                      </div>
                      */}

                      <div className="space-y-2">
                        <Label htmlFor="birth_date">Data de Nascimento</Label>
                        <Input
                          id="birth_date"
                          name="birth_date"
                          type="date"
                          value={formData.birth_date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setUserType(null)}
                          className="flex-1"
                          disabled={loading}
                        >
                          Voltar
                        </Button>
                        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                          {loading ? "Criando..." : "Criar Conta"}
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>

                {/* Login */}
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
