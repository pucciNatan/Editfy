// src/pages/Portfolio.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BannerProfile from "@/components/portfolio/BannerProfile";
import VideoList from "@/components/portfolio/VideoList";
import RecommendationList from "@/components/portfolio/RecommendationList";
import VideoListSkeleton from "@/components/portfolio/VideoListSkeleton";

import type { Portfolio } from "@/types/Portfolio";
import type { ContractorJobApi } from "@/types/ContractorPortolio";

import { authStorage } from "@/lib/authStorage";
import { getUserIdFromAccess } from "@/lib/jwt";

import { getPortfolio, getMyPortfolio, patchMyPortfolio } from "@/services/portfolio";
import { createVideo, updateVideo as updateVideoApi, deleteVideo as deleteVideoApi } from "@/services/video";
import {
  createRecommendation,
  deleteRecommendation as deleteRecommendationApi,
  updateRecommendation as updateRecommendationApi,
} from "@/services/recommendation";

import { toBannerProfileData, toRecommendations } from "@/adapters/portfolioAdapter";
import { useToast } from "@/hooks/use-toast";

import JobsList from "@/components/contractor/JobsList";
import { httpGet } from "@/api/http";

const PortfolioPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null);
  const [myEditorId, setMyEditorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appliedJobs, setAppliedJobs] = useState<ContractorJobApi[]>([]);
  const [appliedLoading, setAppliedLoading] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("auth_access"));

  const currentUserId = useMemo<number | null>(() => {
    const fromWindow = (window as any).__CURRENT_USER_ID__;
    if (fromWindow) return Number(fromWindow);

    const uid = getUserIdFromAccess(authStorage.getAccess());
    return uid ? Number(uid) : null;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error("ID do portfólio não informado.");

        const [visited, mine] = await Promise.allSettled([
          getPortfolio(Number(id)),
          isLoggedIn ? getMyPortfolio() : Promise.resolve(null as any),
        ]);

        if (visited.status === "fulfilled") {
          const data = visited.value;
          data.videos.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          setPortfolioData(data);
        } else {
          const msg =
            "reason" in visited && visited.reason
              ? (visited.reason as any).message ?? String(visited.reason)
              : "Erro ao carregar portfólio.";
          throw new Error(msg);
        }

        if (mine.status === "fulfilled" && mine.value) {
          setMyEditorId(mine.value.editor);
        }
      } catch (e: any) {
        setError(e?.message ?? "Erro ao carregar o portfólio.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, isLoggedIn]);

  const isOwner = useMemo(() => {
    if (!portfolioData) return false;
    if (!isLoggedIn) return false;
    return myEditorId === portfolioData.editor;
  }, [myEditorId, portfolioData, isLoggedIn]);

  const bannerData = useMemo(
    () => (portfolioData ? toBannerProfileData(portfolioData) : null),
    [portfolioData]
  );

  const uiRecommendations = useMemo(
    () => (portfolioData ? toRecommendations(portfolioData) : []),
    [portfolioData]
  );

  // ====== VAGAS CANDIDATAS ======
  useEffect(() => {
    if (!isOwner) return;

    setAppliedLoading(true);
    (async () => {
      try {
        const data = await httpGet<any>("/api/jobs/my-applied/");
        const list = Array.isArray(data) ? data : data?.results ?? [];
        setAppliedJobs(list as any);
      } catch (e) {
        console.error("Erro ao carregar vagas candidatas:", e);
      } finally {
        setAppliedLoading(false);
      }
    })();
  }, [isOwner]);

  // ====== HANDLERS ======

  const handleUpdatePortfolio = async (updates: Partial<Portfolio>) => {
    if (!isOwner) return;
    try {
      const updated = await patchMyPortfolio(updates);
      setPortfolioData((prev) => (prev ? { ...prev, ...updated } : updated));
      toast({ title: "Portfólio atualizado" });
    } catch (e: any) {
      toast({
        title: "Erro ao atualizar portfólio",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const handleAddVideo = async (video: any) => {
    if (!isOwner) return;
    try {
      const created = await createVideo({
        title: video.title,
        url: video.url,
        description: video.description,
        tags: video.tags ?? [],
        author: myEditorId,
      });
      setPortfolioData((prev) =>
        prev ? { ...prev, videos: [created, ...prev.videos] } : prev
      );
      toast({ title: "Vídeo adicionado" });
    } catch (e: any) {
      toast({
        title: "Erro ao adicionar vídeo",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateVideo = async (videoId: number, updates: any) => {
    if (!isOwner) return;
    try {
      const updated = await updateVideoApi(videoId, {
        title: updates.title,
        description: updates.description,
        tags: updates.tags,
      });
      setPortfolioData((prev) =>
        prev
          ? {
              ...prev,
              videos: prev.videos.map((v) =>
                v.id === videoId ? { ...v, ...updated } : v
              ),
            }
          : prev
      );
      toast({ title: "Vídeo atualizado" });
    } catch (e: any) {
      toast({
        title: "Erro ao atualizar vídeo",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!isOwner) return;
    try {
      await deleteVideoApi(videoId);
      setPortfolioData((prev) =>
        prev ? { ...prev, videos: prev.videos.filter((v) => v.id !== videoId) } : prev
      );
      toast({ title: "Vídeo removido" });
    } catch (e: any) {
      toast({
        title: "Erro ao remover vídeo",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const handleAddRecommendation = async (rec: { comment: string }) => {
    if (!portfolioData) return;
    if (isOwner) {
      toast({
        title: "Você não pode avaliar seu próprio portfólio",
        variant: "destructive",
      });
      return;
    }

    try {
      const created: any = await createRecommendation({
        portfolio: portfolioData.id,
        comment: rec.comment,
      });

      const safeCreated = {
        ...created,
        author: created?.author ?? currentUserId,
        created_at: created?.created_at ?? new Date().toISOString(),
        updated_at:
          created?.updated_at ?? created?.created_at ?? new Date().toISOString(),
      };

      setPortfolioData((prev) =>
        prev
          ? {
              ...prev,
              recommendation_posts: [...prev.recommendation_posts, safeCreated],
            }
          : prev
      );

      toast({ title: "Recomendação enviada" });
    } catch (e: any) {
      toast({
        title: "Erro ao enviar recomendação",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecommendation = async (recId: number) => {
    if (!portfolioData) return;
    try {
      await deleteRecommendationApi(recId);
      setPortfolioData((prev) =>
        prev
          ? {
              ...prev,
              recommendation_posts: prev.recommendation_posts.filter((r) => r.id !== recId),
            }
          : prev
      );
      toast({ title: "Recomendação removida" });
    } catch (e: any) {
      toast({
        title: "Erro ao remover recomendação",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateRecommendation = async (recId: number, comment: string) => {
    try {
      await updateRecommendationApi(recId, { comment });
      setPortfolioData((prev) =>
        prev
          ? {
              ...prev,
              recommendation_posts: prev.recommendation_posts.map((r) =>
                r.id === recId
                  ? { ...r, comment, updated_at: new Date().toISOString() }
                  : r
              ),
            }
          : prev
      );
    } catch (e: any) {
      toast({
        title: "Erro ao atualizar recomendação",
        description: e?.message,
        variant: "destructive",
      });
      throw e;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        {error && (
          <div className="w-[80%] mx-auto px-4">
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          </div>
        )}

        {bannerData && portfolioData && (
          <BannerProfile
            data={bannerData}
            isOwner={isOwner}
            editorId={portfolioData.editor}
            onUpdate={handleUpdatePortfolio}
          />
        )}

        <div className="w-[80%] mx-auto px-4 py-8 space-y-12">
          {isLoading || !portfolioData ? (
            <VideoListSkeleton />
          ) : (
            <>
              {/* ===== VIDEOS ===== */}
              <VideoList
                videos={portfolioData.videos}
                isOwner={isOwner}
                onAddVideo={handleAddVideo}
                onUpdateVideo={handleUpdateVideo}
                onDeleteVideo={handleDeleteVideo}
              />

              {portfolioData.videos.length === 0 && (
                <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm text-muted-foreground flex items-start gap-3">
                  <p>Este editor ainda não publicou vídeos em seu portfólio.</p>
                </div>
              )}

              {/* ===== RECOMENDAÇÕES ===== */}
              <RecommendationList
                recommendations={uiRecommendations}
                isLoggedIn={isLoggedIn}
                isOwner={isOwner}
                currentUserId={myEditorId ?? undefined}
                onAddRecommendation={handleAddRecommendation}
                onDeleteRecommendation={handleDeleteRecommendation}
                onUpdateRecommendation={handleUpdateRecommendation}
              />

              {uiRecommendations.length === 0 && (
                <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm text-muted-foreground flex items-start gap-3">
                  <p>Este editor ainda não recebeu recomendações.</p>
                </div>
              )}

              {/* ===== VAGAS CANDIDATAS ===== */}
              {isOwner && (
                <div className="container mx-auto px-0">
                  {appliedLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Carregando vagas candidatas...
                    </p>
                  ) : appliedJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-gray">
                      Você ainda não se candidatou a nenhuma vaga.
                    </p>
                  ) : (
                    <JobsList
                      title="Vagas candidatas"
                      jobs={appliedJobs}
                      isOwner={false}
                      onAddJob={() => {}}
                      onUpdateJob={() => {}}
                      onDeleteJob={() => {}}
                      viewerIsEditor={true}
                      hideMeetContractorButton={false}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PortfolioPage;
