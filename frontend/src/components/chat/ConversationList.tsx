import { useState } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatConversation } from "@/lib/mockChatData";
import { parseISO, isValid, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversationListProps {
  conversations: ChatConversation[];
  currentUserId: number;
  onSelectConversation: (conversation: ChatConversation) => void;
}

const formatLastMessageTime = (dateString?: string) => {
  if (!dateString) return "";
  const d = parseISO(dateString);
  if (!isValid(d)) return "";
  const now = new Date();
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  return diffInHours < 24
    ? format(d, "HH:mm", { locale: ptBR })
    : format(d, "dd/MM", { locale: ptBR });
};

const ConversationList = ({
  conversations,
  currentUserId,
  onSelectConversation,
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.user1.id === currentUserId ? conv.user2 : conv.user1;
    return (
      otherUser.nick.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversa..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 p-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const otherUser =
                conversation.user1.id === currentUserId
                  ? conversation.user2
                  : conversation.user1;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className="flex items-start gap-3 p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage
                      src={otherUser.profile_photo_url}
                      alt={otherUser.nick}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/fallback-avatar.png";
                      }}
                    />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{otherUser.nick}</h4>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatLastMessageTime(conversation.last_message_at)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {conversation.last_message || (otherUser.role == "CONTRACTOR" ? "Contratante" : "Editor")}
                    </p>

                    {conversation.unread_count > 0 && (
                      <Badge variant="default" className="h-5 px-2 text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
