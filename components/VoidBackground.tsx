
import React, { useEffect, useRef } from 'react';

export const VoidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationId: number;
    let time = 0;

    // Noise generation for the grain effect
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 200;
    noiseCanvas.height = 200;
    const noiseCtx = noiseCanvas.getContext('2d');
    
    if (noiseCtx) {
        const idata = noiseCtx.createImageData(200, 200);
        const buffer32 = new Uint32Array(idata.data.buffer);
        const len = buffer32.length;
        for (let i = 0; i < len; i++) {
            if (Math.random() < 0.5) {
                buffer32[i] = 0xffffffff; // white
            }
        }
        noiseCtx.putImageData(idata, 0, 0);
    }
    const noisePattern = ctx.createPattern(noiseCanvas, 'repeat');

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);
    resize();

    // Searchlight Blob State
    const blob = {
        x: width / 2,
        y: height / 2,
        vx: 0.5,
        vy: 0.3,
        radius: Math.min(width, height) * 0.4
    };

    const draw = () => {
      // 1. Deep Black Base
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // 2. Update Searchlight Position (Drifting)
      time += 0.005;
      
      // Organic movement using sine waves
      blob.x = (width / 2) + Math.sin(time) * (width * 0.2);
      blob.y = (height / 2) + Math.cos(time * 0.7) * (height * 0.2);

      // 3. Draw Searchlight (Soft White Glow)
      // We want a very soft, "foggy" light
      const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius * 2);
      
      // Start white-ish but very low opacity, fade to black
      gradient.addColorStop(0, 'rgba(200, 200, 200, 0.15)'); 
      gradient.addColorStop(0.4, 'rgba(100, 100, 100, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 4. Apply Film Grain
      // We overlay the noise pattern with low opacity and a composite mode
      if (noisePattern) {
          ctx.globalCompositeOperation = 'overlay';
          
          // Jitter the noise position to animate it (TV static effect)
          const jitterX = Math.random() * 100;
          const jitterY = Math.random() * 100;
          
          ctx.translate(jitterX, jitterY);
          ctx.fillStyle = noisePattern;
          ctx.globalAlpha = 0.07; // Very subtle grain
          ctx.fillRect(-jitterX, -jitterY, width + jitterX, height + jitterY);
          
          // Reset
          ctx.translate(-jitterX, -jitterY);
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
};
