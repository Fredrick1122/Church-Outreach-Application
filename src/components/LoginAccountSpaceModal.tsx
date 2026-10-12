import React, { useState } from 'react';
import {
  LogIn,
  X,
  Shield,
  Building2,
  Users,
  CheckCircle2,
  Lock,
  Mail,
  UserPlus,
  ArrowRight,
  LogOut,
  AlertCircle,
  KeyRound,
  Layers,
} from 'lucide-react';
import {
  UserProfile,
  isGeneralOverseer,
  isCouncilOverseer,
  isGovernor,
  isLeader,
} from '../types';
import { getUsers, loginUser, setCurrentUser } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onOpenRegisterModal?: () => void;
  onLogout?: () => void;
}

export const LoginAccountSpaceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onOpenRegisterModal,
  onLogout,
}) => {
  const users = getUsers();
  const [activeTab, setActiveTab] = useState<'quick' | 'form'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = loginUser(email, password);
      onSelectUser(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickLogin = (user: UserProfile) => {
    setCurrentUser(user);
    onSelectUser(user);
    onClose();
  };

  const generalOverseers = users.filter((u) => isGeneralOverseer(u.role));
  const councilOverseers = users.filter((u) => isCouncilOverseer(u.role));
  const governors = users.filter((u) => isGovernor(u.role));
  const leaders = users.filter((u) => isLeader(u.role));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Ministry Login & Account Space
              </h3>
              <p className="text-xs text-slate-400">
                Log in as General Overseer, Council Overseer, Governor, or Leader
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currently Logged In Status Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${currentUser.avatarColor}`}
                >
                  {currentUser.avatarInitials}
                </div>
                <div>
                  <span className="text-slate-400">Current Session: </span>
                  <strong className="text-white">{currentUser.name}</strong>
                  <span className="text-emerald-400 font-semibold ml-1.5 capitalize">
                    ({currentUser.roleTitle})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isGeneralOverseer(currentUser.role)
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : isCouncilOverseer(currentUser.role)
                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                      : isGovernor(currentUser.role)
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {currentUser.role.replace('_', ' ')}
                </span>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900 border border-rose-800 transition-colors"
                  >
                    Log Out
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-400 text-xs">
                Status: <strong className="text-slate-200">Public Outreach Uploader</strong> (Not logged in)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                Menus Restricted
              </span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('quick')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'quick'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Directory & Quick Switch ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'form'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Email & Password Sign In
            </button>
          </div>

          {/* Admin Action to Register Users */}
          {onOpenRegisterModal && (
            <button
              onClick={() => {
                onClose();
                onOpenRegisterModal();
              }}
              className="pb-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register Overseer / Governor</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'form' ? (
            /* EMAIL & PASSWORD LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto py-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Ministry Account Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. bishop.nakoja@ephesiansoutreach.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Password / PIN *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Quick Autofill Credentials:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('bishop.nakoja@ephesiansoutreach.org');
                        setPassword('password123');
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-semibold transition-colors"
                    >
                      Fill General Overseer (Bishop Isaac Nakoja)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('pastor.ofori@ephesiansoutreach.org');
                        setPassword('password123');
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-[10px] font-semibold transition-colors"
                    >
                      Fill Council Overseer (Pastor Ofori - Eph 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('pastor.michael@ephesiansoutreach.org');
                        setPassword('password123');
                      }}
                      className="px-2 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-[10px] font-semibold transition-colors"
                    >
                      Fill Governor (Pastor Mensah - Gov Alpha)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('dogbatseyfredrick@gmail.com');
                        setPassword('password123');
                      }}
                      className="px-2 py-1 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-800 text-teal-300 text-[10px] font-semibold transition-colors"
                    >
                      Fill Admin (Fredrick)
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to Ministry Space</span>
              </button>
            </form>
          ) : (
            /* QUICK SELECT DIRECTORY BY ROLE AUTHORITY */
            <div className="space-y-4">
              {/* SECTION 1: GENERAL OVERSEER & LEAD ADMIN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GENERAL OVERSEER (All 5 Councils Across Board)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{generalOverseers.length} accounts</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {generalOverseers.map((user) => {
                    const isSelected = currentUser.id === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleQuickLogin(user)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500/80 shadow-xs'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.avatarColor}`}
                          >
                            {user.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{user.name}</span>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                {user.role === 'admin' ? 'Operations Admin' : 'General Overseer'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {user.roleTitle} · {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Active</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                            >
                              Log In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: COUNCIL OVERSEERS (Pastors over the 5 Councils) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>COUNCIL OVERSEERS (Pastors Over Each of the 5 Councils)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{councilOverseers.length} accounts</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {councilOverseers.map((user) => {
                    const isSelected = currentUser.id === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleQuickLogin(user)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500/80 shadow-xs'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.avatarColor}`}
                          >
                            {user.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{user.name}</span>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                {user.council}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {user.roleTitle} · {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Active</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                            >
                              Log In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: GOVERNORS (Under Councils) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>GOVERNORS (Overseeing Governorships & Their Bacentas)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{governors.length} accounts</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {governors.map((user) => {
                    const isSelected = currentUser.id === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleQuickLogin(user)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-950/50 border-blue-500/80 shadow-xs'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.avatarColor}`}
                          >
                            {user.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{user.name}</span>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                {user.governorship || user.council}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {user.council} · {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Active</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                            >
                              Log In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: BACENTA FIELD LEADERS */}
              {leaders.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-rose-400" />
                      <span>BACENTA FIELD LEADERS</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{leaders.length} accounts</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {leaders.map((user) => {
                      const isSelected = currentUser.id === user.id;
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleQuickLogin(user)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-rose-950/50 border-rose-500/80 shadow-xs'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.avatarColor}`}
                            >
                              {user.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">{user.name}</span>
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                  {user.bacenta || user.council}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                {user.governorship ? `${user.governorship} · ` : ''}
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected ? (
                              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Active</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                              >
                                Log In
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Hierarchy: General Overseer → 5 Councils (Ephesians 1-5) → Governorships → Bacentas.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
