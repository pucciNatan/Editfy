// src/components/jobs/AddJobModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createJob } from "@/services/job";

// Helper: normaliza "R$ 1.234,56" / "1234,56" / "1234.56" -> "1234.56"
const toStr2 = (v: unknown): string | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(
    typeof v === "string"
      ? v
          .replace(/\s+/g, "")
          .replace(/^R\$/, "")
          .replace(/\./g, "")
          .replace(",", ".")
      : v
  );
  return Number.isFinite(n) ? n.toFixed(2) : null;
};

interface AddJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddJob: (job: any) => void;
}

const AddJobModal = ({ open, onOpenChange, onAddJob }: AddJobModalProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_example_urls: "",
    video_duration: "",
    type: "FREELANCE",
    work_mode: "REMOTE",
    location: "",
    tags: ""
  });

  // === Preço (design solicitado) ===
  const [pricingMode, setPricingMode] = useState<"fixed" | "range">("fixed");
  const [fixed, setFixed] = useState<string>("");
  const [minV, setMinV] = useState<string>("");
  const [maxV, setMaxV] = useState<string>("");

  const [errors, setErrors] = useState<string[]>([]);

  const validatePrice = (): string[] => {
    const errs: string[] = [];
    if (pricingMode === "fixed") {
      const fx = toStr2(fixed);
      if (!fx) errs.push("Informe o preço fixo.");
      else if (Number(fx) <= 0) errs.push("Preço fixo deve ser maior que R$ 0,00.");
    } else {
      const mi = toStr2(minV);
      const ma = toStr2(maxV);
      if (!mi || !ma) errs.push("Informe o preço mínimo e o máximo.");
      else {
        if (Number(mi) <= 0 || Number(ma) <= 0) errs.push("Mínimo e máximo devem ser maiores que R$ 0,00.");
        if (Number(mi) > Number(ma)) errs.push("O mínimo não pode ser maior que o máximo.");
      }
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }

    const priceErrors = validatePrice();
    if (priceErrors.length) {
      setErrors(priceErrors);
      return;
    }

    const payload: any = {
      title: formData.title,
      description: formData.description,
      video_example_urls: formData.video_example_urls.split(",").map(s => s.trim()).filter(Boolean),
      video_duration: formData.video_duration || null,
      type: formData.type,
      work_mode: formData.work_mode,
      location: formData.location || null,
      tags: formData.tags.split(",").map(s => s.trim()).filter(Boolean),
    };

    if (pricingMode === "fixed") {
      payload.fixed_payment = toStr2(fixed);
      payload.min_payment = null;
      payload.max_payment = null;
    } else {
      payload.fixed_payment = null;
      payload.min_payment = toStr2(minV);
      payload.max_payment = toStr2(maxV);
    }

    try {
      const created = await createJob(payload);
      onAddJob(created);
      onOpenChange(false);

      // reset
      setFormData({
        title: "",
        description: "",
        video_example_urls: "",
        video_duration: "",
        type: "FREELANCE",
        work_mode: "REMOTE",
        location: "",
        tags: ""
      });
      setPricingMode("fixed");
      setFixed("");
      setMinV("");
      setMaxV("");

      setErrors([]);
      toast({ title: "Vaga criada", description: "Sua vaga foi criada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Erro ao criar vaga.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw] max-w-[700px]
          h-[80vh] max-h-[80vh]
          p-0
          flex flex-col
        "
      >
        {/* Header fixo */}
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Criar Vaga</DialogTitle>
        </DialogHeader>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          <form id="add-job-form" className="p-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREELANCE">FREELANCE</SelectItem>
                    <SelectItem value="FIXED">FIXED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modo de trabalho</Label>
                <Select value={formData.work_mode} onValueChange={(v) => setFormData({ ...formData, work_mode: v })}>
                  <SelectTrigger><SelectValue placeholder="Modo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REMOTE">Remoto</SelectItem>
                    <SelectItem value="HYBRID">Híbrido</SelectItem>
                    <SelectItem value="ONSITE">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_duration">Duração do vídeo</Label>
              <Input id="video_duration" value={formData.video_duration} onChange={(e) => setFormData({ ...formData, video_duration: e.target.value })} placeholder='Ex.: "10-15min"' />
            </div>

            {/* Preço (design solicitado) */}
            <div className="space-y-2">
              <Label>Preço</Label>
              <div className="flex gap-2">
                <Button type="button" variant={pricingMode === "fixed" ? "default" : "outline"} onClick={() => setPricingMode("fixed")}>
                  Preço fixo
                </Button>
                <Button type="button" variant={pricingMode === "range" ? "default" : "outline"} onClick={() => setPricingMode("range")}>
                  Faixa (mín–máx)
                </Button>
              </div>

              {pricingMode === "fixed" ? (
                <div className="space-y-1">
                  <Label htmlFor="fixed">Valor fixo (ex.: 2.500,00)</Label>
                  <Input id="fixed" inputMode="decimal" placeholder="2.500,00" value={fixed} onChange={(e) => setFixed(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Atual: {"—"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="minV">Mínimo (ex.: 1.000,00)</Label>
                    <Input id="minV" inputMode="decimal" placeholder="1.000,00" value={minV} onChange={(e) => setMinV(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxV">Máximo (ex.: 3.000,00)</Label>
                    <Input id="maxV" inputMode="decimal" placeholder="3.000,00" value={maxV} onChange={(e) => setMaxV(e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground md:col-span-2">Atual: {"—"}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_example_urls">URLs de vídeos exemplo (separadas por vírgula)</Label>
              <Input id="video_example_urls" value={formData.video_example_urls} onChange={(e) => setFormData({ ...formData, video_example_urls: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
            </div>

            {errors.length > 0 && (
              <ul className="text-red-600 text-sm list-disc pl-5">
                {errors.map((er, i) => <li key={i}>{er}</li>)}
              </ul>
            )}
          </form>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="add-job-form">
            Criar Vaga
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
