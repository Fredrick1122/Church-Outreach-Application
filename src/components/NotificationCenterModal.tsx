import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Target,
  Sparkles,
  CheckCheck,
  Trash2,
  Radio,
  Clock,
  Layers,
} from 'lucide-react';
import { LiveNotification, UserProfile } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../services/realtime';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: LiveNotification[];
  currentUser: UserProfile;
  presenceCount: number;
  onNavigateToTab: (tab: 'form' | 'operations' | 'dashboard') => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  presenceCount,
  onNavigateToTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMin = Math.round((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Ministry Real-Time Alerts</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            {/* Live Presence Indicator */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time WebSocket active ({presenceCount} worker{presenceCount === 1 ? '' : 's'} online)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Filter Tabs */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                title="Clear all alerts"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">No Notifications</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {filter === 'unread'
                  ? 'All real-time notifications have been marked as read.'
                  : 'Real-time alerts will appear instantly when the admin establishes a new field objective or when submitted operations are approved.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isApproval = notif.type === 'outreach_approved';
              const isObjective = notif.type === 'objective_created';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) markNotificationAsRead(notif.id);
                  }}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer ${
                    notif.read ? 'bg-slate-900/40 hover:bg-slate-850' : 'bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                        isApproval
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : isObjective
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-blue-950 text-blue-400 border-blue-800'
                      }`}
                    >
                      {isApproval && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isObjective && <Target className="w-4 h-4 text-amber-400" />}
                      {!isApproval && !isObjective && <Bell className="w-4 h-4 text-blue-400" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isApproval
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isObjective
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {isApproval ? 'Outreach Approved' : isObjective ? 'Field Objective' : 'Notice'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{formatTime(notif.timestamp)}</span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>

                      <h4 className={`text-xs font-bold mt-1 ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Links */}
                      <div className="mt-2 flex items-center gap-2">
                        {isApproval && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notif.id);
                              onClose();
                              onNavigateToTab('operations');
                            }}
                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            Open Master Operations Log →
                          </button>
                        )}
                        {isObjective && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notif.id);
                              onClose();
                              onNavigateToTab('form');
                            }}
                            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline"
                          >
                            Review Objective Directives →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Real-time push alerts enabled for Field Leaders & Councils
          </p>
        </div>
      </div>
    </div>
  );
};
