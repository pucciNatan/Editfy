// src/pages/Index.tsx (ou equivalente)

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import VideoCardSkeleton from "@/components/VideoCardSkeleton";
import VideoModal from "@/components/VideoModal";
import type { Video } from "@/types/Video";
import { listVideos } from "@/services/video";

const Index = () => {
  const [selectedVideo, setSelectedVideo] =
    useState<(Video & { authorName?: string; authorPhoto?: string }) | null>(
      null
    );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 🔁 modo "Olhadinha": se true, hover libera o preview; se false, hover não faz nada
  const [isPeekMode, setIsPeekMode] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listVideos();
        setVideos(data);
      } catch (e: any) {
        setError(e?.message ?? "Erro ao carregar vídeos.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedVideo(null), 300);
  };

  const handleTogglePeekMode = () => {
    setIsPeekMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto w-full px-4 lg:px-10 pt-24 pb-12 max-w-[1500px]">
        <div className="mx-auto">
          {/* título + botão Olhadinha */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-4xl font-bold">
              Descubra <span className="text-primary">Editores Incríveis</span>
            </h1>

           <button
              type="button"
              onClick={handleTogglePeekMode}
              className={`hidden md:inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
                ${
                  isPeekMode
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
            >
              <span className="text-lg">👀</span>
              <span>Olhadinha</span>
            </button>
          </div>

          {/* alerta de erro */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="video-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <VideoCardSkeleton
                  key={`skeleton-${index}`}
                  isVertical={index % 3 === 0}
                />
              ))
            ) : (
              videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                  // 👇 quando Olhadinha está ligado, o hover libera o preview;
                  // quando desligado, fica sempre só a thumb
                  autoplayPreview={isPeekMode && !isModalOpen}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <VideoModal
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Index;
