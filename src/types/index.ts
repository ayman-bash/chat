export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  security_question1?: string;
  security_question2?: string;
  security_answer1?: string;
  security_answer2?: string;
  is_admin?: boolean;  // Add this property explicitly as boolean
  [key: string]: string | undefined | boolean;  // Update index signature to allow boolean values
}

export interface UnreadCount {
  sender_id: string;
  count: number;
  last_read_at: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: string;
  reply_to_id: string | null;
  reply_to?: Message;
  gemini_response?: string;
  image?: string | null;
  sender_id: string;
  receiver_id?: string | null;
  group_id?: string | null;
  created_at: string;
  is_deleted: boolean;
  is_read?: boolean;
  receiver?: User;
  edited_at?: string;
  game_invitation?: boolean; // Nouvelle propriété pour les invitations de jeu
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  members: GroupMember[];
  created_by: string;
}

export interface GroupMember extends User {
  is_admin: boolean;
  joined_at?: string; // Added joined_at
}

export interface UserWithGroupMetadata extends User {
  joined_at?: string;
  is_admin?: boolean;
}