import React, { useState, useEffect } from 'react';
import { Camera, RotateCcw } from 'lucide-react';

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
    // 1. Load permanent church logo from server
    fetch('/api/logo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.logo) {
          setCustomLogo(data.logo);
          try {
            localStorage.setItem(STORAGE_KEY_LOGO, data.logo);
          } catch {
            // ignore
          }
        } else {
          // If server has no logo yet but this client already uploaded one, sync to server disk
          const local = localStorage.getItem(STORAGE_KEY_LOGO);
          if (local) {
            fetch('/api/logo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logo: local }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
      try {
        setCustomLogo(localStorage.getItem(STORAGE_KEY_LOGO));
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('ephesians_logo_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('ephesians_logo_updated', handleUpdate);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 512;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92);
          try {
            localStorage.setItem(STORAGE_KEY_LOGO, compressed);
            setCustomLogo(compressed);
            window.dispatchEvent(new Event('ephesians_logo_updated'));
            // Persist permanently to backend server disk
            fetch('/api/logo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logo: compressed }),
            }).catch(() => {});
          } catch {
            // ignore
          }
        }
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(STORAGE_KEY_LOGO);
      setCustomLogo(null);
      window.dispatchEvent(new Event('ephesians_logo_updated'));
      fetch('/api/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: null }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const logoMark = customLogo ? (
    <div className={`relative ${sizeClasses[size]} shrink-0 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500/40 bg-slate-900 flex items-center justify-center p-0.5 ${className}`}>
      <img
        src={customLogo}
        alt="Ephesians Outreach Logo"
        className="w-full h-full object-contain rounded-xl"
        referrerPolicy="no-referrer"
      />
    </div>
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-2xl relative flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-950 border-2 border-emerald-400/50 shrink-0 ${className}`}
      title="Ephesians Outreach Church Emblem"
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
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FACC15" />
            <stop offset="70%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="50" cy="40" r="38" fill="url(#sunGlow)" />

        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#goldGradient)"
          strokeWidth="3"
        />
        <circle
          cx="50"
          cy="50"
          r="41"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />

        {/* Radiant Divine Rays */}
        <path
          d="M50 12 L50 20 M50 80 L50 88 M12 50 L20 50 M80 50 L88 50 M23 23 L29 29 M71 71 L77 77 M77 23 L71 29 M23 77 L29 71"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Open Holy Bible Base */}
        <path
          d="M24 72 C35 66, 47 68, 50 71 C53 68, 65 66, 76 72 L76 60 C65 55, 53 57, 50 60 C47 57, 35 55, 24 60 Z"
          fill="#FFFFFF"
          opacity="0.95"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
        />
        <path
          d="M50 60 L50 71"
          stroke="#0F172A"
          strokeWidth="1.5"
        />

        {/* Christian Cross with Gold Gradient and 3D Bevel */}
        <rect
          x="46"
          y="20"
          width="8"
          height="38"
          rx="2"
          fill="url(#goldGradient)"
          filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
        />
        <rect
          x="32"
          y="29"
          width="36"
          height="8"
          rx="2"
          fill="url(#goldGradient)"
          filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
        />

        {/* Crown / Dove Wing Grace Arc */}
        <path
          d="M36 55 C43 49, 50 51, 50 51 C50 51, 57 49, 64 55"
          stroke="#FEF08A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative group shrink-0">
        {logoMark}

        {allowUpload && (
          <div className="absolute -bottom-1 -right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <label
              title="Upload / Change Church Logo"
              className="w-5 h-5 rounded-full bg-slate-900 border border-emerald-500 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center justify-center cursor-pointer shadow-md transition-colors text-[10px]"
            >
              <Camera className="w-3 h-3" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {customLogo && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleResetLogo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleResetLogo(e as any);
                  }
                }}
                title="Reset to default official crest"
                className="w-5 h-5 rounded-full bg-slate-900 border border-rose-500 text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center cursor-pointer shadow-md transition-colors text-[10px]"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span
            className={`font-black tracking-tight text-base sm:text-lg ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            Ephesians Outreach
          </span>
          <span className="text-[11px] text-emerald-500 font-extrabold tracking-widest uppercase">
            Church Ministry
          </span>
        </div>
      )}
    </div>
  );
};
