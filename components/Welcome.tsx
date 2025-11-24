
import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowRight, Hash, Circle, Disc, Aperture } from 'lucide-react';
import { VoidBackground } from './VoidBackground';

interface WelcomeProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [joinId, setJoinId] = useState('');

  const handleCreate = () => {
    setIsCreating(true);
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-black text-white selection:bg-white/20 selection:text-white">
      {/* Void Background (Grain + Searchlight) */}
      <VoidBackground />
      
      {/* Heavy Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,1)_120%)] pointer-events-none" />

      <div className="relative z-10 max-w-2xl text-center space-y-16 animate-slide-up">
        
        {/* Void Typography - Blur Effect */}
        <div className="relative group cursor-default">
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-400 to-zinc-900 blur-[2px] hover:blur-0 transition-all duration-700 ease-out select-none">
                PROTOCOL
            </h1>
            <p className="mt-8 text-[10px] md:text-xs text-zinc-500 font-mono tracking-[0.6em] uppercase opacity-60">
                The Whole Future Lies in Uncertainty
            </p>
        </div>

        {/* Input Container - Minimal Void Card */}
        {/* Layout Fix: Preserved gap-10 for spacing */}
        <div className="flex flex-col gap-10 max-w-sm mx-auto w-full relative p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            {/* Create Section */}
            <div className="flex flex-col gap-3">
                 <Button onClick={handleCreate} isLoading={isCreating} className="w-full h-14 text-sm">
                    INITIATE CHANNEL
                </Button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center opacity-20">
                <div className="h-px bg-white/50 w-full" />
                <span className="absolute px-2 bg-black text-[9px] text-zinc-500 font-mono uppercase tracking-widest">OR</span>
            </div>

            {/* Join Section - Void Capsule Input */}
            <form onSubmit={handleJoin} className="relative group w-full">
                <div className="relative flex items-center bg-zinc-900/50 border border-white/10 rounded-full transition-all focus-within:border-white/40 focus-within:bg-black focus-within:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <div className="pl-4 text-zinc-600">
                        <Hash className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="FREQUENCY ID"
                        className="w-full bg-transparent border-none text-zinc-300 placeholder-zinc-700 text-xs py-4 pl-3 pr-14 focus:outline-none focus:ring-0 font-mono tracking-wider uppercase"
                    />
                    <button 
                        type="submit" 
                        disabled={!joinId.trim()} 
                        className="absolute right-1 top-1 bottom-1 aspect-square bg-white text-black hover:bg-zinc-200 rounded-full flex items-center justify-center disabled:opacity-0 disabled:scale-75 transition-all duration-300"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>

        {/* Footer Icons - Monochrome */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-12 opacity-20">
          <Circle className="w-3 h-3 text-white" />
          <Disc className="w-3 h-3 text-white" />
          <Aperture className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
};
