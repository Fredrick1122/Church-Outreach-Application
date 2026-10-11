import React from 'react';
import { X, Check, Shield, User, Lock, Eye, ShieldAlert } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { SYSTEM_USERS } from '../services/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
}

export const AccountSwitcherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'governor':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'leader':
        return 'bg-amber-950 text-amber-300 border-amber-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              EO
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Multi-Level Account Authentication</h3>
              <p className="text-xs text-slate-400">Switch role to test access boundaries and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Options */}
        <div className="p-6 space-y-3 overflow-y-auto">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Select Active Ministry Account
          </label>

          {SYSTEM_USERS.map((user) => {
            const isSelected = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${user.avatarColor}`}>
                    {user.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{user.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getRoleBadge(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{user.email}</p>
                    <p className="text-xs text-slate-400 mt-1">{user.roleTitle} · {user.council}</p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 hover:text-white pt-1 shrink-0 font-medium">Switch</span>
                )}
              </button>
            );
          })}

          {/* RBAC Summary Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Access Control (RBAC) Governance:</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 pl-5 list-disc">
              <li>
                <strong className="text-white">Admin (dogbatseyfredrick@gmail.com):</strong> Full executive rights, cross-council analytics, export tools, threshold alert configuration, and record deletion.
              </li>
              <li>
                <strong className="text-white">Governor:</strong> Oversees all Bacentas within their designated Council. Views council-specific charts and leader rosters.
              </li>
              <li>
                <strong className="text-white">Bacenta Leader:</strong> Focused field logger. Enters instant outreach stats & converts for their specific field assignment.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
