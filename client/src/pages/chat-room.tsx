import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Send, Copy, Check, Users, Wifi, WifiOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Message, UserPresence } from "@shared/schema";

type ServerMessage =
  | { type: "history"; messages: Message[] }
  | { type: "users"; users: UserPresence[] }
  | { type: "message"; message: Message }
  | { type: "user_joined"; username: string; users: UserPresence[] }
  | { type: "user_left"; username: string; users: UserPresence[] }
  | { type: "typing"; username: string; isTyping: boolean }
  | { type: "error"; error: string };

const randomName = () => `Guest-${Math.floor(1000 + Math.random() * 9000)}`;

export default function ChatRoom({ params }: { params: { code: string } }) {
  const roomCode = params.code?.toUpperCase() || "";
  const [, setLocation] = useLocation();
  const [username] = useState(randomName);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement>(null);

  const wsUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
    if (envUrl) return envUrl;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/ws`;
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          roomCode,
          username,
        }),
      );
    };

    ws.onmessage = (event) => {
      const data: ServerMessage = JSON.parse(event.data);
      if (data.type === "history") {
        setMessages(data.messages);
      } else if (data.type === "users") {
        setUsers(data.users);
      } else if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "user_joined") {
        setUsers(data.users);
        toast({
          title: "New user joined",
          description: data.username,
        });
      } else if (data.type === "user_left") {
        setUsers(data.users);
        toast({
          title: "User left",
          description: data.username,
        });
      } else if (data.type === "typing") {
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (data.isTyping) {
            next[data.username] = Date.now();
          } else {
            delete next[data.username];
          }
          return next;
        });
      } else if (data.type === "error") {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      toast({
        title: "Connection error",
        description: "Could not communicate with the server.",
        variant: "destructive",
      });
    };

    return () => {
      ws.close();
    };
  }, [roomCode, toast, username, wsUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([user, ts]) => {
          if (now - ts < 2500) {
            next[user] = ts;
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const sendTyping = (isTyping: boolean) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: "typing",
        roomCode,
        username,
        isTyping,
      }),
    );
  };

  const handleInputChange = (value: string) => {
    setMessageText(value);
    sendTyping(true);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => sendTyping(false), 1000);
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Disconnected",
        description: "Reconnecting…",
        variant: "destructive",
      });
      return;
    }
    socketRef.current.send(
      JSON.stringify({
        type: "message",
        roomCode,
        username,
        text: messageText.trim(),
      }),
    );
    setMessageText("");
    sendTyping(false);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({
      title: "Copied",
      description: "Room code copied to clipboard",
    });
  };

  const typingDisplay = Object.keys(typingUsers).filter((u) => u !== username);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Room code</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-lg tracking-[0.2em]">{roomCode}</span>
              <Button variant="secondary" size="sm" onClick={handleCopyCode} className="flex items-center gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2">
              {connected ? <Wifi className="h-4 w-4 text-primary" /> : <WifiOff className="h-4 w-4 text-destructive" />}
              <span className="text-sm">{connected ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{users.length} online</span>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Leave
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat
                </CardTitle>
                <CardDescription>Your messages are not stored anywhere else and vanish when the room empties.</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                Signed in as <span className="font-medium text-foreground">{username}</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isSelf={msg.username === username} />
                  ))
                )}
              </div>

              {typingDisplay.length ? (
                <p className="text-xs text-muted-foreground">
                  {typingDisplay.join(", ")} {typingDisplay.length === 1 ? "is" : "are"} typing...
                </p>
              ) : null}

              <div className="flex items-center gap-3">
                <Input
                  value={messageText}
                  placeholder="Type your message..."
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button className="px-4" onClick={handleSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[70vh] flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">People in room</CardTitle>
              <CardDescription>Everyone sees messages in real-time.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Waiting for others to join...</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(user.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500" aria-label="online indicator" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isSelf }: { message: Message; isSelf: boolean }) {
  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl border px-4 py-3 shadow-sm ${
          isSelf
            ? "bg-primary text-primary-foreground border-primary/40"
            : "bg-card text-card-foreground border-border"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className={`text-sm font-semibold ${isSelf ? "text-primary-foreground" : "text-foreground"}`}>
            {message.username}
          </p>
          <p className={`text-xs ${isSelf ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <p className={`mt-1 text-sm leading-relaxed ${isSelf ? "text-primary-foreground" : "text-foreground"}`}>
          {message.text}
        </p>
      </div>
    </div>
  );
}
