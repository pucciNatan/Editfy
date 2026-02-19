import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Briefcase,
  Monitor,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import UserBadge from "@/components/shared/userBadge";
import { getVideoEmbedUrl } from "@/lib/mockData";

// tipos
import type { Job as MockJob } from "@/lib/mockJobsData";
import type { ContractorJobApi } from "@/types/ContractorPortolio";

import {
  applyToJob,
  deleteJobApplication,
  fetchJobApplications,
} from "@/services/job";

import type { JobApplicationApi } from "@/services/job";

type JobModalData = MockJob | ContractorJobApi;

interface JobDetailModalProps {
  job: JobModalData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** se o usuário logado é editor (pode se candidatar) */
  isEditor?: boolean;
  /** se já está inscrito na vaga (vindo do backend) */
  hasApplied?: boolean;
  /** se o usuário logado é o contratante dono da vaga */
  isOwner?: boolean;
  /** id da candidatura do usuário logado, se existir */
  myApplicationId?: number | null;
  /** callback pra atualizar vaga no pai */
  onJobUpdated?: (jobId: number, updates: Partial<MockJob>) => void;

  /** esconde "Conhecer contratante" quando já está no portfolio do contratante */
  hideMeetContractorButton?: boolean;
}

const JobDetailModal = ({
  job,
  open,
  onOpenChange,
  isEditor = false,
  hasApplied = false,
  isOwner = false,
  myApplicationId = null,
  onJobUpdated,
  hideMeetContractorButton = false,
}: JobDetailModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const applicationsCountBase =
    (job as any)?.applications_count ??
    (job as any)?.applicationsCount ??
    0;

  const derivedHasApplied = useMemo(() => {
    return (
      hasApplied ||
      !!(job as any)?.has_applied ||
      !!(job as any)?.hasApplied
    );
  }, [hasApplied, job]);

  const derivedMyApplicationId = useMemo(() => {
    return (
      myApplicationId ??
      (job as any)?.my_application_id ??
      (job as any)?.myApplicationId ??
      null
    );
  }, [myApplicationId, job]);

  const [applied, setApplied] = useState<boolean>(derivedHasApplied);
  const [applicationId, setApplicationId] = useState<number | null>(
    derivedMyApplicationId
  );
  const [applicationsCountLocal, setApplicationsCountLocal] = useState<number>(
    applicationsCountBase
  );

  const [loadingApply, setLoadingApply] = useState(false);
  const [loadingUnapply, setLoadingUnapply] = useState(false);

  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates] = useState<JobApplicationApi[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  useEffect(() => {
    setApplied(derivedHasApplied);
    setApplicationId(derivedMyApplicationId);
    setApplicationsCountLocal(applicationsCountBase);

    setShowCandidates(false);
    setCandidates([]);
    setCandidatesError(null);
  }, [
    (job as any)?.id,
    open,
    derivedHasApplied,
    derivedMyApplicationId,
    applicationsCountBase,
  ]);

  if (!job) return null;

  const contractorId =
    "contractor_id" in job ? job.contractor_id : (job as any).contractor;

  const paymentDisplay =
    (job as any).payment_display ??
    (job as any).paymentDisplay ??
    "Pagamento não informado";

  const videoUrls: string[] = (job as any).video_example_urls ?? [];

  const videoDuration =
    (job as any).video_duration ?? (job as any).videoDuration ?? null;

  const tags: string[] = (job as any).tags ?? [];

  const getTypeLabel = (type: string) => {
    const labels = {
      FREELANCE: "Freelance",
      FIXED: "Fixo",
      HOURLY: "Por hora",
      CLT: "CLT",
      PJ: "PJ",
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

  // 🚦 Regras de exibição das ações
  const canApply = isEditor && !isOwner;          // editor que NÃO é dono
  const canSeeCandidates = isOwner;               // dono sempre pode ver candidatos

  const handleApply = async () => {
    try {
      setLoadingApply(true);

      const app = await applyToJob(job.id, { note: "" });

      setApplied(true);
      setApplicationId(app.id);
      setApplicationsCountLocal((c) => c + 1);

      onJobUpdated?.(job.id, {
        has_applied: true,
        my_application_id: app.id,
        applications_count: applicationsCountBase + 1,
      } as any);

      toast({
        title: "Candidatura enviada!",
        description: "Você se candidatou para esta vaga com sucesso.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao se candidatar",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível enviar sua candidatura agora.",
        variant: "destructive",
      });
    } finally {
      setLoadingApply(false);
    }
  };

  const handleUnapply = async () => {
    if (applicationId == null) {
      setApplied(false);
      setApplicationsCountLocal((c) => Math.max(0, c - 1));

      onJobUpdated?.(job.id, {
        has_applied: false,
        my_application_id: null,
        applications_count: Math.max(0, applicationsCountBase - 1),
      } as any);

      toast({
        title: "Candidatura removida",
        description: "Você se descandidatou desta vaga.",
      });
      return;
    }

    try {
      setLoadingUnapply(true);

      await deleteJobApplication(job.id, applicationId);

      setApplied(false);
      setApplicationId(null);
      setApplicationsCountLocal((c) => Math.max(0, c - 1));

      onJobUpdated?.(job.id, {
        has_applied: false,
        my_application_id: null,
        applications_count: Math.max(0, applicationsCountBase - 1),
      } as any);

      toast({
        title: "Candidatura removida",
        description: "Você se descandidatou desta vaga.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao remover candidatura",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível remover sua candidatura agora.",
        variant: "destructive",
      });
    } finally {
      setLoadingUnapply(false);
    }
  };

  const handleToggleCandidates = async () => {
    const next = !showCandidates;
    setShowCandidates(next);
    if (!next) return;

    setLoadingCandidates(true);
    setCandidatesError(null);
    try {
      const data = await fetchJobApplications(job.id);
      setCandidates(data);
    } catch (err: any) {
      console.error(err);
      setCandidatesError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar candidatos."
      );
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleViewContractor = () => {
    navigate(`/contratante/${contractorId}`);
    onOpenChange(false);
  };

  const handleViewEditor = (editorId: number) => {
    navigate(`/portfolio/${editorId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contratante */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <UserBadge accountId={contractorId} withAvatar />
              <div className="sr-only">Contratante</div>
            </div>

            {!hideMeetContractorButton && (
              <Button
                variant="link"
                onClick={handleViewContractor}
                className="text-primary"
              >
                Conhecer contratante
              </Button>
            )}
          </div>

          {/* Informações */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{getTypeLabel(job.type)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Monitor className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Modalidade</p>
                <p className="font-medium">
                  {getWorkModeLabel((job as any).work_mode)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Localização</p>
                <p className="font-medium">
                  {(job as any).location || "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Duração dos vídeos
                </p>
                <p className="font-medium">
                  {videoDuration || "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Pagamento</p>
                <p className="font-medium text-primary">{paymentDisplay}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Candidatos</p>
                <p className="font-medium">{applicationsCountLocal}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Descrição */}
          <div>
            <h3 className="font-semibold mb-2">Descrição da vaga</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Vídeos de exemplo */}
          {videoUrls.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Vídeos de exemplo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video bg-muted rounded-lg overflow-hidden"
                  >
                    <iframe
                      src={getVideoEmbedUrl(url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de candidatos (dono) */}
          {canSeeCandidates && showCandidates && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Candidatos ({applicationsCountLocal})</span>
              </h3>

              {loadingCandidates && (
                <p className="text-sm text-muted-foreground">
                  Carregando candidatos...
                </p>
              )}

              {candidatesError && (
                <p className="text-sm text-red-600">{candidatesError}</p>
              )}

              {!loadingCandidates &&
                !candidatesError &&
                candidates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum editor se candidatou ainda.
                  </p>
                )}

              {!loadingCandidates &&
                !candidatesError &&
                candidates.length > 0 && (
                  <div className="space-y-2">
                    {candidates.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <UserBadge
                          accountId={app.editor}
                          withAvatar
                          size="sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEditor(app.editor)}
                        >
                          Conhecer editor
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Ações editor (apenas se NÃO for dono) */}
          {canApply && (
            <div className="flex gap-3 pt-4 border-t justify-end">
              {applied ? (
                <Button
                  variant="outline"
                  onClick={handleUnapply}
                  size="sm"
                  className="px-4"
                  disabled={loadingUnapply}
                >
                  Descandidatar
                </Button>
              ) : (
                <Button
                  onClick={handleApply}
                  size="sm"
                  className="px-4"
                  disabled={loadingApply}
                >
                  Candidatar-se
                </Button>
              )}
            </div>
          )}

          {/* Ações contratante dono */}
          {canSeeCandidates && (
            <div className="flex gap-3 pt-4 border-t justify-end">
              <Button
                variant="outline"
                size="sm"
                className="px-4"
                onClick={handleToggleCandidates}
                disabled={loadingCandidates}
              >
                {showCandidates ? "Ocultar candidatos" : "Ver candidatos"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailModal;
