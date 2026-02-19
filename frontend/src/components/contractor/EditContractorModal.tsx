// src/components/portfolio/EditContractorModal.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EditContractorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    contractor_name: string;
    language: string;
    price_display: string;
    biography: string;
    tags: string[];
    categories: string[];
  };
  onSave: (updates: any) => void;
}

const EditContractorModal = ({ open, onOpenChange, data, onSave }: EditContractorModalProps) => {
  const { toast } = useToast();

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [maxCategories, setMaxCategories] = useState(3);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [formData, setFormData] = useState({
    language: data.language,
    biography: data.biography,
    tags: data.tags.join(", "),
    categories: data.categories
  });

  const [pricingMode, setPricingMode] = useState<"fixed" | "range">(
    () => (data?.price_display?.includes("-") ? "range" : "fixed")
  );
  const [minV, setMinV] = useState<string>("");
  const [maxV, setMaxV] = useState<string>("");
  const [fixed, setFixed] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    setIsLoadingCategories(true);
    setTimeout(() => {
      setAvailableCategories([
        "games","educacao","beleza","musica","tecnologia",
        "saude","financas","esportes","vlogs","podcast",
        "culinaria","viagem","retail","telemedicina","marketing","terror"
      ]);
      setMaxCategories(3);
      setIsLoadingCategories(false);
    }, 300);

    setFormData({
      language: data.language,
      biography: data.biography,
      tags: data.tags.join(", "),
      categories: data.categories,
    });

    try {
      if (data?.price_display?.includes("-")) {
        const parts = data.price_display
          .split("-")
          .map((p) => p.replace(/[^0-9,\.]/g, "").replace(",", "."));
        setMinV(parts[0] || "");
        setMaxV(parts[1] || "");
        setPricingMode("range");
        setFixed("");
      } else if (data?.price_display) {
        const p = data.price_display.replace(/[^0-9,\.]/g, "").replace(",", ".");
        setFixed(p || "");
        setPricingMode("fixed");
        setMinV("");
        setMaxV("");
      } else {
        setMinV("");
        setMaxV("");
        setFixed("");
      }
    } catch {
      setMinV("");
      setMaxV("");
      setFixed("");
    }
  }, [open, data]);

  const toggleCategory = (category: string) => {
    setFormData((prev) => {
      const isSelected = prev.categories.includes(category);
      if (isSelected) {
        return { ...prev, categories: prev.categories.filter((c) => c !== category) };
      }
      if (prev.categories.length >= maxCategories) {
        toast({
          title: "Limite atingido",
          description: `Você pode escolher no máximo ${maxCategories} categorias.`,
          variant: "destructive",
        });
        return prev;
      }
      return { ...prev, categories: [...prev.categories, category] };
    });
  };

  const toNum = (s: string) => {
    if (!s) return null;
    const n = Number(String(s).replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.biography.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha a biografia.", variant: "destructive" });
      return;
    }
    if (formData.categories.length > maxCategories) {
      toast({ title: "Muitas categorias", description: `Máximo de ${maxCategories} categorias.`, variant: "destructive" });
      return;
    }

    let min_price: number | null = null;
    let max_price: number | null = null;
    let fixed_price: number | null = null;

    if (pricingMode === "fixed") {
      fixed_price = toNum(fixed);
    } else {
      min_price = toNum(minV);
      max_price = toNum(maxV);
    }

    const updates = {
      language: formData.language,
      biography: formData.biography,
      categories: formData.categories,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      min_price,
      max_price,
      fixed_price,
    };

    onSave(updates);
    onOpenChange(false);
    toast({ title: "Alterações salvas", description: "Seu perfil foi atualizado." });
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
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>

        {/* Conteúdo rolável com o mesmo scrollbar (custom-scroll) */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          <form id="edit-contractor-form" onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="pt-BR"
                required
              />
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label>Preço</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={pricingMode === "fixed" ? "default" : "outline"}
                  onClick={() => setPricingMode("fixed")}
                >
                  Preço fixo
                </Button>
                <Button
                  type="button"
                  variant={pricingMode === "range" ? "default" : "outline"}
                  onClick={() => setPricingMode("range")}
                >
                  Faixa (mín–máx)
                </Button>
              </div>

              {pricingMode === "fixed" ? (
                <div className="space-y-1">
                  <Label htmlFor="fixed">Valor fixo (ex.: 2.500,00)</Label>
                  <Input
                    id="fixed"
                    inputMode="decimal"
                    placeholder="2.500,00"
                    value={fixed}
                    onChange={(e) => setFixed(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Atual: {data.price_display || "—"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="minV">Mínimo (ex.: 1.000,00)</Label>
                    <Input
                      id="minV"
                      inputMode="decimal"
                      placeholder="1.000,00"
                      value={minV}
                      onChange={(e) => setMinV(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxV">Máximo (ex.: 3.000,00)</Label>
                    <Input
                      id="maxV"
                      inputMode="decimal"
                      placeholder="3.000,00"
                      value={maxV}
                      onChange={(e) => setMaxV(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground md:col-span-2">Atual: {data.price_display || "—"}</p>
                </div>
              )}
            </div>

            {/* Biografia */}
            <div className="space-y-2">
              <Label htmlFor="biography">Biografia</Label>
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Categorias */}
            <div className="space-y-2">
              <Label>Categorias (máximo {maxCategories})</Label>
              {isLoadingCategories ? (
                <div className="text-sm text-muted-foreground">Carregando categorias…</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                 {availableCategories.map((category) => {
                  const isSelected = formData.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200
                        ${isSelected
                          ? "bg-primary text-primary-foreground border-transparent ring-2 ring-primary/60 hover:bg-primary/90"
                          : "bg-muted text-foreground border border-border hover:bg-muted/80"
                        }`}
                    >
                      {category}
                    </button>
                  );
                })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.categories.length} de {maxCategories} selecionadas
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (não visíveis publicamente)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="shorts, reels, corporativo"
              />
              <p className="text-xs text-muted-foreground">
                Separadas por vírgula. Usadas apenas para organização interna.
              </p>
            </div>
          </form>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-contractor-form">
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditContractorModal;
