// src/components/VideoCard.tsx
import {
  useState,
  type KeyboardEvent,
} from "react";
import type { Video } from "@/types/Video";
import { isVerticalVideo, youtubeId, youtubeThumb } from "@/lib/youtube";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAccountPublic } from "@/hooks/useAccountPublic";
import "../index.css";

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  // quando true, o hover libera o preview (autoplay, muted, loop)
  autoplayPreview?: boolean;
}

const VideoCard = ({
  video,
  onClick,
  autoplayPreview = false,
}: VideoCardProps) => {
  const isVertical = isVerticalVideo(video.url);
  const id = youtubeId(video.url);
  const thumb = youtubeThumb(video.url);

  // 🔎 pega dados públicos do autor pelo ID (video.author)
  const { data: account } = useAccountPublic(video.author);

  const authorName =
    account?.nick?.trim() ||
    account?.full_name?.trim() ||
    "Editor";

  const authorPhoto = account?.profile_photo_url ?? undefined;

  const initials = authorName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // URL base do preview
  const basePreviewEmbedUrl =
    id && autoplayPreview
      ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${id}&end=60`
      : null;

  // 👇 controla se o mouse está sobre o card
  const [isHovered, setIsHovered] = useState(false);

  // só toca se:
  // - tiver Olhadinha ligada (autoplayPreview === true)
  // - tiver URL de preview
  // - o mouse estiver sobre o card
  const shouldAutoplayIframe = Boolean(
    basePreviewEmbedUrl && autoplayPreview && isHovered
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-card cursor-pointer transition-transform duration-200 hover:-translate-y-1 ${
        isVertical ? "video-card-vertical" : "video-card-horizontal"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* conteúdo ocupa 100% da célula da grid */}
      <div className="relative w-full h-full">
        {shouldAutoplayIframe ? (
          <iframe
            src={basePreviewEmbedUrl!}
            title={video.title}
            className="w-full h-full object-cover pointer-events-none"
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted">
            {thumb && (
              <img
                src={thumb}
                alt={video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* gradiente por cima do vídeo/capa */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* infos do editor + título */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-white/40 shadow-md">
            <AvatarImage src={authorPhoto} alt={authorName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <p className="text-xs text-white/80">{authorName}</p>
            <h3 className="text-sm font-semibold text-white line-clamp-2">
              {video.title}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
