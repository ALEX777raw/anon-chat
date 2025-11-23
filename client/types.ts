// @ts-nocheck
export interface User {
  id: string;
  displayName: string; // e.g., "Guest 1"
  isSelf: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  type: 'text' | 'system' | 'image' | 'file';
  // File specific properties
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

export interface RoomState {
  roomId: string;
  lastActive: number;
  participants: number;
}

export interface TypingEvent {
  roomId: string;
  senderId: string;
  senderName: string;
  isTyping: boolean;
  type: 'typing';
}

export interface JoinRequestEvent {
  roomId: string;
  candidateId: string;
  candidateName: string;
  type: 'join_request';
}

export interface JoinResponseEvent {
  roomId: string;
  candidateId: string;
  status: 'approved' | 'denied';
  type: 'join_response';
}
