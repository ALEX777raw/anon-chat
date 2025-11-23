// @ts-nocheck
import React, { useState } from 'react';
import { Button } from './Button';
import { ShieldCheck, Zap, Clock, Lock } from 'lucide-react';
import { MatrixBackground } from './MatrixBackground';
import { BackgroundLogo } from './BackgroundLogo';

interface WelcomeProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [joinId, setJoinId] = useState('');

  const handleCreate = () => {
    setIsCreating(true);
    // Simulate API call delay for effect
    setTimeout(() => {
      onCreateRoom();
      setIsCreating(false);
    }, 800);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    onJoinRoom(joinId.trim());
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[#09090b]">
      {/* Background Layers */}
      <MatrixBackground />
      <BackgroundLogo />
      
      {/* Radial Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-2xl text-center space-y-12 animate-slide-up">
        <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase">
            Архитектура
            </h1>
            
            <div className="flex flex-col items-center gap-2">
              <div className="h-px w-24 bg-white/30"></div>
              <p className="text-sm md:text-base text-zinc-300 font-mono tracking-[0.2em] uppercase">
                Freedom, Reason, Responsibility
              </p>
              <div className="h-px w-24 bg-white/30"></div>
            </div>
        </div>

        <div className="glass-panel p-8 rounded-sm shadow-2xl backdrop-blur-xl border-white/10 max-w-sm mx-auto w-full transform transition-transform hover:scale-[1.01] duration-500 relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50"></div>

            <div className="flex flex-col gap-6">
                <Button onClick={handleCreate} isLoading={isCreating} className="w-full text-lg h-14 shadow-lg shadow-white/5 border border-white/10 hover:bg-white/5 text-white">
                    INITIATE CHANNEL
                </Button>

                <div className="relative w-full flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10"></span>
                    </div>
                    <span className="relative bg-[#0d0d10] px-4 text-[10px] text-zinc-500 font-mono uppercase tracking-widest border border-white/5 rounded-full py-1">
                        OR CONNECT
                    </span>
                </div>

                <form onSubmit={handleJoin} className="flex w-full gap-2 relative group">
                    <input
                        type="text"
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="FREQUENCY CODE"
                        className="flex-1 bg-black/40 border border-white/10 text-white placeholder-zinc-600 text-sm px-4 py-3 focus:outline-none focus:border-white/30 transition-all font-mono tracking-wider uppercase"
                    />
                    <Button type="submit" variant="secondary" disabled={!joinId.trim()} className="border border-white/10 rounded-none">
                        &gt;
                    </Button>
                </form>
            </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 opacity-60">
          {[
              { icon: ShieldCheck, label: "Secure", color: "text-white" },
              { icon: Zap, label: "Instant", color: "text-white" },
              { icon: Lock, label: "Private", color: "text-white" },
              { icon: Clock, label: "Ephemeral", color: "text-white" }
          ].map((feature, idx) => (
              <div key={idx} className="group flex flex-col items-center gap-2 p-2 hover:text-white transition-colors cursor-default">
                <feature.icon className={`w-4 h-4 ${feature.color}`} />
                <span className="text-[10px] uppercase tracking-widest font-light">{feature.label}</span>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};
