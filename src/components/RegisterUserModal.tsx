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
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import {
  getCouncils,
  registerUser,
  getGovernorshipsForCouncil,
  getBacentasForGovernorship,
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
  const councils = getCouncils(); // Strictly Ephesians 1 to 5

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('council_overseer');
  const [council, setCouncil] = useState('Ephesians 1');
  const [governorship, setGovernorship] = useState('Governorship Alpha (Praise)');
  const [roleTitle, setRoleTitle] = useState('Ephesians 1 Council Overseer Pastor');
  const [bacenta, setBacenta] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  const currentGovs = getGovernorshipsForCouncil(council);
  const currentBacentas = governorship ? getBacentasForGovernorship(governorship) : [];

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'general_overseer' || newRole === 'admin') {
      setRoleTitle('General Overseer (All 5 Councils)');
      setCouncil('All Councils (Ephesians 1 - 5)');
    } else if (newRole === 'council_overseer' || newRole === 'overseer') {
      const targetCnl = council.includes('All') ? 'Ephesians 1' : council;
      setCouncil(targetCnl);
      setRoleTitle(`${targetCnl} Council Overseer Pastor`);
    } else if (newRole === 'governor') {
      const targetCnl = council.includes('All') ? 'Ephesians 1' : council;
      setCouncil(targetCnl);
      const govs = getGovernorshipsForCouncil(targetCnl);
      const firstGov = govs[0] || 'Governorship Alpha (Praise)';
      setGovernorship(firstGov);
      setRoleTitle(`${firstGov} Pastor`);
    } else {
      setRoleTitle('Bacenta Leader / Evangelist');
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

  const handleGovernorshipChange = (newGov: string) => {
    setGovernorship(newGov);
    if (role === 'governor') {
      setRoleTitle(`${newGov} Pastor`);
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

      const colorOptions = [
        'bg-emerald-600',
        'bg-blue-600',
        'bg-indigo-600',
        'bg-purple-600',
        'bg-amber-600',
        'bg-rose-600',
        'bg-teal-600',
      ];
      const avatarColor =
        role === 'general_overseer' || role === 'admin'
          ? 'bg-emerald-600'
          : role === 'council_overseer' || role === 'overseer'
          ? 'bg-indigo-600'
          : role === 'governor'
          ? 'bg-blue-600'
          : 'bg-rose-600';

      const newUser: UserProfile = {
        id: `user_${role}_${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || 'password123',
        role,
        roleTitle: roleTitle.trim() || `${role.toUpperCase()}`,
        council: role === 'general_overseer' ? 'All Councils (Ephesians 1 - 5)' : council,
        governorship: role === 'governor' || role === 'leader' ? governorship : undefined,
        bacenta: role === 'leader' && bacenta ? bacenta.trim() : undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Register Ministry Account
              </h3>
              <p className="text-xs text-slate-400">
                Admin portal to register Overseers, Governors, or Leaders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
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
                <strong>{successUser.name}</strong> has been provisioned as{' '}
                <span className="text-emerald-400 font-bold uppercase">{successUser.role}</span>.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-left space-y-1.5 text-slate-300">
              <p>
                <strong>Login Email:</strong> <span className="font-mono text-white">{successUser.email}</span>
              </p>
              <p>
                <strong>Password:</strong> <span className="font-mono text-emerald-400">{successUser.password}</span>
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
                Register Another User
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

            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Role Authority Tier *
              </label>
              <div className="grid grid-cols-3 gap-2">
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
                    Ephesians 1 to 5
                  </span>
                </button>

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
                    Governorship Pastor
                  </span>
                </button>

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
                  placeholder="e.g. Pastor Samuel Mensah"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="samuel.mensah@ephesians.org"
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

            {/* Council Assignment */}
            {role !== 'general_overseer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Assigned Council (Ephesians 1 to 5) *
                  </label>
                  <select
                    value={council}
                    onChange={(e) => handleCouncilChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                  >
                    {councils.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Overseer Pastor"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Governorship Assignment (For Governor or Leader) */}
            {(role === 'governor' || role === 'leader') && currentGovs.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Assigned Governorship under {council} *
                </label>
                <select
                  value={governorship}
                  onChange={(e) => handleGovernorshipChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-blue-500 font-medium"
                >
                  {currentGovs.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Bacenta Assignment (For Leader) */}
            {role === 'leader' && currentBacentas.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Assigned Bacenta under {governorship} (Optional)
                </label>
                <select
                  value={bacenta}
                  onChange={(e) => setBacenta(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="">All Bacentas in Governorship</option>
                  {currentBacentas.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
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
