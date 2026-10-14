import React, { useState, useEffect } from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  theme?: 'dark' | 'light';
  allowUpload?: boolean;
}

const STORAGE_KEY_LOGO = 'ephesians_app_logo';

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  theme = 'dark',
  allowUpload = false,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LOGO);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setCustomLogo(localStorage.getItem(STORAGE_KEY_LOGO));
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      try {
        localStorage.setItem(STORAGE_KEY_LOGO, result);
        setCustomLogo(result);
      } catch {
        // ignore quota
      }
    };
    reader.readAsDataURL(file);
  };

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const logoMark = customLogo ? (
    <img
      src={customLogo}
      alt="Ephesians Outreach Logo"
      className={`${sizeClasses[size]} object-contain rounded-xl shadow-md border border-emerald-500/30 ${className}`}
      referrerPolicy="no-referrer"
    />
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-xl relative flex items-center justify-center shadow-md overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border border-emerald-400/40 shrink-0 ${className}`}
      title="Ephesians Outreach Emblem"
    >
      {/* Decorative Gold & Emerald Crest SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#goldGradient)"
          strokeWidth="2.5"
          opacity="0.85"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="#10B981"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.6"
        />

        {/* Radiant Rays */}
        <path
          d="M50 14 L50 20 M50 80 L50 86 M14 50 L20 50 M80 50 L86 50 M24 24 L29 29 M71 71 L76 76 M76 24 L71 29 M24 76 L29 71"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Open Bible Base */}
        <path
          d="M26 67 C36 62, 47 64, 50 67 C53 64, 64 62, 74 67 L74 57 C64 53, 53 55, 50 58 C47 55, 36 53, 26 57 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M50 58 L50 67"
          stroke="#0F172A"
          strokeWidth="1.2"
        />

        {/* Christian Cross */}
        <rect
          x="47"
          y="24"
          width="6"
          height="32"
          rx="1.5"
          fill="url(#goldGradient)"
          filter="url(#glow)"
        />
        <rect
          x="35"
          y="32"
          width="30"
          height="6"
          rx="1.5"
          fill="url(#goldGradient)"
          filter="url(#glow)"
        />

        {/* Alpha & Omega / Holy Spirit Dove Wing Accent */}
        <path
          d="M38 52 C44 47, 50 49, 50 49 C50 49, 56 47, 62 52"
          stroke="#FDE047"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative group">
        {logoMark}

        {allowUpload && (
          <label
            title="Upload custom logo"
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-emerald-400 flex items-center justify-center cursor-pointer shadow opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
          >
            <span>+</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span
            className={`font-black tracking-tight text-sm sm:text-base ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            Ephesians Outreach
          </span>
          <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">
            Church Ministry
          </span>
        </div>
      )}
    </div>
  );
};
