
import React, { useEffect, useState } from 'react';
import { VoidBackground } from './VoidBackground';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timeline = [
      { time: 500, action: () => setStep(1) }, // Background Init
      { time: 1500, action: () => setStep(2) }, // Text Appear
      { time: 3000, action: () => setStep(3) }, // Text Focus
      { time: 4500, action: () => onComplete() }
    ];

    const timers: any[] = [];
    timeline.forEach(({ time, action }) => {
      timers.push(setTimeout(action, time));
    });
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden cursor-none">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
         <VoidBackground />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-8 mix-blend-difference">
         <div className={`transition-all duration-[1500ms] ease-out
            ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            ${step >= 3 ? 'blur-0 scale-100' : 'blur-[10px] scale-95'}
         `}>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white">
                PROTOCOL
            </h1>
         </div>
      </div>
    </div>
  );
};
