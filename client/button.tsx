
// @ts-nocheck
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
  // Base glass styles
  const baseStyles = "relative group inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] backdrop-blur-sm",
    secondary: "bg-zinc-800/40 hover:bg-zinc-700/40 text-zinc-100 border border-zinc-700/50 backdrop-blur-sm",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 hover:border-red-500/50 backdrop-blur-sm",
    ghost: "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white"
  };

  const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-6 py-3 text-sm sm:text-base",
      lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Glitch Overlay Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none mix-blend-overlay bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      
      {/* Chromatic Aberration Shadow on Hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-[2px_0_0_rgba(255,0,0,0.4),-2px_0_0_rgba(0,255,255,0.4)]" />

      {isLoading ? (
        <span className="relative flex items-center space-x-2 z-10">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      )}
    </button>
  );
};
