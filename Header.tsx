
import React from 'react';
import { Triangle } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pointer-events-none select-none">
      <div className="flex items-center gap-4 pointer-events-auto cursor-pointer group" onClick={() => window.location.hash = ''}>
        {/* Logo Icon - Void Style */}
        <div className="relative">
            <div className="absolute inset-0 bg-white blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="relative bg-black/50 backdrop-blur-md border border-white/30 p-2 rounded-full transform group-hover:scale-110 transition-transform duration-700">
              <Triangle className="w-4 h-4 text-white fill-white" />
            </div>
        </div>
        
        {/* Minimal Version - No Name */}
        <div className="flex flex-col justify-center h-full">
            <span className="text-[10px] tracking-[0.4em] text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase leading-none font-mono">V.1.0</span>
        </div>
      </div>
    </header>
  );
};
