
import { joinRoom } from 'trystero';
import type { Message, TypingEvent } from '@/types';

// REAL P2P SERVICE (WebRTC via Trystero)
// This is NOT a mock. It establishes real connections between devices.

type MessageHandler = (message: Message) => void;
type TypingHandler = (event: TypingEvent) => void;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
type StatusHandler = (status: ConnectionStatus) => void;

class P2PSocketService {
  private roomId: string | null = null;
  private userId: string;
  private userName: string;
  private isHost: boolean = false;
  
  // Trystero room instance
  private room: any = null;
  
  // Action creators
  private sendMsgAction: any = null;
  private sendTypingAction: any = null;

  private messageHandlers: MessageHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private statusHandlers: StatusHandler[] = [];

  constructor() {
    this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    this.userName = `Guest ${Math.floor(Math.random() * 1000)}`;
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
    this.messageHandlers = [onMessage];
    this.typingHandlers = [onTyping];
    this.statusHandlers = [onStatus];

    // Notify UI we are waiting for peers
    this.notifyStatus('connecting');

    // Connect to P2P room
    // Unique App ID for Protocol Messenger to ensure isolated channels
    const config = { appId: 'protocol_void_messenger_v1' };
    this.room = joinRoom(config, roomId);

    // Setup Actions
    const [sendMsg, getMsg] = this.room.makeAction('msg');
    const [sendTyping, getTyping] = this.room.makeAction('typing');

    this.sendMsgAction = sendMsg;
    this.sendTypingAction = sendTyping;

    // --- Event Listeners ---

    // 1. Peer Joined
    this.room.onPeerJoin((peerId: string) => {
        console.log(`Peer joined: ${peerId}`);
        this.notifyStatus('connected');
        // Send a system welcome message locally so I know connection happened
        this.notifyMessage({
            id: 'sys_' + Date.now(),
            roomId,
            text: 'SECURE HANDSHAKE COMPLETED. P2P LINK ESTABLISHED.',
            senderId: 'system',
            senderName: 'System',
            timestamp: Date.now(),
            type: 'system'
        });
    });

    // 2. Peer Left
    this.room.onPeerLeave((peerId: string) => {
        console.log(`Peer left: ${peerId}`);
        this.notifyMessage({
            id: 'sys_' + Date.now(),
            roomId,
            text: 'PEER DISCONNECTED.',
            senderId: 'system',
            senderName: 'System',
            timestamp: Date.now(),
            type: 'system'
        });
    });

    // 3. Receive Message
    getMsg((data: Message) => {
        this.notifyMessage(data);
    });

    // 4. Receive Typing
    getTyping((data: TypingEvent) => {
        this.notifyTyping(data);
    });
  }

  public disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.roomId = null;
    this.messageHandlers = [];
    this.typingHandlers = [];
    this.statusHandlers = [];
    this.notifyStatus('disconnected');
  }

  public sendMessage(text: string) {
    if (!this.roomId || !this.sendMsgAction) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: this.roomId,
      text,
      senderId: this.userId,
      senderName: this.userName, 
      timestamp: Date.now(),
      type: 'text'
    };

    // Broadcast to peers
    this.sendMsgAction(message);
    
    // Echo locally
    this.notifyMessage(message);
  }

  public sendFile(fileData: { url: string, name: string, size: number, mimeType: string }) {
    if (!this.roomId || !this.sendMsgAction) return;

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

    this.sendMsgAction(message);
    this.notifyMessage(message);
  }

  public sendTyping(isTyping: boolean) {
    if (!this.roomId || !this.sendTypingAction) return;
    
    const event: TypingEvent = {
        roomId: this.roomId,
        senderId: this.userId,
        senderName: this.userName,
        isTyping,
        type: 'typing'
    };

    this.sendTypingAction(event);
  }

  private notifyMessage(message: Message) {
    this.messageHandlers.forEach((h) => h(message));
  }

  private notifyTyping(event: TypingEvent) {
    this.typingHandlers.forEach((h) => h(event));
  }

  private notifyStatus(status: ConnectionStatus) {
    this.statusHandlers.forEach((h) => h(status));
  }
}

export const socketService = new P2PSocketService();
