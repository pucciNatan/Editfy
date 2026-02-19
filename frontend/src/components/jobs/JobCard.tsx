import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Briefcase, Monitor } from "lucide-react";
import UserBadge from "@/components/shared/userBadge";

// tipos
import type { Job as MockJob } from "@/lib/mockJobsData";
import type { ContractorJobApi } from "@/types/ContractorPortolio";

type JobCardData = MockJob | ContractorJobApi;

interface JobCardProps {
  job: JobCardData;
  onClick: () => void;

  /** ✅ opcional: esconde "Conhecer contratante" dependendo do contexto */
  hideMeetContractorButton?: boolean;
}

const JobCard = ({ job, onClick, hideMeetContractorButton = false }: JobCardProps) => {
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

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const days = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    return `${Math.floor(days / 30)} meses atrás`;
  };

  const contractorId =
    (job as any).contractor_id ?? (job as any).contractor;

  const paymentDisplay =
    (job as any).payment_display ?? (job as any).paymentDisplay ?? "";

  const tags: string[] = (job as any).tags ?? [];

  const createdAt = (job as any).created_at ?? new Date().toISOString();

  return (
    <Card
      className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full"
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserBadge accountId={contractorId} />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            <span>{getTimeAgo(createdAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
          {(job as any).title}
        </h3>

        {/* Job Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 text-primary" />
            <span>{getTypeLabel((job as any).type)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="h-4 w-4 text-primary" />
            <span>{getWorkModeLabel((job as any).work_mode)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{(job as any).location ?? "Não informado"}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="pt-2 border-t border-border">
          <p className="text-lg font-semibold text-primary">{paymentDisplay}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {(job as any).applications_count ?? 0} candidatura
            {(job as any).applications_count !== 1 ? "s" : ""}
          </span>

          {!hideMeetContractorButton && (
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 p-0 h-auto text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/contratante/${contractorId}`;
              }}
            >
              Conhecer contratante
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
