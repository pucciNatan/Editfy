// src/lib/chatIdentity.ts
export type ApiUser = {
  id: number;
  nick: string;
  email: string;
  profile_photo_url: string | null;
  role: string;
};

export type ApiConversation = {
  id: string; // UUID
  user1: ApiUser;
  user2: ApiUser;
  created_at: string; // ISO
  unread_count?: number;
  last_message?: string | null;
  last_message_at?: string | null;
};

export type ApiMessage = {
  id: number | string;
  conversation: string; // UUID
  sender: ApiUser;
  text: string;
  attachment_url: string;
  created_at: string; // ISO
};

// ——— helpers de identidade ———
export function iAmUser1(c: ApiConversation, myId: number): boolean {
  return c.user1?.id === myId;
}

export function getOtherUser(c: ApiConversation, myId: number): ApiUser {
  return iAmUser1(c, myId) ? c.user2 : c.user1;
}
