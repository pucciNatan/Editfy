// src/components/portfolio/EditProfileModal.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { httpGet } from "@/api/http";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    languages: string[];
    language?: string | null;
    price_display: string;
    biography: string;
    tags: string[];
    categories: string[];
    fixed_price?: string | null;
    min_price?: string | null;
    max_price?: string | null;
  };
  onSave: (updates: any) => void;
}

type PricingMode = "fixed" | "range";

function toDecimalString(br: string): string | null {
  if (!br || !br.trim()) return null;
  const cleaned = br.replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!isFinite(n)) return null;
  return n.toFixed(2);
}
function toBR(value: string | null | undefined): string {
  if (!value) return "";
  const n = Number(value);
  if (!isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EditProfileModal({ open, onOpenChange, data, onSave }: EditProfileModalProps) {
  const { toast } = useToast();

  // categorias meta
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [maxCategories, setMaxCategories] = useState<number>(3);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // idioma
  const [language, setLanguage] = useState<string>(data.language ?? data.languages?.[0] ?? "pt-BR");

  // preço
  const hasFixed = Boolean(data.fixed_price);
  const hasRange = Boolean(data.min_price && data.max_price);
  const [pricingMode, setPricingMode] = useState<PricingMode>(hasFixed ? "fixed" : hasRange ? "range" : "fixed");
  const [fixed, setFixed] = useState<string>(toBR(data.fixed_price));
  const [minV, setMinV] = useState<string>(toBR(data.min_price));
  const [maxV, setMaxV] = useState<string>(toBR(data.max_price));

  // bio/tags/categorias
  const [biography, setBiography] = useState<string>(data.biography ?? "");
  const [tagsInput, setTagsInput] = useState<string>(data.tags.join(", "));
  const [categories, setCategories] = useState<string[]>(data.categories ?? []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingMeta(true);
        const meta = await httpGet<{ choices: string[]; max_per_portfolio: number }>("/api/meta/categories/");
        setAvailableCategories(meta.choices || []);
        setMaxCategories(meta.max_per_portfolio ?? 3);
      } catch {
      } finally {
        setLoadingMeta(false);
      }
    })();

    setLanguage(data.language ?? data.languages?.[0] ?? "pt-BR");

    const hasFixedNow = Boolean(data.fixed_price);
    const hasRangeNow = Boolean(data.min_price && data.max_price);
    setPricingMode(hasFixedNow ? "fixed" : hasRangeNow ? "range" : "fixed");

    setFixed(toBR(data.fixed_price));
    setMinV(toBR(data.min_price));
    setMaxV(toBR(data.max_price));

    setBiography(data.biography ?? "");
    setTagsInput(data.tags.join(", "));
    setCategories(data.categories ?? []);
  }, [open, data]);

  const toggleCategory = (category: string) => {
    setCategories((prev) => {
      const isSelected = prev.includes(category);
      if (isSelected) return prev.filter((c) => c !== category);
      if (prev.length >= maxCategories) {
        toast({ title: "Limite atingido", description: `Máximo de ${maxCategories} categorias.`, variant: "destructive" });
        return prev;
      }
      return [...prev, category];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      biography,
      language,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      categories,
    };

    if (pricingMode === "fixed") {
      const fp = toDecimalString(fixed);
      if (fp) {
        payload.fixed_price = fp;
        payload.min_price = null;
        payload.max_price = null;
      } else if (!data.fixed_price && !(data.min_price && data.max_price)) {
        toast({ title: "Defina um preço", description: "Informe um valor fixo ou uma faixa.", variant: "destructive" });
        return;
      }
    } else {
      const mn = toDecimalString(minV);
      const mx = toDecimalString(maxV);
      if (mn && mx) {
        payload.fixed_price = null;
        payload.min_price = mn;
        payload.max_price = mx;
      } else if (!(data.min_price && data.max_price) && !data.fixed_price) {
        toast({ title: "Defina a faixa de preço", description: "Informe mínimo e máximo.", variant: "destructive" });
        return;
      }
    }

    onSave(payload);
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

        {/* Conteúdo rolável com scrollbar customizado */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          <form id="edit-profile-form" onSubmit={handleSubmit} className="p-4 space-y-5">
            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="pt-BR" />
            </div>

            {/* Preço */}
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
                  <p className="text-xs text-muted-foreground">Atual: {data.price_display || "—"}</p>
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
                  <p className="text-xs text-muted-foreground md:col-span-2">Atual: {data.price_display || "—"}</p>
                </div>
              )}
            </div>

            {/* Biografia */}
            <div className="space-y-2">
              <Label htmlFor="biography">Biografia</Label>
              <Textarea id="biography" value={biography} onChange={(e) => setBiography(e.target.value)} rows={4} />
            </div>

            {/* Categorias */}
            <div className="space-y-2">
              <Label>Categorias (máximo {maxCategories})</Label>
              {loadingMeta ? (
                <div className="text-sm text-muted-foreground">Carregando categorias…</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => {
                    const selected = categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          selected ? "bg-primary text-white" : "bg-muted text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {categories.length} de {maxCategories} selecionadas
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (internas)</Label>
              <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="reels, shorts, dinâmico" />
            </div>
          </form>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-profile-form">
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
