import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Briefcase,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Monitor,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import ConfirmDeleteModal from "@/components/portfolio/ConfirmDeleteModal";
import JobDetailModal from "@/components/jobs/JobDetailModal";
import AddJobModal from "./AddJobModal";
import EditJobModal from "./EditJobModal";

import type { ContractorJobApi } from "@/types/ContractorPortolio";

interface JobsListProps {
  title?: string;
  jobs: ContractorJobApi[];
  isOwner: boolean;
  onAddJob: (job: ContractorJobApi) => void;
  onUpdateJob: (jobId: number, updates: any) => void;
  onDeleteJob: (jobId: number) => void;

  /**
   * ✅ NOVO (opcional):
   * passe true quando quem está vendo essa lista é um EDITOR logado.
   * Ex.: no Portfolio do Editor e quando um Editor visita Portfolio do Contratante.
   */
  viewerIsEditor?: boolean;

  /**
   * ✅ NOVO (opcional):
   * passe true dentro do Portfolio do Contratante
   * pra esconder "Conhecer contratante" no modal.
   */
  hideMeetContractorButton?: boolean;
}

const JobsList = ({
  title = "",
  jobs,
  isOwner,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  viewerIsEditor = false,
  hideMeetContractorButton = false,
}: JobsListProps) => {
  const { toast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ContractorJobApi | null>(null);
  const [viewingJob, setViewingJob] = useState<ContractorJobApi | null>(null);

  // ✅ só mostra editar/excluir na vaga em hover
  const [hoveredJobId, setHoveredJobId] = useState<number | null>(null);

  // excluir
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  // carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const useCarousel = jobs.length > 3;

  useEffect(() => {
    if (useCarousel && carouselRef.current) updateScrollButtons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, useCarousel]);

  const updateScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;

    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });

    setTimeout(updateScrollButtons, 300);
  };

  const handleDeleteJob = () => {
    if (!deletingJobId) return;

    onDeleteJob(deletingJobId);
    setDeletingJobId(null);

    toast({
      title: "Vaga excluída",
      description: "A vaga foi removida com sucesso.",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      FREELANCE: "Freelance",
      FIXED: "Fixo",
      HOURLY: "Por hora",
      PJ: "PJ",
      CLT: "CLT",
      TEMP: "Temporário",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getWorkModeLabel = (mode: string) => {
    const labels = {
      REMOTE: "Remoto",
      HYBRID: "Híbrido",
      ONSITE: "Presencial",
    };
    return labels[mode as keyof typeof labels] || mode;
  };

  /**
   * ✅ Compat:
   * se teu JobDetailModal ainda estiver tipado com Job(mock),
   * ele espera contractor_id. Aqui garantimos esse campo.
   * Depois que você ajustar o JobDetailModal pra aceitar ContractorJobApi,
   * pode remover isso e passar job direto.
   */
  const normalizeForModal = (job: ContractorJobApi) =>
    ({
      ...job,
      contractor_id: (job as any).contractor_id ?? job.contractor,
      contractor_name: (job as any).contractor_name ?? "",
      contractor_avatar: (job as any).contractor_avatar ?? null,
    } as any);

  return (
    <TooltipProvider>
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>

          {isOwner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicionar vaga</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {useCarousel ? (
          <div className="relative">
            {canScrollLeft && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 hover:bg-background shadow-lg"
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
              onScroll={updateScrollButtons}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start"
                >
                  <Card
                    className="hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative h-full cursor-pointer"
                    onClick={() => setViewingJob(job)}
                    onMouseEnter={() => setHoveredJobId(job.id)}
                    onMouseLeave={() => setHoveredJobId(null)}
                  >
                    {/* ações do dono (somente na vaga em hover) */}
                    {isOwner && hoveredJobId === job.id && (
                      <div className="absolute top-3 right-3 z-10 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingJob(job);
                          }}
                          className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                          aria-label="Editar vaga"
                          title="Editar vaga"
                        >
                          <Pencil className="h-4 w-4 text-white" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingJobId(job.id);
                          }}
                          className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                          aria-label="Excluir vaga"
                          title="Excluir vaga"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    )}

                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                        {job.title}
                      </h3>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <span>{getTypeLabel(job.type)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Monitor className="h-4 w-4 text-primary" />
                          <span>{getWorkModeLabel(job.work_mode)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{job.location || "Não informado"}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <p className="text-lg font-semibold text-primary">
                          {job.payment_display || "Pagamento não informado"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(job.tags || []).slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                        {job.applications_count} candidatura
                        {job.applications_count !== 1 ? "s" : ""}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {canScrollRight && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 hover:bg-background shadow-lg"
                onClick={() => scroll("right")}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative cursor-pointer"
                onClick={() => setViewingJob(job)}
                onMouseEnter={() => setHoveredJobId(job.id)}
                onMouseLeave={() => setHoveredJobId(null)}
              >
                {/* ações do dono (somente na vaga em hover) */}
                {isOwner && hoveredJobId === job.id && (
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingJob(job);
                      }}
                      className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                      aria-label="Editar vaga"
                      title="Editar vaga"
                    >
                      <Pencil className="h-4 w-4 text-white" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingJobId(job.id);
                      }}
                      className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                      aria-label="Excluir vaga"
                      title="Excluir vaga"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}

                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                    {job.title}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>{getTypeLabel(job.type)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Monitor className="h-4 w-4 text-primary" />
                      <span>{getWorkModeLabel(job.work_mode)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{job.location || "Não informado"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-lg font-semibold text-primary">
                      {job.payment_display || "Pagamento não informado"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(job.tags || []).slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                    {job.applications_count} candidatura
                    {job.applications_count !== 1 ? "s" : ""}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddJobModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onAddJob={onAddJob}
        />

        {editingJob && (
          <EditJobModal
            open={true}
            onOpenChange={(open) => !open && setEditingJob(null)}
            job={editingJob}
            onSave={onUpdateJob}
          />
        )}

        <ConfirmDeleteModal
          open={deletingJobId !== null}
          onOpenChange={(open) => !open && setDeletingJobId(null)}
          onConfirm={handleDeleteJob}
          title="Tem certeza que deseja excluir esta vaga?"
          description="Esta ação não pode ser desfeita. A vaga será permanentemente removida."
        />

        <JobDetailModal
          job={viewingJob ? normalizeForModal(viewingJob) : null}
          open={viewingJob !== null}
          onOpenChange={(open) => !open && setViewingJob(null)}
          isEditor={viewerIsEditor}                  // ✅ agora editor vê botão
          isOwner={isOwner}
          hideMeetContractorButton={hideMeetContractorButton} // ✅ controla "Conhecer contratante"
        />
      </section>
    </TooltipProvider>
  );
};

export default JobsList;
