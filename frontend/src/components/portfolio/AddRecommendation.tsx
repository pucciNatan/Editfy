import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AddRecommendationProps {
  onAddRecommendation: (recommendation: any) => void;
}

const AddRecommendation = ({ onAddRecommendation }: AddRecommendationProps) => {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast({
        title: "Campo vazio",
        description: "Por favor, escreva um comentário antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Mock API call
    const newRecommendation = {
      id: Date.now(),
      author_name: "Você", // Mockado - deveria vir do usuário logado
      comment: comment,
      created_at: new Date().toISOString()
    };

    // Simulação de chamada à API
    console.log("POST http://localhost:8000/api/recommendations/", {
      portfolio: 2, // Mock portfolio ID
      comment: comment
    });

    // Simula delay de API
    setTimeout(() => {
      onAddRecommendation(newRecommendation);
      
      toast({
        title: "Recomendação enviada!",
        description: "Sua recomendação foi publicada com sucesso.",
      });

      setComment("");
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Deixe sua recomendação</h4>
          <Textarea
            placeholder="Escreva um comentário sobre o trabalho do editor..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar recomendação"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddRecommendation;
