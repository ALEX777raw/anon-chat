import React from 'react';

export const BackgroundLogo: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-10 z-0">
      <svg 
        viewBox="0 0 500 500" 
        className="w-[150vmin] h-[150vmin] animate-slow-spin text-white/20"
        fill="currentColor"
      >
        <g transform="translate(250, 250)">
           {/* Outer Geometric Brackets */}
           <path d="M-180 -180 L-80 -180 L-80 -200 L-200 -200 L-200 -80 L-180 -80 Z" />
           <path d="M180 180 L80 180 L80 200 L200 200 L200 80 L180 80 Z" />
           <path d="M180 -180 L80 -180 L80 -200 L200 -200 L200 -80 L180 -80 Z" transform="rotate(90)" />
           <path d="M-180 180 L-80 180 L-80 200 L-200 200 L-200 80 L-180 80 Z" transform="rotate(90)" />

           {/* Central Globe Circle */}
           <circle cx="0" cy="0" r="120" fill="none" stroke="currentColor" strokeWidth="4" />
           
           {/* Globe Lat/Long Lines (Abstract) */}
           <ellipse cx="0" cy="0" rx="120" ry="40" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(45)" />
           <ellipse cx="0" cy="0" rx="120" ry="40" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-45)" />
           <line x1="0" y1="-120" x2="0" y2="120" stroke="currentColor" strokeWidth="2" />
           <line x1="-120" y1="0" x2="120" y2="0" stroke="currentColor" strokeWidth="2" />

           {/* Continents (Abstract Shapes) */}
           <path d="M-40 -20 Q-10 -60 30 -20 T 60 20" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.5" />
           <path d="M-50 40 Q-20 80 20 40" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.5" />

           {/* Three Stars on the Left */}
           <g transform="translate(-240, -50)">
              <path d="M0 -15 L4 -4 L15 -4 L6 4 L9 15 L0 8 L-9 15 L-6 4 L-15 -4 L-4 -4 Z" transform="translate(0, -40)" />
              <path d="M0 -15 L4 -4 L15 -4 L6 4 L9 15 L0 8 L-9 15 L-6 4 L-15 -4 L-4 -4 Z" transform="translate(20, 0)" />
              <path d="M0 -15 L4 -4 L15 -4 L6 4 L9 15 L0 8 L-9 15 L-6 4 L-15 -4 L-4 -4 Z" transform="translate(0, 40)" />
           </g>
        </g>
      </svg>
    </div>
  );
};