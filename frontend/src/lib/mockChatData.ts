export interface ChatUser {
  id: number;
  nick: string;
  email: string;
  profile_photo_url: string;
  role: 'EDITOR' | 'CONTRACTOR';
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: number;
  text: string;
  attachment_url?: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatConversation {
  id: string;
  user1: ChatUser;
  user2: ChatUser;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export const mockConversations: ChatConversation[] = [
  {
    id: "95a62bd4-6698-4613-aeb2-c821646f2f67",
    user1: {
      id: 1,
      nick: "natandev",
      email: "natan@example.com",
      profile_photo_url: "https://i.pravatar.cc/150?img=1",
      role: "EDITOR"
    },
    user2: {
      id: 2,
      nick: "mariasilva",
      email: "maria@example.com",
      profile_photo_url: "https://i.pravatar.cc/150?img=2",
      role: "CONTRACTOR"
    },
    last_message: "Oi! Estou interessado no seu trabalho",
    last_message_at: new Date().toISOString(),
    unread_count: 2,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const mockMessages: Record<string, ChatMessage[]> = {
  "95a62bd4-6698-4613-aeb2-c821646f2f67": [
    {
      id: "msg1",
      conversation_id: "95a62bd4-6698-4613-aeb2-c821646f2f67",
      sender_id: 2,
      text: "Olá! Tudo bem?",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      is_read: true
    },
    {
      id: "msg2",
      conversation_id: "95a62bd4-6698-4613-aeb2-c821646f2f67",
      sender_id: 1,
      text: "Oi! Tudo sim, e você?",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      is_read: true
    },
    {
      id: "msg3",
      conversation_id: "95a62bd4-6698-4613-aeb2-c821646f2f67",
      sender_id: 2,
      text: "Estou interessado no seu trabalho de edição",
      created_at: new Date(Date.now() - 1800000).toISOString(),
      is_read: false
    }
  ]
};
