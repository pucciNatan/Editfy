// src/pages/ContractorPortfolio.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ContractorBanner from "@/components/contractor/ContractorBanner";
import JobsList from "@/components/contractor/JobsList";
import JobsListSkeleton from "@/components/contractor/JobsListSkeleton";
import { useAuth } from "@/contexts/AuthContext"; 
import {
  getContractorPortfolio,
  getMyContractorPortfolio,
  patchMyContractorPortfolio,
  uploadContractorBanner
} from "@/services/contractorPortfolio";

import { toUIContractorPortfolio } from "@/adapters/contractorPortfolioAdapter";
import type { ContractorJobApi } from "@/types/ContractorPortolio";

import { updateJob, deleteJob } from "@/services/job";

type UIContractorPortfolio = {
  id: number; // id do PORTFÓLIO
  contractorId: number; // id do CONTRATANTE (dono)
  contractor_name: string;
  profile_picture: string;
  banner: string | null;
  language: string;
  price_display: string;
  categories: string[];
  tags: string[];
  biography: string;
  jobs: ContractorJobApi[]; // ✅ agora bate com JobsList
};

const ContractorPortfolio = () => {
  const { id } = useParams<{ id: string }>();
  const [portfolioData, setPortfolioData] =
    useState<UIContractorPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Dono real do portfólio
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const contractorId = Number(id);
        const apiData = await getContractorPortfolio(contractorId);

        const ui = toUIContractorPortfolio(apiData);
        if (mounted) setPortfolioData(ui);

        // Descobre se o usuário autenticado é o dono
        try {
          const self = await getMyContractorPortfolio();
          if (mounted)
            setIsOwner(Boolean(self && self.contractor === ui.contractorId));
        } catch {
          if (mounted) setIsOwner(false);
        }
      } catch (e) {
        console.error("Erro ao carregar portfólio do contratante:", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // helper: garante string decimal com 2 casas, ou null
  function toStr2(v: unknown): string | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    if (!isFinite(n)) return null;
    return n.toFixed(2);
  }

  // Salvar/patch no portfólio do contratante autenticado
  const handleUpdatePortfolio = async (
    updates: Partial<UIContractorPortfolio> & {
      min_price?: any;
      max_price?: any;
      fixed_price?: any;
    }
  ) => {
    if (!portfolioData) return;

    try {
      const payload: any = {
        banner: updates.banner ?? portfolioData.banner,
        biography: updates.biography ?? portfolioData.biography,
        language: updates.language ?? portfolioData.language,
        categories: updates.categories ?? portfolioData.categories,
        tags: updates.tags ?? portfolioData.tags,
      };

      if ("min_price" in updates) payload.min_price = toStr2(updates.min_price);
      if ("max_price" in updates) payload.max_price = toStr2(updates.max_price);
      if ("fixed_price" in updates)
        payload.fixed_price = toStr2(updates.fixed_price);

      await patchMyContractorPortfolio(payload);

      const refreshed = toUIContractorPortfolio(
        await getContractorPortfolio(portfolioData.contractorId)
      );
      setPortfolioData(refreshed);
    } catch (e) {
      console.error("Erro ao salvar portfólio do contratante:", e);
    }
  };

  /**
   * ✅ IMPORTANTE:
   * AddJobModal já chama createJob por dentro e devolve a vaga criada aqui.
   * Então aqui só RECARREGAMOS a lista (não cria de novo).
   */
  const handleAddJob = async (_createdJob: ContractorJobApi) => {
    if (!portfolioData) return;
    try {
      const refreshed = toUIContractorPortfolio(
        await getContractorPortfolio(portfolioData.contractorId)
      );
      setPortfolioData(refreshed);
    } catch (e) {
      console.error("Erro ao recarregar vagas após criar:", e);
    }
  };

  // Editar vaga existente (ícone ✎)
  const handleUpdateJob = async (jobId: number, updates: any) => {
    if (!portfolioData) return;
    try {
      await updateJob(jobId, updates);
      const refreshed = toUIContractorPortfolio(
        await getContractorPortfolio(portfolioData.contractorId)
      );
      setPortfolioData(refreshed);
    } catch (e) {
      console.error("Erro ao atualizar vaga:", e);
    }
  };

  // Excluir vaga (ícone 🗑)
  const handleDeleteJob = async (jobId: number) => {
    if (!portfolioData) return;
    try {
      await deleteJob(jobId);
      const refreshed = toUIContractorPortfolio(
        await getContractorPortfolio(portfolioData.contractorId)
      );
      setPortfolioData(refreshed);
    } catch (e) {
      console.error("Erro ao excluir vaga:", e);
    }
  };

  const handleUploadBanner = async (file: File) => {
    if (!portfolioData) return;
    try {
      const resp = await uploadContractorBanner(file);

      // atualiza o estado local para refletir o novo banner
      setPortfolioData({
        ...portfolioData,
        banner: resp.banner,
      });
    } catch (e) {
      console.error("Erro ao fazer upload do banner:", e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {isLoading || !portfolioData ? (
          <JobsListSkeleton />
        ) : (
          <>
            <ContractorBanner
              data={{
                contractor_name: portfolioData.contractor_name,
                profile_picture: portfolioData.profile_picture,
                banner: portfolioData.banner ?? "",
                language: portfolioData.language,
                price_display: portfolioData.price_display,
                categories: portfolioData.categories,
                tags: portfolioData.tags,
                biography: portfolioData.biography,
              }}
              isOwner={isOwner}
              contractorId={portfolioData.contractorId}
              onUpdate={handleUpdatePortfolio}
              onBannerUpload={handleUploadBanner} 
            />

            <div className="container mx-auto px-4 py-8">
              <JobsList
                title="Vagas publicadas"
                jobs={portfolioData.jobs}
                isOwner={isOwner}
                onAddJob={handleAddJob}
                onUpdateJob={handleUpdateJob}
                onDeleteJob={handleDeleteJob}
                viewerIsEditor={user?.role === "EDITOR"}
                hideMeetContractorButton={true}  
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ContractorPortfolio;
