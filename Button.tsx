
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  ...props 
}) => {
  // Base Styles - Void Capsule (Monochrome)
  const baseStyles = "relative group inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden tracking-widest uppercase border backdrop-blur-md";
  
  const variants = {
    // High Contrast Black/White
    primary: "bg-black text-white border-white/40 hover:bg-white hover:text-black hover:border-white shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]",
    // Ghost/Outline
    secondary: "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500 hover:text-white hover:bg-white/5",
    danger: "bg-transparent text-zinc-400 border-zinc-800 hover:border-white hover:text-white hover:bg-white", // Red removed for monochrome
    ghost: "bg-transparent text-zinc-600 border-transparent hover:text-white"
  };

  const sizes = {
      sm: "px-4 py-2 text-[10px]",
      md: "px-8 py-4 text-xs",
      lg: "px-12 py-5 text-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="relative flex items-center space-x-2 z-10">
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px]">PROCESSING</span>
        </span>
      ) : (
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      )}
    </button>
  );
};
