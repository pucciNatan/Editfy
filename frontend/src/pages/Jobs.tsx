import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/jobs/JobCard";
import JobCardSkeleton from "@/components/jobs/JobCardSkeleton";
import JobDetailModal from "@/components/jobs/JobDetailModal";
import type { Job } from "@/lib/mockJobsData";
import { Briefcase } from "lucide-react";
import { fetchJobs } from "@/services/job";
import { toJobsUI } from "@/adapters/jobAdapter";

const Jobs = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // TODO: conectar ao auth/role real
  const isEditor = true;

  // ✅ Atualiza a vaga tanto na lista quanto no modal
  const handleJobUpdated = (jobId: number, updates: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );

    setSelectedJob((prev) =>
      prev && prev.id === jobId ? { ...prev, ...updates } : prev
    );
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const api = await fetchJobs();
        const ui = toJobsUI(api);
        if (mounted) setJobs(ui);
      } catch (e) {
        console.error("Erro ao carregar vagas", e);
        if (mounted) setErrorMsg("Não foi possível carregar as vagas agora.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Compatível com snake_case e camelCase (caso seu tipo ainda não tenha atualizado)
  const hasApplied =
    !!(selectedJob as any)?.has_applied ||
    !!(selectedJob as any)?.hasApplied;

  const myApplicationId =
    (selectedJob as any)?.my_application_id ??
    (selectedJob as any)?.myApplicationId ??
    null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Vagas abertas</h1>
        </div>

        {/* Estados */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && errorMsg && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        {!isLoading && !errorMsg && jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma vaga encontrada.
          </p>
        )}

        {!isLoading && !errorMsg && jobs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => setSelectedJob(job)}
              />
            ))}
          </div>
        )}
      </main>

      <JobDetailModal
        job={selectedJob}
        open={selectedJob !== null}
        onOpenChange={(open) => !open && setSelectedJob(null)}
        isEditor={isEditor}
        hasApplied={hasApplied}
        myApplicationId={myApplicationId}
        onJobUpdated={handleJobUpdated}
      />
    </div>
  );
};

export default Jobs;
