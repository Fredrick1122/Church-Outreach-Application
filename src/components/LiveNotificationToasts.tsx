import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, X, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { LiveNotification } from '../types';
import { subscribeToRealtimeToast } from '../services/realtime';

export const LiveNotificationToasts: React.FC<{
  onNavigateToTab?: (tab: 'operations' | 'dashboard' | 'form') => void;
}> = ({ onNavigateToTab }) => {
  const [activeToasts, setActiveToasts] = useState<LiveNotification[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeToast((notification) => {
      setActiveToasts((prev) => [notification, ...prev.slice(0, 3)]);

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setActiveToasts((current) => current.filter((t) => t.id !== notification.id));
      }, 8000);
    });

    return unsubscribe;
  }, []);

  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {activeToasts.map((toast) => {
        const isApproval = toast.type === 'outreach_approved';
        const isObjective = toast.type === 'objective_created';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border backdrop-blur-md transition-all transform translate-y-0 animate-fadeIn ${
              isApproval
                ? 'bg-slate-900/95 border-emerald-500/80 text-slate-100 shadow-emerald-950/40'
                : isObjective
                ? 'bg-slate-900/95 border-amber-500/80 text-slate-100 shadow-amber-950/40'
                : 'bg-slate-900/95 border-blue-500/80 text-slate-100 shadow-blue-950/40'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon Indicator */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isApproval
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-700/80'
                    : isObjective
                    ? 'bg-amber-950 text-amber-400 border-amber-700/80'
                    : 'bg-blue-950 text-blue-400 border-blue-700/80'
                }`}
              >
                {isApproval && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isObjective && <Target className="w-5 h-5 text-amber-400" />}
                {!isApproval && !isObjective && <Bell className="w-5 h-5 text-blue-400" />}
              </div>

              {/* Toast Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isApproval
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : isObjective
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {isApproval ? 'Approval Notice' : isObjective ? 'New Mandate' : 'System Notice'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {toast.message}
                </p>

                {/* Quick Action Button */}
                <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      dismissToast(toast.id);
                      if (onNavigateToTab) {
                        if (isApproval) onNavigateToTab('operations');
                        else if (isObjective) onNavigateToTab('form');
                      }
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                  >
                    <span>{isApproval ? 'View in Operations Log' : 'View Field Objective'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Dismiss X */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white shrink-0 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
