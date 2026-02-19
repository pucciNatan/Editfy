// src/components/shared/UserBadge.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountPublic } from "@/hooks/useAccountPublic";

interface UserBadgeProps {
  accountId?: number | null;
  size?: "sm" | "md";
  withAvatar?: boolean;
  className?: string;
  fallbackText?: string;
}

export default function UserBadge({
  accountId,
  size = "md",
  withAvatar = true,
  className = "",
  fallbackText = "Usuário"
}: UserBadgeProps) {
  const { data, loading } = useAccountPublic(accountId ?? undefined);
  const name = data?.nick || data?.full_name || (accountId ? `#${accountId}` : fallbackText);
  const initials = (name || fallbackText).trim().slice(0, 1).toUpperCase();

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {withAvatar && <Skeleton className={size === "sm" ? "h-6 w-6 rounded-full" : "h-8 w-8 rounded-full"} />}
        <Skeleton className={size === "sm" ? "h-4 w-24" : "h-5 w-28"} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {withAvatar && (
        <Avatar className={size === "sm" ? "h-6 w-6" : "h-8 w-8"}>
          <AvatarImage src={data?.profile_photo_url || undefined} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      <span className={size === "sm" ? "text-sm" : "text-base"}>{name}</span>
    </div>
  );
}
