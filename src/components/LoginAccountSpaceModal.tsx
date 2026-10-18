import React, { useState } from 'react';
import {
  Lock,
  Mail,
  X,
  AlertCircle,
  Shield,
  HelpCircle,
  LogIn,
  ChevronDown,
  ChevronUp,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginUser, getUsers } from '../services/storage';
import { AppLogo } from './AppLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onLogout?: () => void;
}

export const LoginAccountSpaceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onLogout,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showQuickAccounts, setShowQuickAccounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await loginUser(email, password);
      onSelectUser(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please check your login details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" allowUpload={true} />
            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">
                Login
              </h3>
              <p className="text-xs text-slate-400">
                Sign in to access your authorized workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Session Banner (if logged in) */}
        {currentUser && (
          <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Active: <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle})
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline"
              >
                Log Out
              </button>
            )}
          </div>
        )}

        {/* Single Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Input 1: Identifier (Email, Phone, or Leader Name) */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-200 mb-1.5"
              >
                Email, Phone, or Leader Name
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. leader@ephesians.org or name or phone"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium transition-all"
                />
              </div>
            </div>

            {/* Input 2: Password with Reveal Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-200"
                >
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Default: <strong className="text-emerald-400 font-mono">password123</strong>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="•••••••• or password123"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Button: Sign In */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Link Below: Forgot Password? */}
          <div className="pt-2 text-center border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowForgotModal(!showForgotModal)}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium underline underline-offset-4"
              >
                Forgot Password?
              </button>

              <button
                type="button"
                onClick={() => setShowQuickAccounts(!showQuickAccounts)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Leaders Accounts ({getUsers().length})</span>
                {showQuickAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showForgotModal && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Credential Reset Policy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  For strict church security, leadership credentials cannot be reset self-service.
                  Please contact the <strong>Lead Admin (+233 59 736 5182 / dogbatseyfredrick@gmail.com)</strong> directly to reset your credentials.
                </p>
              </div>
            )}

            {/* Quick Leader Account Clicker */}
            {showQuickAccounts && (
              <div className="mt-2 text-left space-y-1.5 max-h-52 overflow-y-auto pr-1 animate-fadeIn">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Click any leader to open their account dashboard:
                </p>
                {getUsers().map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 ${
                          u.avatarColor || 'bg-emerald-600'
                        }`}
                      >
                        {u.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {u.roleTitle} · {u.council} {u.bacenta ? `(${u.bacenta})` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                      Open Dashboard →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Protected with bcryptjs password hashing</span>
          <span className="font-mono text-[10px] text-emerald-500/80">Ephesians v8</span>
        </div>
      </div>
    </div>
  );
};
