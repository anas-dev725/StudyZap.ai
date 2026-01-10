import React, { useState } from 'react';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'danger' | 'yellow'; 
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseStyle = "px-6 py-3 rounded-2xl font-heading font-bold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 text-base tracking-wide shadow-sm";
  
  const variants = {
    primary: "bg-brand-purple hover:bg-violet-700 text-white shadow-[0_4px_0_rgb(109,40,217)] hover:shadow-[0_2px_0_rgb(109,40,217)] hover:translate-y-[2px]",
    secondary: "bg-brand-orange hover:bg-orange-600 text-white shadow-[0_4px_0_rgb(194,65,12)] hover:shadow-[0_2px_0_rgb(194,65,12)] hover:translate-y-[2px]",
    yellow: "bg-brand-yellow hover:bg-yellow-500 text-brand-dark shadow-[0_4px_0_rgb(202,138,4)] hover:shadow-[0_2px_0_rgb(202,138,4)] hover:translate-y-[2px]",
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_0_rgb(190,18,60)] hover:shadow-[0_2px_0_rgb(190,18,60)] hover:translate-y-[2px]",
    outline: "border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-brand-purple hover:text-brand-purple bg-transparent",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    glass: "bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl transition-all duration-300 ${className.includes('bg-') ? className : 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700'} ${className}`}>
    {children}
  </div>
);

export const Input = ({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange,
  className = "" 
}: { 
  label: string; 
  type?: string; 
  placeholder?: string; 
  value?: string; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  className?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-2 mb-4 ${className}`}>
      <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          type={inputType} 
          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/20 transition-all outline-none font-body font-semibold text-lg"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-purple transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

export const ThemeToggle = ({ isDark, toggle }: { isDark: boolean; toggle: () => void }) => (
  <button 
    onClick={toggle}
    className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-110 transition-transform shadow-sm border-2 border-slate-200 dark:border-slate-700"
  >
    {isDark ? <Sun size={20} className="fill-current" /> : <Moon size={20} className="fill-current" />}
  </button>
);

export const MarkdownText = ({ text, className = '' }: { text: string, className?: string }) => {
  const renderLine = (line: string, index: number) => {
    // Headers
    if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-heading font-bold mt-6 mb-3 text-brand-purple dark:text-brand-yellow flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-purple dark:bg-brand-yellow inline-block"></span>{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-heading font-bold mt-8 mb-4 pb-2 border-b-2 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">{line.replace('## ', '')}</h2>;
    
    // Bold Block (entire line bold)
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
       return <strong key={index} className="block mt-4 mb-2 text-lg font-bold text-slate-900 dark:text-white bg-brand-yellow/10 dark:bg-brand-yellow/20 px-3 py-1.5 rounded-lg w-fit border-l-4 border-brand-yellow">{line.replace(/\*\*/g, '')}</strong>;
    }
    
    // List Items
    if (line.startsWith('- ')) return <li key={index} className="ml-4 mb-2 pl-2 relative text-slate-600 dark:text-slate-300 font-medium list-none flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-purple shrink-0"></span><span>{renderInlineText(line.replace('- ', ''))}</span></li>;
    
    // Empty line
    if (line.trim() === '') return <div key={index} className="h-4" />;
    
    // Paragraph
    return (
      <p key={index} className="mb-3 leading-7 text-slate-600 dark:text-slate-300 text-[16px]">
        {renderInlineText(line)}
      </p>
    );
  };

  const renderInlineText = (text: string) => {
    // Regex to match **bold** text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-brand-dark dark:text-white">{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`font-body ${className}`}>
      {text.split('\n').map((line, idx) => renderLine(line, idx))}
    </div>
  );
};