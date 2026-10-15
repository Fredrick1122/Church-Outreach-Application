import React from 'react';
import {
  PlusCircle,
  BarChart3,
  ListOrdered,
  Users,
  Lock,
  Bell,
  LogOut,
  LogIn,
  Sparkles,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import { UserProfile, isGeneralOverseer, isCouncilOverseer, isGovernor } from '../types';
import { AppLogo } from './AppLogo';

export type NavTab = 'form' | 'dashboard' | 'operations' | 'converts' | 'audit' | 'people';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile | null;
  onOpenAccountSwitcher: () => void;
  onLogout?: () => void;
  pendingSyncCount: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenScriptureMotivation?: (tab?: 'soul_winning' | 'evangelism') => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  theme = 'dark',
  onToggleTheme,
}) => {
  const isAdm = currentUser?.role === 'admin';
  const isGenOverseer = currentUser ? isGeneralOverseer(currentUser.role) : false;
  const isCnlOverseer = currentUser ? isCouncilOverseer(currentUser.role) : false;
  const isGov = currentUser ? isGovernor(currentUser.role) : false;
  const hasDashboardAccess = isAdm || isGenOverseer || isCnlOverseer || isGov;
  const hasLedgerAccess = isAdm || isGenOverseer || isCnlOverseer || isGov;
  const hasAuditAccess = isAdm || isGenOverseer || isCnlOverseer;
  const hasPeopleAccess = isAdm;

  const dashboardLabel = isAdm
    ? 'Admin Command'
    : isGenOverseer
    ? 'General Overseer'
    : isCnlOverseer
    ? `${currentUser?.council || 'Council'} Overseer`
    : isGov
    ? 'Governorship Dashboard'
    : 'Dashboard';

  return (
    <>
      {/* Strict Section 2 Top Bar Contract */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <AppLogo size="md" allowUpload={true} theme={theme} />
            <button
              type="button"
              onClick={() => onSelectTab('form')}
              className={`text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}
            >
              Ephesians Outreach
            </button>
          </div>

          {/* Zone 2: Navigation menus - SHOWN ONLY IF LOGGED IN AS A POSITION */}
          {currentUser && (
            <nav className={`hidden md:flex items-center gap-6 text-sm font-semibold ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}>
              <button
                onClick={() => onSelectTab('form')}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'form'
                    ? 'text-emerald-500 underline underline-offset-8 decoration-2 font-bold'
                    : theme === 'light' ? 'hover:text-slate-900' : 'hover:text-white'
                }`}
              >
                Upload Form
              </button>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'text-emerald-500 underline underline-offset-8 decoration-2 font-bold'
                    : theme === 'light' ? 'hover:text-slate-900' : 'hover:text-white'
                }`}
              >
                <span>{dashboardLabel}</span>
                {!hasDashboardAccess && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
              <button
                onClick={() => onSelectTab('operations')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'operations'
                    ? 'text-emerald-500 underline underline-offset-8 decoration-2 font-bold'
                    : theme === 'light' ? 'hover:text-slate-900' : 'hover:text-white'
                }`}
              >
                <span>Operations Log</span>
                {!hasLedgerAccess && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
              <button
                onClick={() => onSelectTab('converts')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'converts'
                    ? 'text-emerald-500 underline underline-offset-8 decoration-2 font-bold'
                    : theme === 'light' ? 'hover:text-slate-900' : 'hover:text-white'
                }`}
              >
                <span>Converts CRM</span>
                {!hasLedgerAccess && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
              {hasAuditAccess && (
                <button
                  onClick={() => onSelectTab('audit')}
                  className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'audit'
                      ? 'text-emerald-500 underline underline-offset-8 decoration-2 font-bold'
                      : theme === 'light' ? 'hover:text-slate-900' : 'hover:text-white'
                  }`}
                >
                  <span>Storage & Audit</span>
                </button>
              )}
              {hasPeopleAccess && (
                <button
                  onClick={() => onSelectTab('people')}
                  className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'people'
                      ? 'text-emerald-500 underline underline-offset-8 decoration-2 font-bold'
                      : theme === 'light' ? 'hover:text-slate-900' : 'hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Registered People</span>
                </button>
              )}
            </nav>
          )}

          {/* Zone 3: Actions, Motivation, Theme Toggle & Leadership Login */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* White / Dark Mode Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-colors shrink-0 flex items-center justify-center cursor-pointer ${
                  theme === 'light'
                    ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'border-slate-700/80 bg-slate-800/80 hover:bg-slate-800 text-amber-300'
                }`}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to White (Light) Mode'}
                aria-label="Toggle theme mode"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-700" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-300" />
                )}
              </button>
            )}

            {/* Live Scripture Tabs: Soul Winning & Evangelism */}
            {onOpenScriptureMotivation && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenScriptureMotivation('soul_winning')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/35 hover:to-amber-600/35 border border-amber-500/50 text-amber-300 hover:text-white transition-all text-xs font-bold shadow-xs shrink-0 cursor-pointer"
                  title="Open Scriptures on Soul Winning"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Soul Winning</span>
                  <span className="sm:hidden">Souls</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenScriptureMotivation('evangelism')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/35 hover:to-teal-600/35 border border-emerald-500/50 text-emerald-300 hover:text-white transition-all text-xs font-bold shadow-xs shrink-0 cursor-pointer"
                  title="Open Scriptures on Evangelism"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Evangelism</span>
                  <span className="sm:hidden">Evangelism</span>
                </button>
              </div>
            )}

            {currentUser ? (
              <>
                {/* Real-time Notification Center Bell */}
                <button
                  onClick={onOpenNotifications}
                  className={`relative p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                    theme === 'light'
                      ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
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
                  className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                    theme === 'light'
                      ? 'border-slate-300 bg-slate-100 hover:bg-slate-200'
                      : 'border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800'
                  }`}
                  title="Active leadership session"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${currentUser.avatarColor}`}
                  >
                    {currentUser.avatarInitials}
                  </div>
                  <div className="hidden sm:block text-left text-xs leading-tight">
                    <span className={`font-semibold block truncate max-w-[140px] ${
                      theme === 'light' ? 'text-slate-900' : 'text-slate-100'
                    }`}>
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block truncate max-w-[150px]">
                      {isAdm
                        ? (currentUser.email.toLowerCase() === 'dogbatseyfredrick@gmail.com' ? 'Lead Admin' : (currentUser.roleTitle || 'Admin'))
                        : isGenOverseer
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
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-rose-800/50 hover:border-rose-700 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Log Out to Public Outreach Upload Interface"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                )}
              </>
            ) : (
              /* Public / Unauthenticated state: prominent Login button */
              <button
                type="button"
                onClick={onOpenAccountSwitcher}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar - ONLY SHOWN IF LOGGED IN */}
      {currentUser && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
          <div className={`grid ${hasPeopleAccess ? 'grid-cols-5' : 'grid-cols-4'} items-center h-16 px-1`}>
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
                {isAdm ? 'Admin' : isGov ? 'Governor' : isCnlOverseer ? 'Council' : 'Overseer'}
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

            {hasPeopleAccess && (
              <button
                onClick={() => onSelectTab('people')}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                  activeTab === 'people' ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] tracking-tight mt-1">People</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
