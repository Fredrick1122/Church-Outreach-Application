import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Shield,
  User,
  Lock,
  Building,
  Crown,
  KeyRound,
  Search,
  ArrowRight,
  Sparkles,
  Users,
  LogOut,
  Mail,
  Layers,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { getUsers, setCurrentUser, getCurrentUser } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onOpenRegisterUser?: () => void;
}

export const LoginAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onOpenRegisterUser,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'direct'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Direct login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const allUsers = getUsers();

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'overseer':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'governor':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'leader':
        return 'bg-amber-950 text-amber-300 border-amber-800';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'overseer':
        return <Crown className="w-3.5 h-3.5 text-purple-400" />;
      case 'governor':
        return <Building className="w-3.5 h-3.5 text-indigo-400" />;
      case 'leader':
        return <User className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.council.toLowerCase().includes(q) ||
        u.roleTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Grouped users for organized display
  const overseers = filteredUsers.filter((u) => u.role === 'overseer');
  const governors = filteredUsers.filter((u) => u.role === 'governor');
  const admins = filteredUsers.filter((u) => u.role === 'admin');
  const leaders = filteredUsers.filter((u) => u.role === 'leader');

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanEmail = loginEmail.trim().toLowerCase();
    const found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (found) {
      onSelectUser(found);
      onClose();
    } else {
      setLoginError(
        `No registered account found with email "${loginEmail}". Please check spelling or select from the role list below.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-base shadow-md">
              EO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  Ministry Account & Authentication Space
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Log in as Overseer, Governor (Ephesians 1-6), Admin, or Field Leader
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

        {/* Current User Active Session Strip */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400">Current Active Session:</span>
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${currentUser.role === 'overseer' ? 'bg-purple-400' : currentUser.role === 'governor' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
              <strong className="text-slate-100">{currentUser.name}</strong>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${getRoleBadge(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
          <span className="text-slate-400 text-[11px]">
            Council: <strong className="text-slate-200">{currentUser.council}</strong>
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between gap-4 border-b border-slate-800/60 bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'quick'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>One-Click Role Login</span>
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Email & Credential Login</span>
            </button>
          </div>

          {onOpenRegisterUser && (currentUser.role === 'admin' || currentUser.role === 'overseer') && (
            <button
              onClick={() => {
                onClose();
                onOpenRegisterUser();
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 flex items-center gap-1"
            >
              <span>+ Register New User</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'direct' ? (
            /* Email Credential Sign In */
            <form onSubmit={handleDirectLogin} className="space-y-4 max-w-md mx-auto py-2">
              <div className="text-center space-y-1 mb-4">
                <h4 className="text-sm font-bold text-white">Log in with Registered Credentials</h4>
                <p className="text-xs text-slate-400">
                  Enter your assigned ministry email to access your executive dashboard.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                  {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ministry Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. overseer.mensah@ephesiansoutreach.org"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Passcode / Security PIN (Optional for Demo)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors pt-3"
              >
                <span>Authorize & Log In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className="text-xs text-slate-400 hover:text-emerald-400 font-medium"
                >
                  Or choose directly from the Quick Role Sign-In list →
                </button>
              </div>
            </form>
          ) : (
            /* Quick Role Sign In */
            <div className="space-y-4">
              {/* Filter and search bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, governor, council, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'overseer', 'governor', 'admin', 'leader'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                        roleFilter === r
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r === 'all' ? 'All Roles' : `${r}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 1: General Overseer */}
              {(roleFilter === 'all' || roleFilter === 'overseer') && overseers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-400 px-1">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5" />
                      Regional General Overseership
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Full 6-Council Oversight</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {overseers.map((user) => renderUserCard(user))}
                  </div>
                </div>
              )}

              {/* Group 2: Governors of Councils 1 to 6 */}
              {(roleFilter === 'all' || roleFilter === 'governor') && governors.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400 px-1">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Building className="w-3.5 h-3.5" />
                      Governorship Pastors · Councils (Ephesians 1 to 6)
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Access Restricted to Own Council
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {governors.map((user) => renderUserCard(user))}
                  </div>
                </div>
              )}

              {/* Group 3: Operations Administrators */}
              {(roleFilter === 'all' || roleFilter === 'admin') && admins.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 px-1">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Shield className="w-3.5 h-3.5" />
                      Operations Administration
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">System & User Registration</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {admins.map((user) => renderUserCard(user))}
                  </div>
                </div>
              )}

              {/* Group 4: Field Leaders */}
              {(roleFilter === 'all' || roleFilter === 'leader') && leaders.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 px-1">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <User className="w-3.5 h-3.5" />
                      Bacenta Leaders & Field Evangelists
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Field Data Reporting</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {leaders.map((user) => renderUserCard(user))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RBAC Governance Summary Box */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-white text-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Ministry Hierarchy & Access Permissions (RBAC):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-purple-300 block mb-1">1. Overseer (General Overseer):</strong>
                Full executive vision across all 6 Governorships (Ephesians 1 to 6). Access to inspect all entries and database for each bacenta under all councils.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-indigo-300 block mb-1">2. Governor (Governorship Pastors):</strong>
                Assigned to a specific council (e.g. Ephesians 2). Access strictly limited to all bacentas and data under their own council only.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-emerald-300 block mb-1">3. Operations Admin:</strong>
                Can register new users as Overseer or Governor, configure alert rules, manage cloud storage, and oversee operations.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-amber-300 block mb-1">4. Field Leader (Bacenta):</strong>
                Reports weekly evangelism, souls won, leaders present, and converts under their assigned bacenta.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Selected account updates real-time presence and authorization instantly.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-850 border border-slate-700 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  function renderUserCard(user: UserProfile) {
    const isSelected = user.id === currentUser.id;
    return (
      <button
        key={user.id}
        onClick={() => {
          onSelectUser(user);
          onClose();
        }}
        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
          isSelected
            ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${user.avatarColor}`}
          >
            {user.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-xs">{user.name}</span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${getRoleBadge(
                  user.role
                )}`}
              >
                {getRoleIcon(user.role)}
                <span>{user.role}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate max-w-[240px]">{user.email}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {user.roleTitle} · <span className="text-slate-200">{user.council}</span>
            </p>
          </div>
        </div>

        {isSelected ? (
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-3 h-3" />
          </div>
        ) : (
          <span className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 pt-1 shrink-0 flex items-center gap-1">
            <span>Log In</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </button>
    );
  }
};
