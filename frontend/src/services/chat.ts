// src/services/chat.ts
import { httpGet, httpPost } from "@/api/http";

export type Participant = {
  id: number;
  nick: string;
  email: string;
  profile_photo_url: string;
  role: "EDITOR" | "CONTRACTOR";
};

export type Conversation = {
  id: string;
  user1: Participant;
  user2: Participant;
  unread_count: number;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
};

export type Message = {
  id: number;
  conversation: string;
  sender: Participant;
  text: string;
  attachment_url?: string;
  created_at: string;
};

export async function listConversations(): Promise<Conversation[]> {
  return httpGet<Conversation[]>("/api/chat/conversations/");
}

export async function getConversation(id: string): Promise<Conversation> {
  return httpGet<Conversation>(`/api/chat/conversations/${id}/`);
}

export async function listMessages(
  conversationId: string,
  pageUrl?: string
): Promise<{ results: Message[]; next?: string; previous?: string; count?: number }> {
  if (pageUrl) return httpGet(pageUrl.replace(/^https?:\/\/[^/]+/, "")); 
  return httpGet(`/api/chat/conversations/${conversationId}/messages/`);
}

export async function sendMessageREST(
  conversationId: string,
  payload: { text?: string; attachment_url?: string }
): Promise<Message> {
  return httpPost<Message>(`/api/chat/conversations/${conversationId}/messages/`, payload);
}

export async function markRead(conversationId: string): Promise<{ status: string }> {
  return httpPost<{ status: string }>(`/api/chat/conversations/${conversationId}/mark_read/`, {});
}

export async function startConversation(otherUserId: number): Promise<Conversation> {
  return httpPost<Conversation>("/api/chat/conversations/", { other_user_id: otherUserId });
}