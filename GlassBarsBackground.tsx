
import React, { useEffect, useRef } from 'react';

export const GlassBarsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Configuration
    const barWidth = 40; // Wider bars for more "glass" surface area
    const gap = 4; // Distinct gap for shadow
    
    // Animation state
    let time = 0;

    const draw = () => {
      // 1. Deep Black Background
      ctx.fillStyle = '#020202';
      ctx.fillRect(0, 0, width, height);

      const numBars = Math.ceil(width / (barWidth + gap));

      // Global composite operation to make colors glow when they overlap (if we were overlapping)
      // but here we want crisp separation, so 'source-over' is fine.
      
      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + gap);
        const normX = x / width; // 0.0 to 1.0

        // --- Wave Calculation ---
        // We want that "folded" interference look. 
        // We combine two sine waves moving at different speeds.
        
        // Main structural wave (slow moving)
        const structure = Math.sin(normX * 3 - time * 0.2);
        
        // Fast interference wave
        const interference = Math.cos(normX * 8 + time * 0.5);

        // Combine them to determine where the "light" is hitting the glass
        // The Math.abs creates the sharp "ridges" of light
        const lightStrike = Math.abs(structure + interference * 0.5);
        
        // --- Chromatic Aberration (RGB Shift) ---
        // We calculate intensity for R, G, B separately with slight phase offsets
        // This creates the orange/cyan fringing at the edges of the light beam
        
        // Red Channel (Lead) - leans towards Orange/Red
        const rPhase = lightStrike + 0.1; 
        let r = Math.pow(Math.sin(rPhase * Math.PI), 4) * 255;
        
        // Green Channel (Mid)
        const gPhase = lightStrike;
        let g = Math.pow(Math.sin(gPhase * Math.PI), 6) * 200; // Less green generally
        
        // Blue Channel (Lag) - leans towards Cyan/Blue
        const bPhase = lightStrike - 0.1;
        let b = Math.pow(Math.sin(bPhase * Math.PI), 2) * 255;

        // Boost contrast - clamp low values to black to reduce "mud"
        if (r < 30) r = 0;
        if (g < 30) g = 0;
        if (b < 30) b = 0;

        // Color Grading: Push towards the specific aesthetic
        // If high red, push yellow/orange. If high blue, push cyan.
        r += r * 0.5; // Boost warm
        b += b * 0.8; // Boost cool

        // Specular highlight intensity (The white hot core)
        const specular = Math.pow(lightStrike, 12) * 150; 
        r += specular;
        g += specular;
        b += specular;

        // Clamp
        r = Math.min(255, r);
        g = Math.min(255, g);
        b = Math.min(255, b);

        // --- Drawing the Bar (Cylindrical Glass Effect) ---
        // We need a gradient that looks like a glass rod
        
        const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
        
        // The glass profile:
        // 0% - Dark edge
        // 15% - Sharp Rim Light (Color)
        // 50% - Deep Translucent Center (Darker version of color)
        // 85% - Sharp Rim Light (Color + White)
        // 100% - Dark edge

        const colorStart = `rgba(${r}, ${g}, ${b}, 0)`;
        const colorRim = `rgba(${r}, ${g}, ${b}, 0.9)`;
        const colorCenter = `rgba(${r * 0.3}, ${g * 0.4}, ${b * 0.5}, 0.4)`; // Center is slightly cooler/darker
        const colorHighlight = `rgba(${Math.min(255, r+100)}, ${Math.min(255, g+100)}, ${Math.min(255, b+150)}, 1)`; // White-ish

        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.1, colorRim);      // Left rim
        gradient.addColorStop(0.4, colorCenter);   // Body
        gradient.addColorStop(0.6, colorCenter);   // Body
        gradient.addColorStop(0.9, colorHighlight);// Right specular rim
        gradient.addColorStop(1, '#000000');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, barWidth, height);
      }

      time += 0.008; // Slower, more majestic movement
      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-0"
    />
  );
};
