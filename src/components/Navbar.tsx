import React from 'react';
import {
  PlusCircle,
  BarChart3,
  ListOrdered,
  Users,
  Shield,
  FileCheck2,
  Lock,
  Bell,
  LogOut,
  LogIn,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { UserProfile, isGeneralOverseer, isCouncilOverseer, isGovernor } from '../types';

export type NavTab = 'form' | 'dashboard' | 'operations' | 'converts' | 'audit';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile | null;
  onOpenAccountSwitcher: () => void;
  onLogout?: () => void;
  pendingSyncCount: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenScriptureMotivation?: () => void;
  onOpenRegisterModal?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAccountSwitcher,
  onLogout,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenScriptureMotivation,
  onOpenRegisterModal,
}) => {
  const isGenOverseer = currentUser ? isGeneralOverseer(currentUser.role) : false;
  const isCnlOverseer = currentUser ? isCouncilOverseer(currentUser.role) : false;
  const isGov = currentUser ? isGovernor(currentUser.role) : false;
  const hasDashboardAccess = isGenOverseer || isCnlOverseer || isGov;
  const hasLedgerAccess = isGenOverseer || isCnlOverseer || isGov;
  const hasAuditAccess = isGenOverseer || isCnlOverseer;

  const dashboardLabel = isGenOverseer
    ? 'General Overseer'
    : isCnlOverseer
    ? `${currentUser?.council || 'Council'} Overseer`
    : isGov
    ? 'Governorship Dashboard'
    : 'Dashboard';

  return (
    <>
      {/* Strict Section 2 Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onSelectTab('form')}
              className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                EO
              </span>
              <span>Ephesians Outreach</span>
            </button>
          </div>

          {/* Zone 2: Navigation menus - SHOWN ONLY IF LOGGED IN AS A POSITION */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
              <button
                onClick={() => onSelectTab('form')}
                className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'form' ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold' : ''
                }`}
              >
                Upload Form
              </button>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                    : ''
                }`}
              >
                <span>{dashboardLabel}</span>
                {!hasDashboardAccess && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
              <button
                onClick={() => onSelectTab('operations')}
                className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'operations'
                    ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                    : ''
                }`}
              >
                <span>Operations Log</span>
                {!hasLedgerAccess && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
              <button
                onClick={() => onSelectTab('converts')}
                className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'converts'
                    ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                    : ''
                }`}
              >
                <span>Converts CRM</span>
                {!hasLedgerAccess && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
              {hasAuditAccess && (
                <button
                  onClick={() => onSelectTab('audit')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'audit'
                      ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                      : ''
                  }`}
                >
                  <span>Storage & Audit</span>
                </button>
              )}
            </nav>
          )}

          {/* Zone 3: Actions, Motivation, Account Space & Login */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* AI Scripture Motivation Pop-up Trigger */}
            {onOpenScriptureMotivation && (
              <button
                onClick={onOpenScriptureMotivation}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all text-xs font-bold shadow-xs shrink-0"
                title="AI Pop-up Scripture Motivation on Evangelism & Soul Winning"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Scripture Word</span>
                <span className="sm:hidden">Word</span>
              </button>
            )}

            {currentUser ? (
              <>
                {/* Create Account Button for General Overseer, Overseer, Governor, Admin */}
                {onOpenRegisterModal && (
                  <button
                    onClick={onOpenRegisterModal}
                    className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-semibold shrink-0"
                    title="Create / Register Accounts for Others"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">+ Register Account</span>
                    <span className="sm:hidden">+ User</span>
                  </button>
                )}

                {/* Real-time Notification Center Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 transition-colors text-slate-300 hover:text-white shrink-0"
                  title="Real-time Ministry Alerts & Objectives"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 ? (
                    <>
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[9px] flex items-center justify-center shadow-xs">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-75 pointer-events-none" />
                    </>
                  ) : null}
                </button>

                <button
                  onClick={onOpenAccountSwitcher}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 transition-colors shrink-0"
                  title="Active leadership session"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${currentUser.avatarColor}`}
                  >
                    {currentUser.avatarInitials}
                  </div>
                  <div className="hidden sm:block text-left text-xs leading-tight">
                    <span className="font-semibold text-slate-100 block truncate max-w-[140px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block truncate max-w-[150px]">
                      {isGenOverseer
                        ? 'General Overseer'
                        : isCnlOverseer
                        ? `${currentUser.council} Overseer`
                        : isGov
                        ? `${currentUser.governorship || 'Governor'}`
                        : currentUser.roleTitle}
                    </span>
                  </div>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-700/80 hover:border-rose-700 bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Log Out to Public Outreach Upload Interface"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                )}
              </>
            ) : (
              /* Public / Unauthenticated state: prominent Leadership Login button */
              <button
                onClick={onOpenAccountSwitcher}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Leadership Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar - ONLY SHOWN IF LOGGED IN */}
      {currentUser && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
          <div className="grid grid-cols-4 items-center h-16 px-1">
            <button
              onClick={() => onSelectTab('form')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'form' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Upload</span>
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <BarChart3 className="w-5 h-5" />
                {!hasDashboardAccess && <Lock className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />}
              </div>
              <span className="text-[10px] tracking-tight mt-1">
                {isGov ? 'Governor' : isCnlOverseer ? 'Council' : 'Overseer'}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('operations')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'operations' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <ListOrdered className="w-5 h-5" />
                {!hasLedgerAccess && <Lock className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />}
              </div>
              <span className="text-[10px] tracking-tight mt-1">Operations</span>
            </button>

            <button
              onClick={() => onSelectTab('converts')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'converts' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                {!hasLedgerAccess && <Lock className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />}
              </div>
              <span className="text-[10px] tracking-tight mt-1">Converts</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
