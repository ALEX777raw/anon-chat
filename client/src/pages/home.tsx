import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Zap, Users, Plus, LogIn, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = () => {
    const roomCode = generateRoomCode();
    setCreatedRoomCode(roomCode);
    setShowCreateModal(true);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    setLocation(`/room/${createdRoomCode}`);
  };

  const handleJoinRoom = () => {
    if (joinRoomCode.length === 8) {
      setLocation(`/room/${joinRoomCode.toUpperCase()}`);
    } else {
      toast({
        title: "Invalid room code",
        description: "Please enter an 8-character room code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">Anonymous Chat</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Create private chat rooms instantly. Share the code with friends and start chatting in real-time.
          </p>

          <div className="flex flex-wrap justify-center gap-12 mb-16">
            <div className="flex flex-col items-center gap-3 max-w-[200px]">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Anonymous</h3>
              <p className="text-sm text-muted-foreground">No sign-up or personal info required</p>
            </div>
            <div className="flex flex-col items-center gap-3 max-w-[200px]">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Real-time</h3>
              <p className="text-sm text-muted-foreground">Instant message delivery via WebSocket</p>
            </div>
            <div className="flex flex-col items-center gap-3 max-w-[200px]">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Private Rooms</h3>
              <p className="text-sm text-muted-foreground">Each room is completely isolated</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="hover-elevate cursor-pointer" onClick={handleCreateRoom} data-testid="card-create-room">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Create Room</CardTitle>
              <CardDescription className="text-base">
                Start a new chat room and invite others with a unique code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" data-testid="button-create-room">
                Create New Room
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => setShowJoinModal(true)}
            data-testid="card-join-room"
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <LogIn className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">Join Room</CardTitle>
              <CardDescription className="text-base">
                Enter a room code to join an existing conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" size="lg" data-testid="button-join-room">
                Join Existing Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md" data-testid="modal-room-created">
          <DialogHeader>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">Room Created!</DialogTitle>
            <DialogDescription className="text-center text-base">
              Share this code with others to invite them to your room
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-muted rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Room Code</p>
              <p className="text-4xl font-bold font-mono tracking-wider text-foreground" data-testid="text-room-code">
                {createdRoomCode}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleCopyCode} variant="secondary" className="w-full" data-testid="button-copy-code">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
              <Button onClick={handleEnterRoom} className="w-full" data-testid="button-enter-room">
                Enter Room
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md" data-testid="modal-join-room">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Join a Room</DialogTitle>
            <DialogDescription className="text-center text-base">
              Enter the 8-character room code to join
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                placeholder="ABCD1234"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="text-center text-2xl font-mono tracking-wider uppercase"
                data-testid="input-room-code"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinRoom();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowJoinModal(false)}
                className="flex-1"
                data-testid="button-cancel-join"
              >
                Cancel
              </Button>
              <Button onClick={handleJoinRoom} className="flex-1" data-testid="button-confirm-join">
                Join Room
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
