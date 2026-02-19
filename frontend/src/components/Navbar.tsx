import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Briefcase } from "lucide-react";
import logo from "@/assets/logoEditFy.jpg";
import { httpGet } from "@/api/http";
import type { Portfolio } from "@/types/Portfolio";

const ACCESS_KEY = "auth_access";
const REFRESH_KEY = "auth_refresh";

type ContractorPortfolioSelf = { id: number; contractor: number };

async function tryGetContractorSelf(): Promise<ContractorPortfolioSelf> {
  try {
    return await httpGet<ContractorPortfolioSelf>("/api/contractor-portfolio/");
  } catch {
    return await httpGet<ContractorPortfolioSelf>("/api/contractor-portfolio/me/");
  }
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuth, setIsAuth] = useState<boolean>(
    () => !!localStorage.getItem(ACCESS_KEY)
  );
  const [loadingProfile, setLoadingProfile] = useState(false);

  // rota atual
  const isVideosActive =
    location.pathname === "/" || location.pathname.startsWith("/videos");
  const isVagasActive = location.pathname.startsWith("/vagas");

  useEffect(() => {
    const sync = () => setIsAuth(!!localStorage.getItem(ACCESS_KEY));
    const onLogin = () => setIsAuth(true);
    const onLogout = () => setIsAuth(false);

    window.addEventListener("storage", sync);
    window.addEventListener("auth:login", onLogin as EventListener);
    window.addEventListener("auth:logout", onLogout as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth:login", onLogin as EventListener);
      window.removeEventListener("auth:logout", onLogout as EventListener);
    };
  }, []);

  async function goToMyProfile() {
    setLoadingProfile(true);
    try {
      const p = await httpGet<Portfolio>("/api/portfolio/");
      navigate(`/portfolio/${p.editor}`);
      return;
    } catch {
      // tenta contratante
    }

    try {
      const cp = await tryGetContractorSelf();
      navigate(`/contratante/${cp.contractor}`);
      return;
    } catch {
      navigate("/auth");
    } finally {
      setLoadingProfile(false);
    }
  }

  function logout() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    window.dispatchEvent(new CustomEvent("auth:logout"));
    navigate("/");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="EditFy" className="h-14 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className={`flex items-center gap-2 font-medium transition-colors ${
              isVideosActive
                ? "text-primary"
                : "text-foreground hover:text-primary"
            }`}
          >
            <Video size={20} />
            <span>Vídeos</span>
          </Link>

          <Link
            to="/vagas"
            className={`flex items-center gap-2 font-medium transition-colors ${
              isVagasActive
                ? "text-primary"
                : "text-foreground hover:text-primary"
            }`}
          >
            <Briefcase size={20} />
            <span>Vagas</span>
          </Link>
        </div>

        {isAuth ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="min-w-[120px]"
              onClick={goToMyProfile}
              disabled={loadingProfile}
            >
              {loadingProfile ? "Abrindo..." : "Meu perfil"}
            </Button>
            <Button variant="ghost" onClick={logout}>
              Sair
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Login / Cadastro
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
