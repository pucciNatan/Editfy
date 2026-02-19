import { useState, useRef, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import EditProfileModal from "./EditProfileModal";
import { startConversation } from "@/services/chat";
import { useAccountPublic } from "@/hooks/useAccountPublic";
import { authStorage } from "@/lib/authStorage";
import { getUserIdFromAccess } from "@/lib/jwt";
import { uploadProfilePhoto } from "@/services/account";
import { uploadEditorBanner } from "@/services/portfolio";

interface BannerProfileProps {
  data: {
    editor_name: string;
    profile_picture: string | null;
    banner: string | null;
    languages: string[];
    language: string;
    price_display: string;
    fixed_price: string | null;
    min_price: string | null;
    max_price: string | null;
    categories: string[];
    tags: string[];
    biography: string;
  };
  isOwner: boolean;
  editorId: number;
  onUpdate: (updates: any) => void;
}

const BannerProfile = ({ data, isOwner, editorId, onUpdate }: BannerProfileProps) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const { toast } = useToast();

  const { data: acc } = useAccountPublic(editorId);
  const displayName = acc?.nick || acc?.full_name || data.editor_name;
  const profilePhoto = data.profile_picture || acc?.profile_photo_url || null;

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // detecta usuário autenticado
  const currentUserId = useMemo<number>(() => {
    const fromWindow = (window as any).__CURRENT_USER_ID__;
    if (fromWindow) return Number(fromWindow);
    const uid = getUserIdFromAccess(authStorage.getAccess());
    return Number(uid || 0);
  }, []);
  const isAuthenticated = !!currentUserId;

  const handleSaveProfile = (updates: any) => {
    onUpdate(updates);
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resp = await uploadEditorBanner(file);
      onUpdate({ banner: resp.banner });

      toast({
        title: "Banner atualizado",
        description: "Seu banner foi salvo com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao enviar banner do editor:", error);
      toast({
        title: "Erro ao enviar banner",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.error("Erro ao enviar foto de perfil (editor):", error);
      toast({
        title: "Erro ao enviar foto de perfil",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      toast({ title: "Sessão expirada", description: "Entre novamente para iniciar a conversa.", variant: "destructive" });
      return;
    }
    try {
      const conversation = await startConversation(editorId);
      window.dispatchEvent(new CustomEvent("openChatWithUser", { detail: conversation }));
      //toast({ title: "Conversa iniciada", description: "Você já pode conversar em tempo real." });
    } catch (err: any) {
      if (err?.status === 401) {
        toast({ title: "Sessão expirada", description: "Entre novamente para iniciar a conversa.", variant: "destructive" });
        return;
      }
      toast({ title: "Erro", description: "Não foi possível iniciar a conversa. Tente novamente.", variant: "destructive" });
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
                  <AvatarFallback>{displayName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>

                {isOwner && (
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

              {/* Info Section (AGORA É UMA GROUP!) */}
              <div className="flex-1 space-y-4 relative group">

                {/* Edit Profile Button (só aparece no hover da área) */}
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

                {/* First Row */}
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-[300px]">
                    <h1 className="text-3xl font-bold mb-2">{displayName}</h1>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>🌐 {data.languages.join(", ")}</span>
                      <span>•</span>
                      <span className="text-primary font-semibold">💰 {data.price_display}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-start">
                    {data.categories.map((cat, idx) => (
                      <Badge key={idx} variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Chat Button (não dono) */}
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
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        open={isEditingProfile}
        onOpenChange={setIsEditingProfile}
        data={data}
        onSave={handleSaveProfile}
      />
    </TooltipProvider>
  );
};

export default BannerProfile;
