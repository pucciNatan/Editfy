import { Skeleton } from "@/components/ui/skeleton";

interface VideoCardSkeletonProps {
  isVertical?: boolean;
}

const VideoCardSkeleton = ({ isVertical = false }: VideoCardSkeletonProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${
        isVertical ? "video-card-vertical" : "video-card-horizontal"
      }`}
    >
      <div className="absolute inset-0 bg-card">
        <Skeleton className="w-full h-full" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

export default VideoCardSkeleton;
