import type { Video } from "@/types/Video";
import { getVideoEmbedUrl } from "@/lib/youtube";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import UserBadge from "@/components/shared/userBadge";

interface VideoModalProps {
  video: (Video & { authorName?: string; authorPhoto?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoModal = ({ video, isOpen, onClose }: VideoModalProps) => {
  if (!video) return null;

  const embedUrl = getVideoEmbedUrl(video.url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* ✅ Acessibilidade: precisa existir um DialogTitle */}
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>{video.title}</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>

        {/* Title + Description visuais */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{video.title}</h2>
          <p className="text-sm text-muted-foreground">{video.description}</p>
        </div>

        {/* Video Embed */}
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="90%"
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* ✅ Autor (nick + avatar via rota /api/accounts/:id/) */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <UserBadge accountId={video.author} />
          </div>

          <Link to={`/portfolio/${video.author}`}>
            <Button variant="outline" size="sm">
              Conhecer editor
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
