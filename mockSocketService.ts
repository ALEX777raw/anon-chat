
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Message, TypingEvent } from './types';

// ==========================================
// НАСТРОЙКИ ПОДКЛЮЧЕНИЯ
// ==========================================

// URL вашего проекта Supabase
const SUPABASE_URL = 'https://dbtselkdnunukqwdlofz.supabase.co'; 

// Ваш публичный ключ (Publishable Key)
const SUPABASE_KEY = 'sb_publishable_qSDGsKcScwniTvU-RznHSg_7Syq_wY4';

// ==========================================

type MessageHandler = (message: Message) => void;
type TypingHandler = (event: TypingEvent) => void;
type StatusHandler = (status: string) => void;

class SupabaseSocketService {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  
  private roomId: string | null = null;
  private userId: string;
  private userName: string;
  private isHost: boolean = false;
  
  private messageHandlers: MessageHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  
  constructor() {
    this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    this.userName = `Guest ${Math.floor(Math.random() * 1000)}`;

    try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            realtime: {
                params: {
                    eventsPerSecond: 10,
                },
            },
        });
    } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
    }
  }

  public getUserId(): string { return this.userId; }
  public setUserName(name: string) { this.userName = name; }
  public getUserName(): string { return this.userName; }
  public setAsHost(isHost: boolean) { this.isHost = isHost; }
  public amIHost(): boolean { return this.isHost; }

  public async connect(
    roomId: string, 
    onMessage: MessageHandler, 
    onTyping: TypingHandler, 
    onStatus: StatusHandler
  ) {
    if (!this.supabase) {
        console.error("Supabase client not initialized.");
        onStatus('disconnected');
        return;
    }

    if (this.channel) {
        await this.disconnect();
    }

    this.roomId = roomId;
    this.messageHandlers = [onMessage];
    this.typingHandlers = [onTyping];
    this.statusHandlers = [onStatus];

    onStatus('connecting');

    // Create a broadcast channel (Ephemeral, no DB storage)
    this.channel = this.supabase.channel(`room:${roomId}`, {
        config: {
            broadcast: { self: true } // Receive own messages to confirm sending
        }
    });

    this.channel
        .on('broadcast', { event: 'message' }, (payload) => {
            this.notifyMessage(payload.payload as Message);
        })
        .on('broadcast', { event: 'typing' }, (payload) => {
            const data = payload.payload as TypingEvent;
            // Don't trigger typing for self
            if (data.senderId !== this.userId) {
                this.notifyTyping(data);
            }
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Supabase] Connected to room ${roomId}`);
                onStatus('connected');
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error(`[Supabase] Connection error: ${status}`);
                onStatus('disconnected');
            }
        });
  }

  public async disconnect() {
    if (this.channel) {
      await this.supabase?.removeChannel(this.channel);
      this.channel = null;
    }
    this.roomId = null;
    this.notifyStatus('disconnected');
  }

  public async sendMessage(text: string) {
    if (!this.channel) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: this.roomId!,
      text,
      senderId: this.userId,
      senderName: this.userName, 
      timestamp: Date.now(),
      type: 'text'
    };

    await this.channel.send({
        type: 'broadcast',
        event: 'message',
        payload: message
    });
  }

  public async sendFile(fileData: { url: string, name: string, size: number, mimeType: string }) {
    if (!this.channel) return;

    const isImage = fileData.mimeType.startsWith('image/');
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: this.roomId!,
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

    await this.channel.send({
        type: 'broadcast',
        event: 'message',
        payload: message
    });
  }

  public async sendTyping(isTyping: boolean) {
    if (!this.channel) return;
    
    await this.channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
            roomId: this.roomId,
            senderId: this.userId,
            senderName: this.userName,
            isTyping,
            type: 'typing'
        }
    });
  }

  private notifyMessage(message: Message) {
    this.messageHandlers.forEach(h => h(message));
  }

  private notifyTyping(event: TypingEvent) {
    this.typingHandlers.forEach(h => h(event));
  }

  private notifyStatus(status: string) {
    this.statusHandlers.forEach(h => h(status));
  }
}

export const socketService = new SupabaseSocketService();
