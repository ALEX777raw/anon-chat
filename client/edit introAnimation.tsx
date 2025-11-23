// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { BackgroundLogo } from './BackgroundLogo';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequence timeline
    const timeline = [
      { time: 500, action: () => setStep(1) },  // Logo fade in
      { time: 1500, action: () => setStep(2) }, // FREEDOM
      { time: 2200, action: () => setStep(3) }, // REASON
      { time: 2900, action: () => setStep(4) }, // RESPONSIBILITY
      { time: 4000, action: () => setStep(5) }, // Glitch out
      { time: 4500, action: onComplete }        // Finish
    ];

    const timers: any[] = [];

    timeline.forEach(({ time, action }) => {
      timers.push(setTimeout(action, time));
    });

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (step === 5) return <div className="fixed inset-0 bg-white z-50 animate-pulse" />; // Flash

  return (
    <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center overflow-hidden">
      
      <div className={`transition-opacity duration-1000 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
         <div className="scale-150">
            <BackgroundLogo />
         </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className={`text-4xl md:text-6xl font-bold tracking-[0.5em] text-white uppercase transition-all duration-700 transform ${step >= 1 ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-10 opacity-0 blur-sm'}`}>
          Архитектура
        </h1>

        <div className="flex flex-col items-center gap-2 mt-8 font-mono text-sm md:text-lg tracking-[0.3em] text-zinc-400">
          <span className={`transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            FREEDOM
          </span>
          <span className={`transition-all duration-500 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            REASON
          </span>
          <span className={`transition-all duration-500 ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            RESPONSIBILITY
          </span>
        </div>
      </div>
      
      {step >= 4 && (
         <div className="absolute inset-0 bg-transparent pointer-events-none animate-pulse bg-gradient-to-t from-indigo-500/10 to-transparent" />
      )}
    </div>
  );
};
