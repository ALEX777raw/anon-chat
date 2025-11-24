
import React, { useState, useEffect, useRef } from 'react';
import type { Message, TypingEvent } from '@/types';
import { socketService } from '@/services/mockSocketService';
import { Copy, Check, Edit2, LogOut, Paperclip, FileText, Download, Activity, ArrowUp, ShieldCheck } from 'lucide-react';
import { VoidBackground } from './VoidBackground';

interface ChatRoomProps {
  roomId: string;
}

const INACTIVITY_LIMIT_MS = 60 * 10 * 1000; // 10 minutes

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [timeLeft, setTimeLeft] = useState(INACTIVITY_LIMIT_MS);
  const [copied, setCopied] = useState(false);
  const [myUserName, setMyUserName] = useState(socketService.getUserName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    const resetTimer = () => setTimeLeft(INACTIVITY_LIMIT_MS);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          handleSelfDestruct();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    if (messages.length > 0) resetTimer();
    return () => clearInterval(interval);
  }, [messages.length]);

  const handleSelfDestruct = () => {
    setMessages([]);
    setStatus('disconnected');
    socketService.disconnect();
  };

  const handleLeaveRoom = () => {
    socketService.disconnect();
    window.location.hash = '';
  };

  useEffect(() => {
    setMessages([]);
    setStatus('connecting');
    socketService.connect(
      roomId,
      (msg: Message) => setMessages((prev) => [...prev, msg]),
      (evt: TypingEvent) => {
        setTypingUsers((prev) => {
            const newSet = new Set(prev);
            evt.isTyping ? newSet.add(evt.senderName) : newSet.delete(evt.senderName);
            return newSet;
        });
      },
      (newStatus) => setStatus(newStatus)
    );
    return () => socketService.disconnect();
  }, [roomId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    if (text.length > 0) {
        socketService.sendTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => socketService.sendTyping(false), 2000);
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

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert("File limit: 500KB"); return; }
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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (status === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 relative bg-black text-white overflow-hidden">
        <VoidBackground />
        <div className="absolute inset-0 bg-black/80 z-0" />
        <div className="relative z-10 max-w-md w-full border border-white/10 p-10 bg-black/50 backdrop-blur-xl rounded-3xl">
          <Activity className="w-12 h-12 text-zinc-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2 tracking-tighter text-white">VOID STATE</h2>
          <p className="text-zinc-500 text-sm mb-8 font-mono">Connection severed.</p>
          <button onClick={() => window.location.hash = ''} className="px-8 py-3 bg-white text-black rounded-full text-xs font-bold tracking-widest hover:bg-zinc-200 transition-colors">
            RETURN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto relative bg-black overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
         <VoidBackground />
      </div>
      
      {/* Top Bar - Void Glass Panel */}
      <div className="absolute top-6 left-4 right-4 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-2 pr-6 rounded-full shadow-lg">
            {/* Status Indicator - Monochrome */}
            <div className={`w-3 h-3 rounded-full ml-2 border ${status === 'connected' ? 'bg-white border-white shadow-[0_0_10px_white]' : 'bg-transparent border-zinc-500 animate-pulse'}`} />
            
            <div className="flex flex-col">
                <span className="font-mono text-[9px] text-zinc-500 tracking-widest uppercase leading-none mb-1">
                    {status === 'connected' ? 'P2P ENCRYPTED' : 'SEARCHING...'}
                </span>
                <span className="font-bold text-xs tracking-wider text-white font-mono">{roomId}</span>
            </div>
            {status === 'connected' && <ShieldCheck className="w-3 h-3 text-white ml-2" />}
        </div>
        
        {/* Name Editor */}
        <div className="hidden sm:block">
            {isEditingName ? (
                <input 
                    className="bg-black text-white px-3 py-1.5 rounded-full border border-white/30 focus:outline-none focus:border-white font-mono text-xs"
                    value={editNameInput}
                    onChange={(e) => setEditNameInput(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    autoFocus
                />
            ) : (
                <button onClick={() => { setEditNameInput(myUserName); setIsEditingName(true); }} className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] text-zinc-400 hover:text-white font-mono uppercase flex gap-2 items-center hover:bg-white/5 transition-all">
                    {myUserName} <Edit2 className="w-3 h-3 opacity-50" />
                </button>
            )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-lg">
          <div className="hidden sm:flex items-center px-3 border-r border-white/10 mr-1">
             <span className="text-[9px] font-mono text-zinc-500">{Math.ceil(timeLeft / 60000)}M</span>
          </div>
          <button onClick={copyLink} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleLeaveRoom} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area - Monochrome */}
      <div className="flex-1 overflow-y-auto pt-24 pb-4 px-4 sm:px-8 space-y-6 scrollbar-hide relative z-10">
        {messages.length === 0 && status !== 'connected' && (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
                <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center animate-pulse mb-4">
                    <Activity className="w-6 h-6 text-white" />
                </div>
                <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-zinc-500">Searching Frequency...</p>
            </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === socketService.getUserId();
          
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-6">
                <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em] px-3 py-1 border border-zinc-800 rounded-full">{msg.text}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}>
              {!isMe && <div className="text-[9px] text-zinc-600 mb-1 font-mono tracking-widest uppercase ml-2">{msg.senderName}</div>}
              
              <div className={`max-w-[85%] sm:max-w-[65%] relative group`}>
                {/* Monochrome Bubble Style */}
                <div className={`relative px-5 py-3 rounded-2xl backdrop-blur-md transition-all duration-300 border
                    ${isMe 
                        ? 'border-white bg-white text-black rounded-br-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                        : 'border-white/20 bg-black/60 text-zinc-200 rounded-bl-sm'
                    }`}>
                  
                  {msg.type === 'text' && (
                      <p className="whitespace-pre-wrap break-words text-sm font-light leading-relaxed">{msg.text}</p>
                  )}
                  
                  {msg.type === 'image' && msg.fileUrl && (
                      <div className="rounded-lg overflow-hidden border border-zinc-800 mt-1 grayscale hover:grayscale-0 transition-all duration-500">
                          <img src={msg.fileUrl} alt="Shared" className="max-w-full h-auto" />
                      </div>
                  )}

                  {msg.type === 'file' && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-black/40 mt-1 hover:bg-white/5 transition-colors">
                          <div className="p-2 bg-white/10 rounded-md">
                            <FileText className="w-5 h-5 text-zinc-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-xs text-zinc-200 truncate font-medium">{msg.fileName}</p>
                              <p className="text-[9px] text-zinc-500 font-mono uppercase">{formatFileSize(msg.fileSize)}</p>
                          </div>
                          <a href={msg.fileUrl} download={msg.fileName} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                              <Download className="w-4 h-4" />
                          </a>
                      </div>
                  )}
                </div>
                <div className={`text-[8px] font-mono text-zinc-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider ${isMe ? 'text-right mr-1' : 'text-left ml-1'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.size > 0 && (
        <div className="absolute bottom-24 left-8 text-[9px] font-mono text-zinc-500 animate-pulse tracking-widest uppercase flex gap-2 items-center">
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            INCOMING SIGNAL
        </div>
      )}

      {/* Input - Floating Void Capsule */}
      <div className="p-4 sm:p-6 shrink-0 relative z-20 flex justify-center bg-gradient-to-t from-black via-black/90 to-transparent">
        <form onSubmit={handleSendMessage} className="relative flex items-center w-full max-w-2xl bg-black/80 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl p-1.5 gap-2 transition-all focus-within:border-white focus-within:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
            />
            <button
                type="button"
                onClick={handleFileClick}
                className="p-3 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
                <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1">
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Input transmission..."
                    className="w-full bg-transparent text-white placeholder-zinc-600 border-none focus:outline-none focus:ring-0 px-2 text-sm font-light tracking-wide"
                    autoFocus
                />
            </div>

            <button 
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-50 disabled:scale-90 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all duration-300"
            >
                <ArrowUp className="w-5 h-5" />
            </button>
        </form>
      </div>
    </div>
  );
};
