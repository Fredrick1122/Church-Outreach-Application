import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Crown,
  Building,
  User,
  CheckCircle,
  AlertCircle,
  Users,
  Search,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import {
  getUsers,
  registerUser,
  getCouncils,
  getBacentas,
} from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
}

export const UserManagementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'directory'>('register');
  const councilsList = getCouncils();
  const bacentas = getBacentas();

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('governor');
  const [selectedCouncil, setSelectedCouncil] = useState('Ephesians 1');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [assignedBacenta, setAssignedBacenta] = useState('');
  const [passcode, setPasscode] = useState('');

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Directory filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<string>('all');

  if (!isOpen) return null;

  const usersList = getUsers();

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'overseer') {
      setSelectedCouncil('Ephesians Overseership (All Councils)');
      setCustomRoleTitle('Regional General Overseer');
    } else if (newRole === 'governor') {
      setSelectedCouncil('Ephesians 1');
      setCustomRoleTitle('Governorship Overseer · Ephesians 1');
    } else if (newRole === 'admin') {
      setSelectedCouncil('Ephesians 1');
      setCustomRoleTitle('Operations Administrator');
    } else {
      setSelectedCouncil('Ephesians 1');
      setCustomRoleTitle('Bacenta Leader');
    }
  };

  const handleCouncilChange = (council: string) => {
    setSelectedCouncil(council);
    if (role === 'governor') {
      setCustomRoleTitle(`Governorship Overseer · ${council}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Full name and email address are required.');
      return;
    }

    // Check duplicate email
    const exists = usersList.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) {
      setErrorMessage(`A user account with email "${email}" already exists.`);
      return;
    }

    setIsSubmitting(true);

    const title =
      customRoleTitle.trim() ||
      (role === 'overseer'
        ? 'Regional General Overseer'
        : role === 'governor'
        ? `Governorship Overseer · ${selectedCouncil}`
        : role === 'admin'
        ? 'Operations Administrator'
        : 'Bacenta Leader');

    const res = registerUser({
      id: `user_${Date.now()}`,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      role,
      roleTitle: title,
      council: role === 'overseer' ? 'All Councils (Ephesians 1 - 5)' : selectedCouncil,
      bacenta: role === 'leader' ? assignedBacenta || undefined : undefined,
      avatarColor:
        role === 'overseer'
          ? 'bg-purple-600'
          : role === 'governor'
          ? 'bg-indigo-600'
          : role === 'admin'
          ? 'bg-emerald-600'
          : 'bg-amber-600',
      avatarInitials:
        fullName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0].toUpperCase())
          .slice(0, 2)
          .join('') || 'EO',
    });

    const registeredUser = res.user;
    setIsSubmitting(false);
    setSuccessMessage(
      `Successfully registered ${registeredUser.name} as ${registeredUser.role.toUpperCase()} (${registeredUser.council})!`
    );

    // Reset fields
    setFullName('');
    setEmail('');
    setPhone('');
    setPasscode('');

    setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  const filteredUsers = usersList.filter((u) => {
    if (directoryRoleFilter !== 'all' && u.role !== directoryRoleFilter) return false;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-800 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  User Registration & Leadership Governance
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wider">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Register users as Overseers (All Councils) or Governors (Ephesians 1 to 6)
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

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New User</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'directory'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registered Directory ({usersList.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'register' ? (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
              {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <strong className="block font-bold text-emerald-300">Registration Complete</strong>
                    <p className="mt-0.5">{successMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="px-2.5 py-1 bg-emerald-800 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700"
                  >
                    View in Directory →
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ROLE SELECTION */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Ministry Leadership Role <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('overseer')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                      role === 'overseer'
                        ? 'border-purple-500 bg-purple-950/40 text-purple-200 ring-1 ring-purple-500 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Overseer</span>
                    <span className="text-[10px] text-slate-400">All Governorships (Ephesians 1-6)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('governor')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                      role === 'governor'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Building className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Governor</span>
                    <span className="text-[10px] text-slate-400">Single Council (Ephesians 1 to 6)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('leader')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                      role === 'leader'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200 ring-1 ring-amber-500 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Bacenta Leader</span>
                    <span className="text-[10px] text-slate-400">Local Bacenta Evangelism</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                      role === 'admin'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Operations Admin</span>
                    <span className="text-[10px] text-slate-400">Platform & User Management</span>
                  </button>
                </div>
              </div>

              {/* FULL NAME & EMAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pastor Kojo Mensah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. kojo.mensah@ephesiansoutreach.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* PHONE & ROLE TITLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Phone Number (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="+233 24 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Official Role Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Governorship Overseer · Ephesians 2"
                    value={customRoleTitle}
                    onChange={(e) => setCustomRoleTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* ASSIGNED COUNCIL (Governorship) */}
              {role !== 'overseer' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Assigned Governorship / Council <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedCouncil}
                    onChange={(e) => handleCouncilChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                  >
                    {councilsList.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-slate-100">
                        {c} (Governorship)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    {role === 'governor'
                      ? `This governor will have authoritative dashboard access ONLY to the bacentas under ${selectedCouncil}.`
                      : `Assigned council for this member.`}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/80 text-xs text-purple-200 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    As an <strong>Overseer</strong>, this user has multi-council oversight and will be able to see all entries and database for each bacenta under <strong>all 6 Governorships (Ephesians 1 to 6)</strong>.
                  </span>
                </div>
              )}

              {/* IF LEADER: ASSIGN BACENTA */}
              {role === 'leader' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Assigned Bacenta
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alpha Bacenta, Grace Bacenta..."
                    value={assignedBacenta}
                    onChange={(e) => setAssignedBacenta(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              )}

              {/* SECURITY PIN / PASSCODE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Initial Passcode / PIN (Optional)
                </label>
                <input
                  type="password"
                  placeholder="e.g. 123456 (User can sign in with this PIN or via one-click)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register {role === 'overseer' ? 'Overseer' : role === 'governor' ? 'Governor' : 'User'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* DIRECTORY VIEW */
            <div className="space-y-4">
              {/* Search & filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, role, email, council..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'overseer', 'governor', 'admin', 'leader'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDirectoryRoleFilter(r)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${
                        directoryRoleFilter === r
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r === 'all' ? 'All Roles' : `${r}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users list table / cards */}
              <div className="space-y-2">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${u.avatarColor}`}
                        >
                          {u.avatarInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{u.name}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                                u.role === 'overseer'
                                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                                  : u.role === 'governor'
                                  ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                                  : u.role === 'admin'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}
                            >
                              {u.role}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{u.email}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {u.roleTitle} · <strong className="text-slate-200">{u.council}</strong>
                            {u.phone && ` · ${u.phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            onSelectUser(u);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                          title="Switch to this account to test permissions"
                        >
                          <span>Log in as this user</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Registered Overseers and Governors can immediately sign in.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
