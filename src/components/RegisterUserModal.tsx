import React, { useState } from 'react';
import {
  UserPlus,
  X,
  Shield,
  Building2,
  Mail,
  Lock,
  Phone,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import {
  getCouncils,
  addCouncil,
  registerUser,
  getGovernorshipsForCouncil,
  addGovernorshipToCouncil,
  getBacentasForGovernorship,
  addBacentaToGovernorship,
} from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserRegistered?: (user: UserProfile) => void;
}

export const RegisterUserModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onUserRegistered,
}) => {
  const [councilsList, setCouncilsList] = useState<string[]>(getCouncils());
  const [isAddingCouncil, setIsAddingCouncil] = useState(false);
  const [newCouncilInput, setNewCouncilInput] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');

  // Set initial default role based on currentUser authority:
  const isGov = currentUser?.role === 'governor';
  const isCnl = currentUser?.role === 'council_overseer' || currentUser?.role === 'overseer';

  const [role, setRole] = useState<UserRole>(
    isGov ? 'leader' : isCnl ? 'governor' : 'general_overseer'
  );

  const initialCouncil =
    currentUser?.council && currentUser.council !== 'All Councils' && !currentUser.council.includes('All Councils')
      ? currentUser.council
      : councilsList[0] || 'Ephesians 1';

  const [council, setCouncil] = useState(initialCouncil);
  const [governorship, setGovernorship] = useState(currentUser?.governorship || '');
  const [bacenta, setBacenta] = useState('');
  const [roleTitle, setRoleTitle] = useState('General Overseer (All Councils)');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  const currentGovs = getGovernorshipsForCouncil(council);
  const currentBacentas = governorship ? getBacentasForGovernorship(governorship) : [];

  const handleAddNewCouncil = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCouncilInput.trim();
    if (!clean) return;
    const updated = addCouncil(clean);
    setCouncilsList(updated);
    setCouncil(clean);
    setNewCouncilInput('');
    setIsAddingCouncil(false);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setRoleTitle('Admin');
      setCouncil('All Councils');
    } else if (newRole === 'general_overseer') {
      setRoleTitle('General Overseer (All Councils)');
      setCouncil('All Councils');
    } else if (newRole === 'council_overseer' || newRole === 'overseer') {
      const targetCnl = council.includes('All') ? councilsList[0] || 'Ephesians 1' : council;
      setCouncil(targetCnl);
      setRoleTitle(`${targetCnl} Council Overseer Pastor`);
    } else if (newRole === 'governor') {
      const targetCnl = council.includes('All') ? councilsList[0] || 'Ephesians 1' : council;
      setCouncil(targetCnl);
      setRoleTitle(`${governorship || 'Governorship'} Pastor`);
    } else {
      setRoleTitle('Bacenta Leader / Field Evangelist');
    }
  };

  const handleCouncilChange = (newCouncil: string) => {
    setCouncil(newCouncil);
    const govs = getGovernorshipsForCouncil(newCouncil);
    const firstGov = govs[0] || '';
    setGovernorship(firstGov);

    if (role === 'council_overseer' || role === 'overseer') {
      setRoleTitle(`${newCouncil} Council Overseer Pastor`);
    } else if (role === 'governor') {
      setRoleTitle(firstGov ? `${firstGov} Pastor` : `${newCouncil} Governorship Pastor`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const avatarColor =
        role === 'general_overseer' || role === 'admin'
          ? 'bg-emerald-600'
          : role === 'council_overseer' || role === 'overseer'
          ? 'bg-indigo-600'
          : role === 'governor'
          ? 'bg-blue-600'
          : 'bg-rose-600';

      // If a custom governorship was typed and not yet registered, save it
      if (governorship.trim() && !currentGovs.includes(governorship.trim()) && council !== 'All Councils') {
        addGovernorshipToCouncil(council, governorship.trim());
      }

      // If a custom bacenta was typed and not yet registered, save it
      if (bacenta.trim() && governorship.trim() && !currentBacentas.includes(bacenta.trim())) {
        addBacentaToGovernorship(governorship.trim(), bacenta.trim());
      }

      const newUser: UserProfile = {
        id: `user_${role}_${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || 'password123',
        role,
        roleTitle: roleTitle.trim() || `${role.toUpperCase()}`,
        council: role === 'admin' || role === 'general_overseer' ? 'All Councils' : council,
        governorship: role === 'governor' || role === 'leader' ? governorship.trim() : undefined,
        bacenta: role === 'leader' && bacenta.trim() ? bacenta.trim() : undefined,
        avatarInitials: initials,
        avatarColor,
        phone: phone.trim(),
        createdAt: new Date().toISOString(),
      };

      const result = registerUser(newUser);
      setSuccessUser(result.user);

      if (onUserRegistered) {
        onUserRegistered(result.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to register account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which roles this user is permitted to create:
  // Admin: can create Admin, General Overseer, Council Overseer, Governor, Leader
  // General Overseer: General Overseer, Council Overseer, Governor, Leader
  // Council Overseer: Governor, Bacenta Leader, or fellow Council Overseer
  // Governor: Bacenta Leader
  const canCreateAdmin = !currentUser || currentUser.role === 'admin';
  const canCreateGeneralOverseer = !currentUser || currentUser.role === 'admin' || currentUser.role === 'general_overseer';
  const canCreateCouncilOverseer = !currentUser || currentUser.role === 'admin' || currentUser.role === 'general_overseer' || isCnl;
  const canCreateGovernor = !currentUser || currentUser.role === 'admin' || currentUser.role === 'general_overseer' || isCnl;
  const canCreateLeader = true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Register Ministry Account
              </h3>
              <p className="text-xs text-slate-400">
                Provision General Overseer, Overseers, Governors, or Leaders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {successUser ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Account Successfully Registered!</h4>
              <p className="text-xs text-slate-300 mt-1">
                <strong>{successUser.name}</strong> has been registered into the ministry system as{' '}
                <span className="text-emerald-400 font-bold uppercase">{successUser.role.replace('_', ' ')}</span>.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-left space-y-1.5 text-slate-300">
              <p>
                <strong>Login Email:</strong>{' '}
                <span className="font-mono text-emerald-300 font-bold">{successUser.email}</span>
              </p>
              <p>
                <strong>Password:</strong>{' '}
                <span className="font-mono text-white">{successUser.password}</span>
              </p>
              <p>
                <strong>Role & Title:</strong> {successUser.roleTitle}
              </p>
              <p>
                <strong>Assigned Jurisdiction:</strong> {successUser.council}
                {successUser.governorship ? ` · ${successUser.governorship}` : ''}
                {successUser.bacenta ? ` · ${successUser.bacenta}` : ''}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessUser(null);
                  setName('');
                  setEmail('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                + Register Another Account
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Authority Selection Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Select Leadership Authority Tier *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {canCreateAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'admin'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span>Admin</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      Full Access
                    </span>
                  </button>
                )}

                {canCreateGeneralOverseer && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('general_overseer')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'general_overseer'
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                    <span>General Overseer</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      All Councils
                    </span>
                  </button>
                )}

                {canCreateCouncilOverseer && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('council_overseer')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'council_overseer' || role === 'overseer'
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                    <span>Council Overseer</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      Council Oversight
                    </span>
                  </button>
                )}

                {canCreateGovernor && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('governor')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'governor'
                        ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                    <span>Governor</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      Governorship
                    </span>
                  </button>
                )}

                {canCreateLeader && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('leader')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === 'leader'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                    <span>Bacenta Leader</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      Field Evangelist
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bishop Isaac Mensah"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Login Email *
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. overseer.mensah@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Password & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Password / PIN *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Phone Contact (Optional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 24 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs"
                />
              </div>
            </div>

            {/* Council Assignment & Add Council */}
            {role !== 'general_overseer' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    Assigned Council *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCouncil(!isAddingCouncil)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingCouncil ? 'Cancel' : '+ Add More Councils'}</span>
                  </button>
                </div>

                {isAddingCouncil ? (
                  <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-emerald-800">
                    <input
                      type="text"
                      placeholder="e.g. Ephesians 6 or Philippians 1"
                      value={newCouncilInput}
                      onChange={(e) => setNewCouncilInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCouncil}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg whitespace-nowrap"
                    >
                      Save Council
                    </button>
                  </div>
                ) : (
                  <select
                    value={council}
                    disabled={isCnl || isGov}
                    onChange={(e) => handleCouncilChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-emerald-500 font-medium disabled:opacity-75"
                  >
                    {councilsList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Role Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Official Ministry Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. General Overseer, Council Overseer Pastor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium"
              />
            </div>

            {/* Governorship Assignment (For Governor or Leader) */}
            {(role === 'governor' || role === 'leader') && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Governorship under {council} *
                </label>
                {currentGovs.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={governorship}
                      disabled={isGov}
                      onChange={(e) => setGovernorship(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-blue-500 font-medium disabled:opacity-75"
                    >
                      <option value="">Select Governorship...</option>
                      {currentGovs.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Or type a new governorship below if creating for the first time:
                    </p>
                    <input
                      type="text"
                      placeholder="Or enter new governorship name..."
                      value={governorship}
                      disabled={isGov}
                      onChange={(e) => setGovernorship(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium disabled:opacity-75"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required={role === 'governor'}
                    placeholder="Enter new governorship name (e.g. Governorship Alpha)"
                    value={governorship}
                    disabled={isGov}
                    onChange={(e) => setGovernorship(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                )}
              </div>
            )}

            {/* Bacenta Assignment (For Leader) */}
            {role === 'leader' && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Bacenta Name (Optional / Add on the fly)
                </label>
                {currentBacentas.length > 0 ? (
                  <select
                    value={bacenta}
                    onChange={(e) => setBacenta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="">Select or leave open...</option>
                    {currentBacentas.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter new bacenta name (e.g. Bacenta Zion)"
                    value={bacenta}
                    onChange={(e) => setBacenta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Registering...' : `Register Account`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
