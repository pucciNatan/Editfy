import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Video } from "@/types/Video";

interface EditVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video;
  onSave: (
    videoId: number,
    updates: { title: string; description: string; tags: string[] }
  ) => void;
}

function normalizeTags(text: string): string[] {
  const arr = text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase());
  return Array.from(new Set(arr));
}

const EditVideoModal = ({ open, onOpenChange, video, onSave }: EditVideoModalProps) => {
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description,
    tags: (video.tags ?? []).join(", "),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // sincroniza quando abre ou o vídeo muda
  useEffect(() => {
    if (open) {
      setFormData({
        title: video.title,
        description: video.description,
        tags: (video.tags ?? []).join(", "),
      });
      setIsSubmitting(false);
    }
  }, [open, video]);

  const canSubmit = useMemo(() => {
    return Boolean(formData.title.trim() && formData.description.trim());
  }, [formData.title, formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      onSave(video.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: normalizeTags(formData.tags),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isSubmitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar vídeo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (separadas por vírgula)</Label>
            <Input
              id="edit-tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="shorts, dinamico"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVideoModal;
