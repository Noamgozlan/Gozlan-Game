import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-black rounded-2xl transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-br from-love-500 to-love-600 text-white shadow-[0_6px_0_0_#be123c] hover:shadow-[0_4px_0_0_#be123c] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px]",
    secondary: "bg-white text-love-600 shadow-[0_6px_0_0_#e2e8f0] border-2 border-slate-100 hover:bg-gray-50 active:shadow-none active:translate-y-[6px]",
    outline: "bg-transparent border-2 border-love-300 text-love-600 shadow-sm hover:bg-love-50",
    danger: "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_6px_0_0_#991b1b] hover:shadow-[0_4px_0_0_#991b1b] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px]",
    ghost: "bg-transparent text-gray-500 hover:text-love-600 hover:bg-love-50/50",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm h-10 min-w-[80px]",
    md: "px-6 py-3 text-base h-14 min-w-[120px]",
    lg: "px-8 py-4 text-lg h-16 min-w-[160px]",
    xl: "px-10 py-5 text-xl h-20 min-w-[200px] text-2xl tracking-wide",
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {/* Shimmer Effect for Primary/Danger */}
      {(variant === 'primary' || variant === 'danger') && (
        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer" />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};