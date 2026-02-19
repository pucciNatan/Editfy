import { useState, useEffect, useRef } from "react";
import { X, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble, { DateSeparator } from "./MessageBubble";
import { ChatConversation, ChatMessage } from "@/lib/mockChatData";
import { parseISO, isValid, compareAsc, format } from "date-fns";

import {
  listMessages as listMessagesApi,
  sendMessageREST,
  markRead as markReadApi,
} from "@/services/chat";

interface ChatWindowProps {
  conversation: ChatConversation;
  currentUserId: number | string; // 🔧 aceita string/number
  onClose: () => void;
  onBack?: () => void; // opcional
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isValid(v) ? v : null;
  if (typeof v === "number") {
    const d = new Date(v);
    return isValid(d) ? d : null;
  }
  if (typeof v === "string") {
    const iso = parseISO(v);
    if (isValid(iso)) return iso;
    const d = new Date(v);
    return isValid(d) ? d : null;
  }
  return null;
}

function normCreatedAt(v: unknown): string {
  const d = toDate(v);
  return d ? d.toISOString() : new Date().toISOString();
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// janela (ms) para casar a mensagem otimista com a confirmada do servidor
const MATCH_WINDOW_MS = 7000;

// 🔧 helper: escolhe SEMPRE o outro usuário da conversa, independente da ordem
function getOtherUser(
  conversation: ChatConversation,
  currentUserId: number | string
) {
  const myId = Number(currentUserId);
  const u1Id = Number((conversation as any)?.user1?.id);
  const u2Id = Number((conversation as any)?.user2?.id);

  // se meu id == user1.id → outro é user2; senão, outro é user1
  if (!Number.isNaN(myId) && myId === u1Id) {
    return (conversation as any).user2;
  }
  if (!Number.isNaN(myId) && myId === u2Id) {
    return (conversation as any).user1;
  }
  // fallback: se não conseguir decidir, usa user2
  return (conversation as any).user2 ?? (conversation as any).user1;
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onClose,
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // para evitar duplicidades (id) e casar otimistas
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pendingOptimisticRef = useRef<Array<ChatMessage>>([]);

  // ✅ sempre pega o OUTRO usuário, não importa quem é user1/user2
  const otherUser = getOtherUser(conversation, currentUserId);

  // URL do WS (http->ws / https->wss) a partir do VITE_API_BASE_URL
  const httpBase = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";
  const wsBase = httpBase.replace(/^http/i, "ws"); // http->ws, https->wss
  const wsUrl = `${wsBase}/ws/chat/${conversation.id}/`;

  const { isConnected, sendMessage: sendWsMessage } = useWebSocket(wsUrl, {
    onMessage: (data) => {
      // backend envia: { event: "message.new", message: { ... } }
      if (data?.event === "message.new" && data?.message) {
        const m = data.message;
        const incoming: ChatMessage = {
          id: String(m.id ?? crypto.randomUUID?.() ?? Date.now()),
          conversation_id: conversation.id,
          sender_id: m.sender_id ?? m.sender?.id,
          text: m.text ?? "",
          attachment_url: m.attachment_url || undefined,
          created_at: normCreatedAt(m.created_at),
          is_read: (m.sender_id ?? m.sender?.id) === Number(currentUserId),
        };
        addMessageSafe(incoming);
      }
    },
    onConnect: () => {
      // marcar lido ao conectar
      markAsRead();
    },
  });

  function scrollToEnd(force = false) {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth", block: "end" });
    });
  }

  // adiciona mensagem com de-dup (substitui otimista quando chegar a real)
  function addMessageSafe(m: ChatMessage) {
    const idStr = String(m.id || "");
    if (idStr && seenIdsRef.current.has(idStr)) return;

    // tentar casar com otimista minha (mesmo texto e tempo próximo)
    if (Number(m.sender_id) === Number(currentUserId)) {
      const realTime = toDate(m.created_at) || new Date();
      const idx = pendingOptimisticRef.current.findIndex(o => {
        if (o.text !== m.text) return false;
        const oTime = toDate(o.created_at) || new Date();
        return Math.abs(realTime.getTime() - oTime.getTime()) <= MATCH_WINDOW_MS;
      });
      if (idx !== -1) {
        const optimistic = pendingOptimisticRef.current[idx];
        pendingOptimisticRef.current.splice(idx, 1);

        setMessages(prev => {
          const withoutOpt = prev.filter(x => x.id !== optimistic.id);
          const next = [...withoutOpt, m];
          next.sort((a, b) => compareAsc(new Date(a.created_at), new Date(b.created_at)));
          return next;
        });
        if (idStr) seenIdsRef.current.add(idStr);
        scrollToEnd();
        return;
      }
    }

    // caso normal
    setMessages(prev => {
      const next = [...prev, m];
      next.sort((a, b) => compareAsc(new Date(a.created_at), new Date(b.created_at)));
      return next;
    });
    if (idStr) seenIdsRef.current.add(idStr);
    scrollToEnd();
  }

  async function loadHistory() {
    try {
      const data = await listMessagesApi(conversation.id);
      const mapped: ChatMessage[] = data.map((m: any) => ({
        id: String(m.id),
        conversation_id: conversation.id,
        sender_id: m.sender?.id ?? m.sender_id,
        text: m.text ?? "",
        attachment_url: m.attachment_url || undefined,
        created_at: normCreatedAt(m.created_at),
        is_read:
          m.read_by?.includes?.(Number(currentUserId)) ||
          Number(m.sender_id) === Number(currentUserId),
      }));
      mapped.sort((a, b) =>
        compareAsc(new Date(a.created_at), new Date(b.created_at))
      );
      // marca ids já vistos (evita duplicar ao chegar via WS)
      seenIdsRef.current = new Set(mapped.map(x => String(x.id)));
      setMessages(mapped);
      scrollToEnd(true);
    } catch (e) {
      console.warn("[Chat] Falha ao carregar mensagens:", e);
    }
  }

  async function markAsRead() {
    try {
      await markReadApi(conversation.id);
    } catch {}
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text) return;

    // Otimismo
    const tempId = crypto.randomUUID?.() ?? String(Date.now());
    const optimistic: ChatMessage = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: Number(currentUserId),
      text,
      created_at: new Date().toISOString(),
      is_read: true,
    };

    // salva otimista (para casar quando chegar a real)
    pendingOptimisticRef.current.push(optimistic);

    setMessages((prev) => {
      const next = [...prev, optimistic];
      next.sort((a, b) => compareAsc(new Date(a.created_at), new Date(b.created_at)));
      return next;
    });
    setInputText("");
    scrollToEnd();

    // Enviar via WS (contrato: event/action do seu backend; ajuste se necessário)
    if (isConnected) {
      sendWsMessage({ event: "message.send", text, attachment_url: "" });
    } else {
      // Fallback REST
      try {
        await sendMessageREST(conversation.id, { text, attachment_url: "" });
      } catch (e) {
        console.warn("[Chat] Falha ao enviar mensagem:", e);
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Agrupamento por dia
  const groups = (() => {
    const res: Array<{ date: Date; items: ChatMessage[] }> = [];
    for (const m of messages) {
      const d = toDate(m.created_at) || new Date();
      const last = res[res.length - 1];
      if (!last || !sameDay(last.date, d)) {
        res.push({ date: d, items: [m] });
      } else {
        last.items.push(m);
      }
    }
    return res;
  })();

  // ====== LAYOUT com scroll estável ======
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {otherUser?.profile_photo_url ? (
              <AvatarImage src={otherUser.profile_photo_url} alt={otherUser?.nick || `Usuário #${otherUser?.id}`} />
            ) : (
              <AvatarFallback aria-label="Sem foto">
                <User className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium leading-none">
              {otherUser?.nick || `Usuário #${otherUser?.id ?? ""}`}
            </div>
            <div className="text-xs text-muted-foreground">Conversa</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack} size="sm">
              Voltar
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Área rolável precisa de min-h-0 */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full p-3">
          {groups.map((g, idx) => {
            const label =
              sameDay(g.date, new Date())
                ? "Hoje"
                : format(g.date, "dd/MM/yyyy");
            return (
              <div key={idx} className="mb-4">
                <DateSeparator label={label} />
                <div className="flex flex-col gap-2 mt-2">
                  {g.items.map((message) => (
                    <MessageBubble
                      key={message.id}
                      text={message.text}
                      isMine={Number(message.sender_id) === Number(currentUserId)}
                      timestamp={message.created_at}
                      senderName={
                        Number(message.sender_id) !== Number(currentUserId)
                          ? (otherUser?.nick || `Usuário #${otherUser?.id ?? ""}`)
                          : undefined
                      }
                      attachmentUrl={message.attachment_url}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </ScrollArea>
      </div>

      {/* Composer fixo */}
      <div className="p-3 border-t flex gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Digite uma mensagem..."
        />
        <Button onClick={handleSend} disabled={!inputText.trim()} size="icon" className="h-9 w-9 shrink-0" aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 px-3 pb-2">
        Enter para enviar • Shift+Enter para quebra de linha
      </p>
    </div>
  );
}
