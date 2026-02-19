// src/components/portfolio/RecommendationList.tsx
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Trash2, Pencil, Check, X } from "lucide-react";
import AddRecommendation from "./AddRecommendation";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAccountPublic } from "@/hooks/useAccountPublic"; // ✅ para pegar nick/foto
import { authStorage } from "@/lib/authStorage";            // ✅ NOVO
import { getUserIdFromAccess } from "@/lib/jwt";            // ✅ NOVO

export interface UIRecommendation {
  id: number;
  author_id: number;       // ID público do autor
  author_name: string;     // fallback (apenas caso a conta não carregue)
  comment: string;
  created_at: string;
}

interface RecommendationListProps {
  recommendations: UIRecommendation[];
  isLoggedIn: boolean;
  isOwner: boolean; // dono do portfólio
  currentUserId?: number | null; // opcional, pode vir de fora
  onAddRecommendation: (recommendation: { comment: string }) => void;
  onDeleteRecommendation: (id: number) => void;
  onUpdateRecommendation?: (id: number, comment: string) => void;
}

type RecommendationItemProps = {
  rec: UIRecommendation;
  dateLabel: string;
  isEditing: boolean;
  editingText: string;
  authorCanEdit: boolean;
  authorCanDelete: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeText: (v: string) => void;
  onSaveEdit: () => void;
  onRequestDelete: () => void;
};

/** Item isolado para poder usar hooks por-recomendação */
function RecommendationItem({
  rec,
  dateLabel,
  isEditing,
  editingText,
  authorCanEdit,
  authorCanDelete,
  onStartEdit,
  onCancelEdit,
  onChangeText,
  onSaveEdit,
  onRequestDelete,
}: RecommendationItemProps) {
  const { data: authorAcc } = useAccountPublic(rec.author_id);
  const authorName = authorAcc?.nick || authorAcc?.full_name || rec.author_name;
  const authorPhoto = authorAcc?.profile_photo_url || undefined;

  return (
    <Card className="hover:border-primary/30 transition-colors group relative">
      <CardContent className="p-6">
        {/* Ações (aparecem no hover do card) */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {authorCanEdit && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full"
              aria-label="Editar recomendação"
            >
              <Pencil className="h-4 w-4 text-white" />
            </button>
          )}
          {authorCanDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete();
              }}
              className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full"
              aria-label="Excluir recomendação"
            >
              <Trash2 className="h-4 w-4 text-white" />
            </button>
          )}
        </div>

        <div className="flex gap-4">
          {/* FOTO à esquerda */}
          <div className="pt-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={authorPhoto} alt={authorName} />
              <AvatarFallback>
                {(authorName || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 space-y-2">
            {/* NOME + data */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{authorName}</h4>
              <span className="text-xs text-muted-foreground">
                {dateLabel}
              </span>
            </div>

            {!isEditing ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {rec.comment}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full text-sm p-2 rounded-md border bg-background"
                  rows={3}
                  value={editingText}
                  onChange={(e) => onChangeText(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={onSaveEdit}>
                    <Check className="h-4 w-4 mr-1" /> Salvar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const RecommendationList = ({
  recommendations,
  isLoggedIn,
  isOwner,
  currentUserId,
  onAddRecommendation,
  onDeleteRecommendation,
  onUpdateRecommendation,
}: RecommendationListProps) => {
  const { toast } = useToast();
  const [deletingRecId, setDeletingRecId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  // ✅ ID efetivo do usuário logado (vem do prop, window ou JWT)
  const effectiveCurrentUserId = useMemo<number | null>(() => {
    if (currentUserId != null) return currentUserId;

    const fromWindow = (window as any).__CURRENT_USER_ID__;
    if (fromWindow) return Number(fromWindow);

    const uid = getUserIdFromAccess(authStorage.getAccess());
    return uid ? Number(uid) : null;
  }, [currentUserId]);

  const canUserEdit = (rec: UIRecommendation) =>
    !!effectiveCurrentUserId &&
    Number(rec.author_id) === Number(effectiveCurrentUserId);

  const canUserDelete = (rec: UIRecommendation) =>
    isOwner || canUserEdit(rec);

  const startEdit = (rec: UIRecommendation) => {
    setEditingId(rec.id);
    setEditingText(rec.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (id: number) => {
    if (!onUpdateRecommendation) return;
    try {
      await onUpdateRecommendation(id, editingText.trim());
      toast({ title: "Recomendação atualizada" });
      cancelEdit();
    } catch (e: any) {
      toast({
        title: "Erro ao atualizar",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <section>
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Recomendações</h2>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => {
            const d =
              typeof rec.created_at === "string"
                ? parseISO(rec.created_at)
                : new Date(rec.created_at);
            const dateLabel = isValid(d)
              ? format(d, "dd/MM/yyyy", { locale: ptBR })
              : "agora";
            const isEditing = editingId === rec.id;

            return (
              <RecommendationItem
                key={rec.id}
                rec={rec}
                dateLabel={dateLabel}
                isEditing={isEditing}
                editingText={isEditing ? editingText : rec.comment}
                authorCanEdit={canUserEdit(rec)}
                authorCanDelete={canUserDelete(rec)}
                onStartEdit={() => startEdit(rec)}
                onCancelEdit={cancelEdit}
                onChangeText={setEditingText}
                onSaveEdit={() => saveEdit(rec.id)}
                onRequestDelete={() => setDeletingRecId(rec.id)}
              />
            );
          })}

          {/* Só visitante logado pode adicionar recomendação pro dono do portfólio */}
          {isLoggedIn && !isOwner && (
            <AddRecommendation onAddRecommendation={onAddRecommendation} />
          )}
        </div>

        <ConfirmDeleteModal
          open={deletingRecId !== null}
          onOpenChange={(open) => !open && setDeletingRecId(null)}
          onConfirm={() => {
            if (deletingRecId) onDeleteRecommendation(deletingRecId);
            setDeletingRecId(null);
          }}
          title="Deseja realmente excluir esta recomendação?"
          description="Esta ação não pode ser desfeita."
        />
      </section>
    </TooltipProvider>
  );
};

export default RecommendationList;
