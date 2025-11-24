import React, { useEffect, useRef } from 'react';

export const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Characters to drop
    const chars = "XYZ010101<>[]{}+-=*&^%$#@!qwertyuiopasdfghjklzxcvbnm";
    const charArray = chars.split('');

    const fontSize = 14;
    const columns = width / fontSize;

    // Array of drops - one per column
    const drops: number[] = [];
    // Array of colors - one per column
    const columnColors: string[] = [];
    
    // Palette: Indigo, Violet, Cyan, Emerald, Rose
    const palette = ['#818cf8', '#a78bfa', '#22d3ee', '#34d399', '#fb7185'];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Start at random heights above screen
      columnColors[i] = palette[Math.floor(Math.random() * palette.length)];
    }

    const draw = () => {
      // Black BG for the canvas
      // Translucent BG to show trail
      ctx.fillStyle = 'rgba(9, 9, 11, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Randomly make some characters white (the leading edge look)
        const isLeading = Math.random() > 0.95;
        
        ctx.fillStyle = isLeading ? '#ffffff' : columnColors[i];
        
        // Draw the text
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Sending the drop back to the top randomly after it has crossed the screen
        // Adding a randomness to the reset to scatter the drops on the Y axis
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
          // Assign new color on reset
          columnColors[i] = palette[Math.floor(Math.random() * palette.length)];
        }

        // Incrementing Y coordinate
        drops[i]++;
      }
    };

    let animationId: number;
    const animate = () => {
        draw();
        animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        // Re-init columns but try to preserve visual continuity if possible, 
        // but simpler to just reset for this demo
    };

    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
    />
  );
};