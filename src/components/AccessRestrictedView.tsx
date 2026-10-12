import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, UserCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  currentUser: UserProfile | null;
  onSwitchAccount: () => void;
  onGoToForm: () => void;
  attemptedSection: string;
}

export const AccessRestrictedView: React.FC<Props> = ({
  currentUser,
  onSwitchAccount,
  onGoToForm,
  attemptedSection,
}) => {
  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 rounded-full" />

        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/50 border border-rose-800/50 rounded-full mb-3">
          {currentUser ? 'Role Authorization Required' : 'Leadership Login Required'}
        </span>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Executive Access Restricted
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
          Access to the <strong>{attemptedSection}</strong>, oversight dashboards, and master database is strictly restricted.
          {currentUser
            ? ` Your current account does not have sufficient oversight privileges for this section.`
            : ` For a user to get access anywhere, you must log into your leadership account as General Overseer, Council Overseer, or Governor.`}
        </p>

        {/* Current user badge */}
        {currentUser ? (
          <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-left flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${currentUser.avatarColor}`}>
                {currentUser.avatarInitials}
              </div>
              <div>
                <p className="font-semibold text-slate-100">{currentUser.name}</p>
                <p className="text-slate-400 text-[11px]">{currentUser.email}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-amber-950 text-amber-300 border border-amber-800">
              {currentUser.role}
            </span>
          </div>
        ) : (
          <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-400">
            Currently not logged in. Menus and oversight sections are locked.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onSwitchAccount}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <KeyRound className="w-4 h-4" />
            <span>{currentUser ? 'Switch Leadership Account' : 'Log In to Leadership Account'}</span>
          </button>

          <button
            onClick={onGoToForm}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Outreach Upload Form</span>
          </button>
        </div>
      </div>
    </div>
  );
};
