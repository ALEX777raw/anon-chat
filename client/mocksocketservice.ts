// @ts-nocheck
import { Message, TypingEvent, JoinRequestEvent, JoinResponseEvent } from '../types';

// This class simulates a WebSocket server for the purpose of this demo.
// In a real application, this would be replaced by `socket.io-client` or native `WebSocket`.

type MessageHandler = (message: Message) => void;
type TypingHandler = (event: TypingEvent) => void;
type StatusHandler = (status: string) => void;
type JoinRequestHandler = (event: JoinRequestEvent) => void;

class MockSocketService {
  private roomId: string | null = null;
  private userId: string;
  private userName: string;
  private isHost: boolean = false;

  private messageHandlers: MessageHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  
  private storageKey: string = '';

  constructor() {
    this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    this.userName = `Ghost ${Math.floor(Math.random() * 1000)}`;
    window.addEventListener('storage', this.handleStorageEvent);
  }

  public getUserId(): string {
    return this.userId;
  }

  public setUserName(name: string) {
    this.userName = name;
  }

  public getUserName(): string {
    return this.userName;
  }

  public setAsHost(isHost: boolean) {
    this.isHost = isHost;
  }

  public amIHost(): boolean {
    return this.isHost;
  }

  public connect(
    roomId: string, 
    onMessage: MessageHandler, 
    onTyping: TypingHandler, 
    onStatus: StatusHandler
  ) {
    this.roomId = roomId;
    this.storageKey = `ghost_chat_${roomId}`;
    this.messageHandlers.push(onMessage);
    this.typingHandlers.push(onTyping);
    this.statusHandlers.push(onStatus);

    // IMMEDIATE CONNECTION FOR EVERYONE
    // No waiting room logic anymore
    setTimeout(() => {
        this.notifyStatus('connected');
        this.broadcastLocal({
            id: Date.now().toString(),
            roomId,
            text: this.isHost ? 'Channel initialized. You are the Architect.' : 'Uplink established. Connection secure.',
            senderId: 'system',
            senderName: 'System',
            timestamp: Date.now(),
            type: 'system'
        });
    }, 500);
  }

  public disconnect() {
    if (this.roomId) {
      this.notifyStatus('disconnected');
      this.messageHandlers = [];
      this.typingHandlers = [];
      this.statusHandlers = [];
      this.roomId = null;
      // We don't reset isHost here to prevent flickering on react-strict-mode re-mounts,
      // but logically it resets on navigation.
    }
  }

  public sendMessage(text: string) {
    if (!this.roomId) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: this.roomId,
      text,
      senderId: this.userId,
      senderName: this.userName, 
      timestamp: Date.now(),
      type: 'text'
    };

    this.notifyMessage(message);
    this.emitToStorage(message);
  }

  public sendFile(fileData: { url: string, name: string, size: number, mimeType: string }) {
    if (!this.roomId) return;

    const isImage = fileData.mimeType.startsWith('image/');

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: this.roomId,
      text: isImage ? 'Sent an image' : 'Sent a file',
      senderId: this.userId,
      senderName: this.userName,
      timestamp: Date.now(),
      type: isImage ? 'image' : 'file',
      fileUrl: fileData.url,
      fileName: fileData.name,
      fileSize: fileData.size,
      fileMimeType: fileData.mimeType
    };

    this.notifyMessage(message);
    this.emitToStorage(message);
  }

  public sendTyping(isTyping: boolean) {
    if (!this.roomId) return;
    
    const event: TypingEvent = {
        roomId: this.roomId,
        senderId: this.userId,
        senderName: this.userName,
        isTyping,
        type: 'typing'
    };

    this.emitToStorage(event);
  }

  private emitToStorage(payload: any) {
    setTimeout(() => {
        try {
            const json = JSON.stringify(payload);
            localStorage.setItem(this.storageKey, json);
            setTimeout(() => localStorage.removeItem(this.storageKey), 100);
        } catch (e) {
            console.error("Storage limit exceeded or error", e);
        }
    }, 50);
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === this.storageKey && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        
        if (payload.senderId === this.userId) return;

        if (payload.type === 'text' || payload.type === 'image' || payload.type === 'file') {
            this.notifyMessage(payload);
        } 
        else if (payload.type === 'typing') {
            this.notifyTyping(payload);
        }
      } catch (e) {
        console.error("Failed to parse socket message", e);
      }
    }
  };

  private notifyMessage(message: Message) {
    this.messageHandlers.forEach(h => h(message));
  }

  private notifyTyping(event: TypingEvent) {
    this.typingHandlers.forEach(h => h(event));
  }

  private notifyStatus(status: string) {
    this.statusHandlers.forEach(h => h(status));
  }

  private broadcastLocal(message: Message) {
    this.notifyMessage(message);
  }
}

export const socketService = new MockSocketService();
