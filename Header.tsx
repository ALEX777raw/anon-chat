import React from 'react';
import { Triangle } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pointer-events-none">
      <div className="flex items-center space-x-3 pointer-events-auto cursor-pointer group" onClick={() => window.location.hash = ''}>
        <div className="bg-zinc-900 p-2 border border-zinc-700 shadow-xl transform group-hover:rotate-180 transition-transform duration-700">
          <Triangle className="w-5 h-5 text-white fill-white/20" />
        </div>
        <div className="flex flex-col">
            <span className="text-lg font-bold tracking-[0.2em] text-white uppercase leading-none">
            Архитектура
            </span>
            <span className="text-[9px] tracking-[0.4em] text-zinc-500 uppercase leading-none mt-1">Protocol</span>
        </div>
      </div>
    </header>
  );
};