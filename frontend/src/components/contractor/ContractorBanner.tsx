import { useState, useRef, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import EditContractorModal from "./EditContractorModal";
import { startConversation } from "@/services/chat";
import { useAccountPublic } from "@/hooks/useAccountPublic";
import { authStorage } from "@/lib/authStorage"; // ✅
import { getUserIdFromAccess } from "@/lib/jwt"; // ✅
import { uploadProfilePhoto } from "@/services/account";

interface ContractorBannerProps {
  data: {
    contractor_name: string;
    profile_picture: string;
    banner: string;
    language: string;
    price_display: string;
    categories: string[];
    tags: string[];
    biography: string;
  };
  isOwner: boolean;
  contractorId: number;
  onUpdate: (updates: any) => void;
  onBannerUpload?: (file: File) => void;
}

const ContractorBanner = ({
  data,
  isOwner,
  contractorId,
  onUpdate,
  onBannerUpload,
}: ContractorBannerProps) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const { toast } = useToast();

  // ✅ busca nick/nome/foto do contratante
  const { data: acc } = useAccountPublic(contractorId);
  const displayName = acc?.nick || acc?.full_name || data.contractor_name;
  const profilePhoto = acc?.profile_photo_url ?? data.profile_picture;

  // ✅ detectar usuário autenticado
  const currentUserId = useMemo<number>(() => {
    const fromWindow = (window as any).__CURRENT_USER_ID__;
    if (fromWindow) return Number(fromWindow);
    const uid = getUserIdFromAccess(authStorage.getAccess());
    return Number(uid || 0);
  }, []);
  const isAuthenticated = !!currentUserId;

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (updates: any) => {
    onUpdate(updates);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onBannerUpload) {
      onBannerUpload(file);
    }
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resp = await uploadProfilePhoto(file);

      onUpdate({ profile_picture: resp.profile_photo_url });

      toast({
        title: "Foto de perfil atualizada",
        description: "Sua foto foi salva com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao enviar foto de perfil (contratante):", error);
      toast({
        title: "Erro ao enviar foto de perfil",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sessão expirada",
        description: "Entre novamente para iniciar a conversa.",
        variant: "destructive",
      });
      return;
    }
    try {
      const conversation = await startConversation(contractorId);
      window.dispatchEvent(
        new CustomEvent("openChatWithUser", { detail: conversation })
      );
    } catch (err: any) {
      if (err?.status === 401) {
        toast({
          title: "Sessão expirada",
          description: "Entre novamente para iniciar a conversa.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Banner */}
        <div
          className="h-64 w-full bg-cover bg-center relative group"
          style={{ backgroundImage: `url(${data.banner})` }}
          onMouseEnter={() => setIsHoveringBanner(true)}
          onMouseLeave={() => setIsHoveringBanner(false)}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          {isOwner && isHoveringBanner && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar banner</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Profile Section */}
        <div className="w-[80%] mx-auto px-4">
          <div className="relative -mt-20 pb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div
                className="relative group"
                onMouseEnter={() => setIsHoveringAvatar(true)}
                onMouseLeave={() => setIsHoveringAvatar(false)}
              >
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={profilePhoto || undefined} alt={displayName} />
                  <AvatarFallback>
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOwner && isHoveringAvatar && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar foto de perfil</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>

              {/* Info Section (AGORA COMO GROUP, COM LÁPIS NO HOVER) */}
              <div className="flex-1 space-y-4 relative group">
                {/* Botão de editar perfil que aparece no hover da área */}
                {isOwner && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="
                          absolute -top-6 left-56
                          bg-background/80 border border-border shadow-md rounded-full
                          opacity-0 group-hover:opacity-100
                          transition-opacity duration-200 z-10 pointer-events-auto
                        "
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editar perfil</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* First Row: Name, Language, Price, Categories */}
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-[300px]">
                    <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>🌐 {data.language}</span>
                      <span>•</span>
                      <span className="text-primary font-semibold">
                        💰 {data.price_display}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-start">
                    {data.categories.map((cat, idx) => (
                      <Badge
                        key={idx}
                        variant="default"
                        className="bg-primary/20 text-primary hover:bg-primary/30"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Conversar Button — só autenticado e não-dono */}
                {!isOwner && isAuthenticated && (
                  <div className="pt-4">
                    <Button
                      onClick={handleStartConversation}
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Conversar
                    </Button>
                  </div>
                )}

                {/* Biography */}
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.biography}
                  </p>
                </div>
              </div>
              {/* fim Info Section */}
            </div>
          </div>
        </div>
      </div>

      <EditContractorModal
        open={isEditingProfile}
        onOpenChange={setIsEditingProfile}
        data={data}
        onSave={handleSaveProfile}
      />
    </TooltipProvider>
  );
};

export default ContractorBanner;
