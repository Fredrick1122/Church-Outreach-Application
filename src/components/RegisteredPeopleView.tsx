import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Crown,
  Building2,
  Layers,
  ArrowUp,
  ArrowDown,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  X,
  ChevronRight,
  Info,
  LayoutDashboard,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  HIERARCHY_TIERS,
  getHierarchyTier,
  getHierarchyLevel,
  getNextHigherRole,
  getNextLowerRole,
} from '../types';
import {
  getUsers,
  promoteUser,
  demoteUser,
  updateUserHierarchy,
  getCouncils,
  getGovernorshipsForCouncil,
  getBacentasForGovernorship,
  getLeaderForCouncil,
  getLeaderForGovernorship,
  getLeaderForBacenta,
} from '../services/storage';

interface Props {
  currentUser: UserProfile;
  onOpenRegisterModal: () => void;
  theme?: 'dark' | 'light';
  onSelectUser?: (user: UserProfile) => void;
}

export const RegisteredPeopleView: React.FC<Props> = ({
  currentUser,
  onOpenRegisterModal,
  theme = 'dark',
  onSelectUser,
}) => {
  const [users, setUsers] = useState<UserProfile[]>(() => getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit hierarchy modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('admin');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedCouncil, setSelectedCouncil] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedBacenta, setSelectedBacenta] = useState('');
  // Inspected user modal state
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handlePromote = (u: UserProfile) => {
    try {
      const updated = promoteUser(u.id);
      refreshUsers();
      const newTier = getHierarchyTier(updated.role);
      setFeedback({
        type: 'success',
        message: `Successfully promoted ${updated.name} to Level ${newTier.level}: ${newTier.label} (${updated.roleTitle})!`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to promote user.',
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleDemote = (u: UserProfile) => {
    try {
      const updated = demoteUser(u.id);
      refreshUsers();
      const newTier = getHierarchyTier(updated.role);
      setFeedback({
        type: 'success',
        message: `Moved ${updated.name} to Level ${newTier.level}: ${newTier.label} (${updated.roleTitle}).`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to demote user.',
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setTargetRole(u.role);
    setCustomTitle(u.roleTitle);
    setSelectedCouncil(u.council || 'All Councils');
    setSelectedGov(u.governorship || '');
    setSelectedBacenta(u.bacenta || '');
  };

  const handleSaveHierarchy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const updated = updateUserHierarchy(editingUser.id, targetRole, {
        roleTitle: customTitle.trim() || undefined,
        council: targetRole === 'admin' || targetRole === 'general_overseer' ? 'All Councils' : selectedCouncil,
        governorship: targetRole === 'governor' || targetRole === 'leader' ? selectedGov.trim() : undefined,
        bacenta: targetRole === 'leader' ? selectedBacenta.trim() : undefined,
      });
      refreshUsers();
      setEditingUser(null);
      const tier = getHierarchyTier(updated.role);
      setFeedback({
        type: 'success',
        message: `Successfully moved ${updated.name} to Level ${tier.level}: ${tier.label} (${updated.roleTitle}).`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update user hierarchy level.',
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const councilsList = getCouncils();
  const availableGovs = selectedCouncil ? getGovernorshipsForCouncil(selectedCouncil) : [];
  const availableBacentas = selectedGov ? getBacentasForGovernorship(selectedGov) : [];

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all') {
      if (roleFilter === 'council_overseer') {
        if (u.role !== 'council_overseer' && u.role !== 'overseer') return false;
      } else if (u.role !== roleFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        u.roleTitle.toLowerCase().includes(q) ||
        u.council.toLowerCase().includes(q) ||
        (u.governorship && u.governorship.toLowerCase().includes(q)) ||
        (u.bacenta && u.bacenta.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const genCount = users.filter((u) => u.role === 'general_overseer').length;
  const cnlCount = users.filter((u) => u.role === 'council_overseer' || u.role === 'overseer').length;
  const govCount = users.filter((u) => u.role === 'governor').length;
  const leaderCount = users.filter((u) => u.role === 'leader').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-colors ${
        theme === 'light'
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-950/40">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  Registered Leaders & Hierarchy Directory
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                  Admin Authority
                </span>
              </div>
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                View and manage all registered leaders across all hierarchy levels. Move leaders up or down the leadership hierarchy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenRegisterModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-950/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Leader / Admin</span>
            </button>
          </div>
        </div>

        {/* Hierarchy Rule Clarification Banner */}
        <div className={`mt-5 p-4 rounded-2xl border flex items-start gap-3 ${
          theme === 'light'
            ? 'bg-emerald-50/70 border-emerald-200 text-slate-700'
            : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
        }`}>
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold text-emerald-400">Account & Hierarchy Integrity Rule:</strong> One account cannot be registered multiple times on the platform. Existing accounts can be promoted to higher leadership tiers (e.g. Leader → Governor → Council Overseer → General Overseer → Admin) or moved lower as leadership shifts.
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          <div className={`p-3.5 rounded-2xl border text-center ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{users.length}</span>
          </div>

          <div className={`p-3.5 rounded-2xl border text-center ${
            theme === 'light' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/50'
          }`}>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Admins (Level 5)</span>
            <span className="text-xl font-extrabold text-emerald-300 mt-0.5 block">{adminCount}</span>
          </div>

          <div className={`p-3.5 rounded-2xl border text-center ${
            theme === 'light' ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/30 border-purple-800/50'
          }`}>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Gen. Overseers (L4)</span>
            <span className="text-xl font-extrabold text-purple-300 mt-0.5 block">{genCount}</span>
          </div>

          <div className={`p-3.5 rounded-2xl border text-center ${
            theme === 'light' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-indigo-950/30 border-indigo-800/50'
          }`}>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Council Overseers (L3)</span>
            <span className="text-xl font-extrabold text-indigo-300 mt-0.5 block">{cnlCount}</span>
          </div>

          <div className={`p-3.5 rounded-2xl border text-center ${
            theme === 'light' ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-950/30 border-blue-800/50'
          }`}>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Governors (L2)</span>
            <span className="text-xl font-extrabold text-blue-300 mt-0.5 block">{govCount}</span>
          </div>

          <div className={`p-3.5 rounded-2xl border text-center ${
            theme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/30 border-amber-800/50'
          }`}>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Field Leaders (L1)</span>
            <span className="text-xl font-extrabold text-amber-300 mt-0.5 block">{leaderCount}</span>
          </div>
        </div>
      </div>

      {/* Real-time Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
            : 'bg-rose-950/80 border-rose-800 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, phone, role title, council, or bacenta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium ${
              theme === 'light'
                ? 'bg-slate-100 border border-slate-300 text-slate-900 placeholder:text-slate-500'
                : 'bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'admin', label: 'Admins (L5)' },
            { id: 'general_overseer', label: 'General Overseers (L4)' },
            { id: 'council_overseer', label: 'Council Overseers (L3)' },
            { id: 'governor', label: 'Governors (L2)' },
            { id: 'leader', label: 'Leaders (L1)' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setRoleFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                roleFilter === pill.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Registered People Cards List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">No accounts found</h3>
            <p className="text-xs text-slate-400 mt-1">Try refining your search keyword or active filter.</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const tier = getHierarchyTier(u.role);
            const level = getHierarchyLevel(u.role);
            const canMoveUp = level < 5;
            const isLeadAdmin = u.email.toLowerCase() === 'dogbatseyfredrick@gmail.com' || u.id === 'user_admin_1';
            const canMoveDown = level > 1 && !isLeadAdmin;
            const isCurrentSession = currentUser.id === u.id || currentUser.email.toLowerCase() === u.email.toLowerCase();

            return (
              <div
                key={u.id}
                onClick={() => {
                  if (onSelectUser) {
                    onSelectUser(u);
                  }
                }}
                className={`p-5 rounded-3xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer group hover:scale-[1.004] hover:shadow-xl ${
                  isLeadAdmin
                    ? theme === 'light'
                      ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500'
                      : 'bg-emerald-950/20 border-emerald-800/80 hover:border-emerald-600'
                    : theme === 'light'
                    ? 'bg-white border-slate-200 hover:border-emerald-400'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
                }`}
                title={`Click to open ${u.name}'s account dashboard`}
              >
                {/* Person details */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-md ${u.avatarColor}`}
                  >
                    {u.avatarInitials}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm sm:text-base font-extrabold truncate ${
                        theme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>
                        {u.name}
                      </h4>

                      {/* Hierarchy Badge */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${tier.badgeBg} ${tier.badgeColor} ${tier.badgeBorder}`}>
                        Level {tier.level} · {tier.role === 'admin' ? (isLeadAdmin ? 'Lead Admin' : 'Admin') : tier.label}
                      </span>

                      {isLeadAdmin && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Primary Lead Admin
                        </span>
                      )}

                      {isCurrentSession && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          You (Active Session)
                        </span>
                      )}

                      <span className="text-[10px] font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex items-center gap-0.5">
                        Open Dashboard →
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {u.email}
                      </span>

                      {u.phone && (
                        <a
                          href={`tel:${u.phone.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
                          title={`Call ${u.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          {u.phone}
                        </a>
                      )}

                      <span className="text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectUser) {
                              const leader = getLeaderForCouncil(u.council);
                              onSelectUser(leader);
                            }
                          }}
                          className="font-bold text-white hover:text-emerald-400 underline underline-offset-2 transition-colors cursor-pointer"
                          title={`Click to open ${u.council} Council Overseer account/dashboard`}
                        >
                          {u.council}
                        </button>
                        {u.governorship && (
                          <>
                            <span className="text-slate-600">/</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectUser) {
                                  const leader = getLeaderForGovernorship(u.governorship!, u.council);
                                  onSelectUser(leader);
                                }
                              }}
                              className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer"
                              title={`Click to open ${u.governorship} Governor account/dashboard`}
                            >
                              {u.governorship}
                            </button>
                          </>
                        )}
                        {u.bacenta && (
                          <>
                            <span className="text-slate-600">/</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectUser) {
                                  const leader = getLeaderForBacenta(u.bacenta!, u.governorship, u.council);
                                  onSelectUser(leader);
                                }
                              }}
                              className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                              title={`Click to open ${u.bacenta} Leader account/dashboard`}
                            >
                              {u.bacenta}
                            </button>
                          </>
                        )}
                      </span>
                    </div>

                    <p className={`text-[11px] italic ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      Official Title: <strong className={theme === 'light' ? 'text-slate-800' : 'text-slate-200'}>{u.roleTitle}</strong>
                    </p>
                  </div>
                </div>

                {/* Actions: Open Dashboard, Account Info, Adjust, Promote, Demote */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                  {/* Primary Action: Open Leader Dashboard */}
                  {onSelectUser && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(u);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                      title={`Open ${u.name}'s Dashboard`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>{isCurrentSession ? 'My Dashboard' : 'Open Dashboard'}</span>
                    </button>
                  )}

                  {/* Account Details */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedUser(u);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="View leadership account credentials & details"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Account</span>
                  </button>

                  {/* Move Up / Promote */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePromote(u);
                    }}
                    disabled={!canMoveUp}
                    title={
                      canMoveUp
                        ? `Promote to Level ${level + 1} (${getNextHigherRole(u.role)?.toUpperCase()})`
                        : 'Already at highest hierarchy level (Level 5)'
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      canMoveUp
                        ? 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 hover:text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Promote (↑)</span>
                  </button>

                  {/* Move Down / Demote */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemote(u);
                    }}
                    disabled={!canMoveDown}
                    title={
                      isLeadAdmin
                        ? 'Primary Lead Admin cannot be demoted'
                        : canMoveDown
                        ? `Move down to Level ${level - 1} (${getNextLowerRole(u.role)?.toUpperCase()})`
                        : 'Already at base leadership tier (Level 1)'
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      canMoveDown
                        ? 'bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>Demote (↓)</span>
                  </button>

                  {/* Adjust Level / Role Modal Opener */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(u);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Change leadership hierarchy level and assigned jurisdiction"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Adjust Level</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adjust Hierarchy Level Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Adjust Leadership Hierarchy Level</h3>
                  <p className="text-xs text-slate-400">
                    Modifying position for <strong>{editingUser.name}</strong> ({editingUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHierarchy} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Select Target Role Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Leadership Hierarchy Tier
                </label>
                <div className="space-y-2">
                  {HIERARCHY_TIERS.slice().reverse().map((t) => {
                    const isSelected = targetRole === t.role;
                    return (
                      <button
                        key={t.role}
                        type="button"
                        onClick={() => {
                          setTargetRole(t.role);
                          if (t.role === 'admin') {
                            setCustomTitle('Admin');
                            setSelectedCouncil('All Councils');
                          } else if (t.role === 'general_overseer') {
                            setCustomTitle('General Overseer (All Councils)');
                            setSelectedCouncil('All Councils');
                          } else if (t.role === 'council_overseer') {
                            const cnl = selectedCouncil.includes('All') ? 'Ephesians 1' : selectedCouncil;
                            setSelectedCouncil(cnl);
                            setCustomTitle(`${cnl} Council Overseer Pastor`);
                          } else if (t.role === 'governor') {
                            const cnl = selectedCouncil.includes('All') ? 'Ephesians 1' : selectedCouncil;
                            setSelectedCouncil(cnl);
                            setCustomTitle(`${selectedGov || 'Governorship'} Pastor`);
                          } else {
                            setCustomTitle('Bacenta Leader / Field Evangelist');
                          }
                        }}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${t.badgeBg} ${t.badgeColor} border ${t.badgeBorder}`}>
                            Level {t.level}
                          </span>
                          <div>
                            <span className="font-bold text-sm block text-white">{t.label}</span>
                            <span className="text-[11px] text-slate-400 block">{t.description}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official Role Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Official Role Title
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="e.g. Lead Admin, Ephesians 2 Council Overseer..."
                />
              </div>

              {/* Jurisdiction Assignment */}
              {targetRole !== 'admin' && targetRole !== 'general_overseer' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Assigned Council
                    </label>
                    <select
                      value={selectedCouncil}
                      onChange={(e) => {
                        setSelectedCouncil(e.target.value);
                        const govs = getGovernorshipsForCouncil(e.target.value);
                        setSelectedGov(govs[0] || '');
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                    >
                      {councilsList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(targetRole === 'governor' || targetRole === 'leader') && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Assigned Governorship
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pillar Governorship"
                        value={selectedGov}
                        onChange={(e) => setSelectedGov(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  )}

                  {targetRole === 'leader' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Assigned Bacenta
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alpha Bacenta"
                        value={selectedBacenta}
                        onChange={(e) => setSelectedBacenta(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Leadership Hierarchy Level</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Inspected Leader Account Details Modal */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800 flex flex-col animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Leader Account Details</h3>
                  <p className="text-xs text-slate-400">Ministry profile and jurisdiction</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md ${inspectedUser.avatarColor}`}
                >
                  {inspectedUser.avatarInitials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-white text-base truncate">{inspectedUser.name}</h4>
                  <p className="text-xs text-emerald-400 font-semibold">{inspectedUser.roleTitle}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mt-1 inline-block">
                    Level {getHierarchyTier(inspectedUser.role).level} · {getHierarchyTier(inspectedUser.role).label}
                  </span>
                </div>
              </div>

              {/* Jurisdiction Grid */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Council</span>
                  <span className="font-bold text-white">{inspectedUser.council}</span>
                </div>
                {inspectedUser.governorship && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Governorship</span>
                    <span className="font-bold text-blue-300">{inspectedUser.governorship}</span>
                  </div>
                )}
                {inspectedUser.bacenta && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Bacenta</span>
                    <span className="font-bold text-amber-300">{inspectedUser.bacenta}</span>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]">{inspectedUser.email}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {inspectedUser.password || 'password123'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const pass = inspectedUser.password || 'password123';
                        navigator.clipboard?.writeText(`Email: ${inspectedUser.email}\nPassword: ${pass}`);
                        alert(`Credentials for ${inspectedUser.name} copied!`);
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {inspectedUser.phone && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Phone</span>
                    <a
                      href={`tel:${inspectedUser.phone.replace(/\s+/g, '')}`}
                      className="font-bold text-emerald-400 hover:underline"
                    >
                      {inspectedUser.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              {onSelectUser && (
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectedUser;
                    setInspectedUser(null);
                    onSelectUser(target);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open {inspectedUser.name}'s Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const RegisteredLeadersView = RegisteredPeopleView;
