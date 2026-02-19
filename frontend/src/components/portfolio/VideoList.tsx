import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Video as VideoIcon, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import AddVideoModal from "./AddVideoModal";
import EditVideoModal from "./EditVideoModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { getVideoEmbedUrl } from "@/lib/mockData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@/types/Video";

interface VideoListProps {
  videos: Video[];
  isOwner: boolean;
  onAddVideo: (video: Video) => void;
  onUpdateVideo: (videoId: number, updates: any) => void;
  onDeleteVideo: (videoId: number) => void;
}

const VideoList = ({ videos, isOwner, onAddVideo, onUpdateVideo, onDeleteVideo }: VideoListProps) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const useCarousel = videos.length > 3;

  useEffect(() => {
    if (useCarousel && carouselRef.current) {
      updateScrollButtons();
    }
  }, [videos, useCarousel]);

  const updateScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(updateScrollButtons, 300);
  };

  const handleDeleteVideo = () => {
    if (deletingVideoId) {
      onDeleteVideo(deletingVideoId);
      setDeletingVideoId(null);
      toast({
        title: "Vídeo excluído",
        description: "O vídeo foi removido com sucesso.",
      });
    }
  };

  return (
    <TooltipProvider>
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <VideoIcon className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Vídeos trabalhados</h2>
          </div>
          {isOwner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicionar vídeo</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {useCarousel ? (
          <div className="relative group">
            {canScrollLeft && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scroll('left')}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
              onScroll={updateScrollButtons}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {videos.map((video) => (
                <div key={video.id} className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start">
                  <Card 
                    className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative h-full"
                  >
                    <CardContent className="p-0">
                      {/* Edit and Delete Buttons */}
                      {isOwner && (
                        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVideo(video);
                            }}
                            className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingVideoId(video.id);
                            }}
                            className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      )}
                      
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-muted overflow-hidden rounded-t-lg">
                        <iframe
                          src={getVideoEmbedUrl(video.url)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>

                      {/* Video Info */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {video.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {video.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {canScrollRight && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scroll('right')}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card 
                key={video.id} 
                className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative"
              >
                <CardContent className="p-0">
                  {/* Edit and Delete Buttons */}
                  {isOwner && (
                    <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVideo(video);
                        }}
                        className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingVideoId(video.id);
                        }}
                        className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  )}
                  
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-muted overflow-hidden rounded-t-lg">
                    <iframe
                      src={getVideoEmbedUrl(video.url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* Video Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {video.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddVideoModal 
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onAddVideo={onAddVideo}
        />

        {editingVideo && (
          <EditVideoModal
            open={!!editingVideo}
            onOpenChange={(open) => !open && setEditingVideo(null)}
            video={editingVideo}
            onSave={onUpdateVideo}
          />
        )}

        <ConfirmDeleteModal
          open={deletingVideoId !== null}
          onOpenChange={(open) => !open && setDeletingVideoId(null)}
          onConfirm={handleDeleteVideo}
          title="Tem certeza que deseja excluir este vídeo?"
          description="Esta ação não pode ser desfeita. O vídeo será permanentemente removido do seu portfólio."
        />
      </section>
    </TooltipProvider>
  );
};

export default VideoList;
