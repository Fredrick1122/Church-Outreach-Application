import React, { useState } from 'react';
import {
  Lock,
  Mail,
  X,
  AlertCircle,
  Shield,
  HelpCircle,
  LogIn,
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginUser } from '../services/storage';
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
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = loginUser(email, password);
      onSelectUser(user);
      onClose();
    } catch {
      // Standard security practice: return uniform Invalid credentials
      setError('Invalid credentials. Please check your email and password.');
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
            {/* Input 1: Email [type=email] */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-200 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="dogbatseyfredrick@gmail.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium transition-all"
                />
              </div>
            </div>

            {/* Input 2: Password [type=password] */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-200"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium transition-all"
                />
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
          <div className="pt-2 text-center border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowForgotModal(!showForgotModal)}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium underline underline-offset-4"
            >
              Forgot Password?
            </button>

            {showForgotModal && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Credential Reset Policy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  For strict church security, leadership credentials cannot be reset self-service.
                  Please contact the <strong>General Overseer / Lead Admin (dogbatseyfredrick@gmail.com)</strong> directly to reset your credentials.
                </p>
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
