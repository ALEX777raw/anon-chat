
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Message, TypingEvent } from '../types';
import { socketService } from '../services/mockSocketService';
import { Button } from './Button';
import { Send, Clock, Copy, Check, Edit2, Loader2, LogOut, Paperclip, FileText, Download, ShieldAlert } from 'lucide-react';
import { BackgroundLogo } from './BackgroundLogo';

interface ChatRoomProps {
  roomId: string;
}

const INACTIVITY_LIMIT_MS = 60 * 10 * 1000; // 10 minutes

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Connection Status
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const [timeLeft, setTimeLeft] = useState(INACTIVITY_LIMIT_MS);
  const [copied, setCopied] = useState(false);
  
  // Name editing
  const [myUserName, setMyUserName] = useState(socketService.getUserName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

  // Typing state
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Handle inactivity timer
  useEffect(() => {
    if (status !== 'connected') return;

    const resetTimer = () => {
      setTimeLeft(INACTIVITY_LIMIT_MS);
    };

    resetTimer();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          handleSelfDestruct();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    if (messages.length > 0) {
      resetTimer();
    }

    return () => clearInterval(interval);
  }, [messages.length, status]);

  const handleSelfDestruct = () => {
    setMessages([]);
    setStatus('disconnected');
    socketService.disconnect();
  };

  const handleLeaveRoom = () => {
    socketService.disconnect();
    window.location.hash = '';
  };

  // Socket connection
  useEffect(() => {
    setMessages([]);
    setStatus('connecting');

    socketService.connect(
      roomId,
      (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
      (typingEvent: TypingEvent) => {
        setTypingUsers((prev) => {
            const newSet = new Set(prev);
            if (typingEvent.isTyping) {
                newSet.add(typingEvent.senderName);
            } else {
                newSet.delete(typingEvent.senderName);
            }
            return newSet;
        });
      },
      (newStatus: string) => {
        setStatus(newStatus as any);
      }
    );

    return () => {
      socketService.disconnect();
    };
  }, [roomId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (text.length > 0) {
        socketService.sendTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketService.sendTyping(false);
        }, 2000);
    } else {
        socketService.sendTyping(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    socketService.sendMessage(inputText);
    setInputText('');
    socketService.sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
        alert("For this demo, files must be under 500KB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            socketService.sendFile({
                url: event.target.result as string,
                name: file.name,
                size: file.size,
                mimeType: file.type
            });
        }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveName = () => {
    if (editNameInput.trim()) {
        socketService.setUserName(editNameInput.trim());
        setMyUserName(editNameInput.trim());
    }
    setIsEditingName(false);
  };

  const startEditingName = () => {
    setEditNameInput(myUserName);
    setIsEditingName(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    const names = Array.from(typingUsers);
    const text = names.length === 1 
        ? `${names[0]} is typing...` 
        : `${names.length} people are typing...`;
        
    return (
        <div className="flex items-center gap-2 text-xs text-indigo-400 ml-4 mb-2 animate-pulse font-mono tracking-widest uppercase">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{text}</span>
        </div>
    );
  };

  if (status === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full border-t border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Session Terminated</h2>
          <p className="text-zinc-500 mb-8">This signal has faded into the void.</p>
          <Button onClick={() => window.location.hash = ''} className="w-full" variant="secondary">
            Re-establish Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto md:border-x border-zinc-800/50 relative bg-[#09090b] shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between shrink-0 glass-panel sticky top-0 z-20">
        <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0 group cursor-default">
                <span className={`w-2 h-2 rounded-full shadow-[0_0_10px] ${status === 'connected' ? 'bg-emerald-400 shadow-emerald-500/50 animate-pulse' : 'bg-yellow-500 shadow-yellow-500/50'}`} />
                <span className="font-mono text-zinc-400 text-xs sm:text-sm tracking-wider group-hover:text-white transition-colors">ID:{roomId}</span>
            </div>

            {/* Name Editor */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                {isEditingName ? (
                    <div className="flex items-center gap-1 animate-slide-up">
                        <input 
                            className="bg-black/30 border border-indigo-500/50 text-white text-sm rounded px-2 py-1 w-24 sm:w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-white/20"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveName()}
                            autoFocus
                            placeholder="Alias"
                        />
                        <button onClick={saveName} className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-all">
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={startEditingName}
                        className="flex items-center gap-2 group px-2 py-1 rounded transition-all hover:bg-white/5"
                        title="Change Alias"
                    >
                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white truncate max-w-[100px] sm:max-w-[150px]">{myUserName}</span>
                        <Edit2 className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </button>
                )}
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border backdrop-blur-sm transition-all duration-500 ${timeLeft < 60000 ? 'border-red-500/30 text-red-400 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-800 text-zinc-500 bg-zinc-900/50'}`}>
             <Clock className="w-3 h-3" />
             <span className="hidden sm:inline">{formatTime(timeLeft)}</span>
          </div>

          <button onClick={copyLink} className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-indigo-400 relative group border border-transparent hover:border-white/5">
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={handleLeaveRoom} 
            className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-500/20 group"
            title="Disconnect"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-500/5 border-b border-indigo-500/10 px-4 py-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-indigo-400/80 shrink-0 backdrop-blur-sm">
        <ShieldAlert className="w-3 h-3" />
        <span>Secure Channel Established</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide relative z-10">
        <div className="text-center py-8">
            <div className="inline-block px-4 py-2 rounded-full bg-white/5 text-zinc-500 text-[10px] uppercase tracking-widest border border-white/5 backdrop-blur-md">
                Encrypted • Ephemeral • Untraceable
            </div>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === socketService.getUserId();
          
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-4 animate-slide-up">
                <span className="text-[10px] text-zinc-600 font-mono border-b border-zinc-800 pb-1">{msg.text}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col animate-slide-up ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <div className="text-[10px] text-indigo-400/70 ml-1 mb-1 font-medium tracking-wide">{msg.senderName}</div>}
              
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-[1px] relative overflow-hidden group transition-all duration-300 ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                <div className={`absolute inset-0 opacity-50 ${isMe ? 'bg-gradient-to-br from-indigo-500/40 to-transparent' : 'bg-gradient-to-br from-zinc-700/40 to-transparent'}`} />

                <div className={`relative rounded-[15px] overflow-hidden backdrop-blur-xl border-t ${
                  isMe 
                    ? 'bg-indigo-600/20 border-indigo-400/20 shadow-[0_4px_20px_rgba(79,70,229,0.1)]' 
                    : 'bg-zinc-900/60 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                }`}>
                  
                  {msg.type === 'text' && (
                      <p className={`whitespace-pre-wrap break-words leading-relaxed px-4 py-3 text-sm ${isMe ? 'text-indigo-50' : 'text-zinc-300'}`}>{msg.text}</p>
                  )}
                  
                  {msg.type === 'image' && msg.fileUrl && (
                      <div className="relative group/img cursor-pointer">
                          <img src={msg.fileUrl} alt="Shared" className="max-w-full h-auto max-h-[350px] object-cover transition-transform duration-500 group-hover/img:scale-[1.02]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                      </div>
                  )}

                  {msg.type === 'file' && (
                      <div className="flex items-center gap-3 p-3 min-w-[220px] bg-black/20">
                          <div className={`p-2 rounded-lg shrink-0 ${isMe ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                              <FileText className={`w-6 h-6 ${isMe ? 'text-indigo-300' : 'text-zinc-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isMe ? 'text-indigo-100' : 'text-zinc-200'}`}>{msg.fileName}</p>
                              <p className="text-[10px] opacity-60 uppercase tracking-wider">{formatFileSize(msg.fileSize)}</p>
                          </div>
                          <a 
                              href={msg.fileUrl} 
                              download={msg.fileName}
                              className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                              title="Download"
                          >
                              <Download className={`w-4 h-4 ${isMe ? 'text-indigo-300' : 'text-zinc-400'}`} />
                          </a>
                      </div>
                  )}

                  <div className={`text-[9px] pb-1 pr-2 mt-0.5 text-right font-mono opacity-50 ${isMe ? 'text-indigo-200' : 'text-zinc-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {renderTypingIndicator()}

      <div className="p-4 pt-2 shrink-0 relative z-20">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 max-w-4xl mx-auto glass-panel rounded-2xl p-2 shadow-2xl">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
          />
          <button
            type="button"
            onClick={handleFileClick}
            className="p-3 text-zinc-400 rounded-xl hover:bg-white/10 hover:text-zinc-200 transition-all active:scale-95"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Encrypting message..."
            className="w-full bg-transparent text-white placeholder-zinc-600 border-none focus:ring-0 focus:outline-none py-2 px-2 text-sm sm:text-base font-light tracking-wide"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/40 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
