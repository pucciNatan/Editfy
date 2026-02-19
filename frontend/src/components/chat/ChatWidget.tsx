// src/components/chat/ChatWidget.tsx

import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import type { Conversation as ApiConversation } from '@/services/chat';
import { listConversations } from '@/services/chat';
import type { ChatConversation } from '@/lib/mockChatData';
import { authStorage } from '@/lib/authStorage';
import { getUserIdFromAccess } from '@/lib/jwt';

const toChatConversation = (c: ApiConversation): ChatConversation => ({
  id: c.id,
  user1: c.user1 as any,
  user2: c.user2 as any,
  created_at: (c as any).created_at,
  unread_count: (c as any).unread_count ?? 0,
  last_message: (c as any).last_message,
  last_message_at: (c as any).last_message_at,
});

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => authStorage.getAccess());

  const currentUserId = useMemo<number>(() => {
    const fromWindow = (window as any).__CURRENT_USER_ID__;
    if (fromWindow) return Number(fromWindow);

    const uid = getUserIdFromAccess(accessToken);
    return Number(uid || 0);
  }, [accessToken]);

  async function loadConversations() {
    try {
      const data = await listConversations();
      setConversations(data.map(toChatConversation));
    } catch (e) {
      console.warn('[Chat] Falha ao carregar conversas:', e);
    }
  }

  // 🔄 Sincroniza login/logout
  useEffect(() => {
    const syncToken = () => {
      setAccessToken(authStorage.getAccess());
    };

    window.addEventListener("storage", syncToken);
    window.addEventListener("auth:login", syncToken as EventListener);
    window.addEventListener("auth:logout", syncToken as EventListener);

    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("auth:login", syncToken as EventListener);
      window.removeEventListener("auth:logout", syncToken as EventListener);
    };
  }, []);

  // 📥 Carregar conversas quando o chat é aberto
  useEffect(() => {
    if (isOpen) loadConversations();
  }, [isOpen]);

  const unreadTotal = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
    [conversations]
  );

  // 🚀 NOVO: ouvir evento de "abrir chat direto com usuário"
  useEffect(() => {
    const handleDirectChatOpen = (e: any) => {
      const conv = e.detail;
      if (!conv) return;

      const mapped = toChatConversation(conv);

      // garante que estará na lista
      setConversations(prev => {
        const exists = prev.some(c => c.id === mapped.id);
        return exists ? prev : [...prev, mapped];
      });

      // abre o chat automaticamente
      setSelectedConversation(mapped);
      setIsOpen(true);
    };

    window.addEventListener("openChatWithUser", handleDirectChatOpen);
    return () => window.removeEventListener("openChatWithUser", handleDirectChatOpen);
  }, []);

  // 🔒 somente usuários autenticados veem a bolha
  if (!currentUserId) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)} className="rounded-full h-12 w-12 p-0">
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {unreadTotal > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center rounded-full">
                {unreadTotal}
              </Badge>
            )}
          </div>
        </Button>
      ) : (
        <div className="w-[380px] h-[560px] bg-background border rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="font-semibold">Mensagens</div>
            <Button variant="ghost" size="icon" onClick={() => {
              setSelectedConversation(null);
              setIsOpen(false);
            }}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {!selectedConversation ? (
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              onSelectConversation={(c) => setSelectedConversation(c)}
            />
          ) : (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={currentUserId}
              onClose={() => setSelectedConversation(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
