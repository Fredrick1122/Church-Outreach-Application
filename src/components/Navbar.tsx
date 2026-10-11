import React from 'react';
import {
  PlusCircle,
  BarChart3,
  ListOrdered,
  Users,
  Shield,
  FileCheck2,
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab = 'form' | 'dashboard' | 'operations' | 'converts' | 'audit';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile;
  onOpenAccountSwitcher: () => void;
  pendingSyncCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAccountSwitcher,
}) => {
  return (
    <>
      {/* Strict Section 2 Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
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

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <button
              onClick={() => onSelectTab('form')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'form' ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold' : ''
              }`}
            >
              Field Entry
            </button>
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                  : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('operations')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'operations'
                  ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                  : ''
              }`}
            >
              Operations Log
            </button>
            <button
              onClick={() => onSelectTab('converts')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'converts'
                  ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                  : ''
              }`}
            >
              Converts CRM
            </button>
            <button
              onClick={() => onSelectTab('audit')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'audit'
                  ? 'text-emerald-400 underline underline-offset-8 decoration-2 font-bold'
                  : ''
              }`}
            >
              Audit Trail
            </button>
          </nav>

          {/* Zone 3: 1 primary action / Account & Role indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAccountSwitcher}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 transition-colors shrink-0"
              title="Click to switch account & test role permissions"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${currentUser.avatarColor}`}
              >
                {currentUser.avatarInitials}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <span className="font-semibold text-slate-100 block truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {currentUser.role}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            onClick={() => onSelectTab('form')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'form' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">New Entry</span>
          </button>

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Analytics</span>
          </button>

          <button
            onClick={() => onSelectTab('operations')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'operations' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <ListOrdered className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Operations</span>
          </button>

          <button
            onClick={() => onSelectTab('converts')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'converts' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Converts</span>
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'audit' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <FileCheck2 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Audit</span>
          </button>
        </div>
      </div>
    </>
  );
};
