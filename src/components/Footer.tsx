import React from 'react';
import { Shield, FileText, BookOpen, Globe, Mail } from 'lucide-react';

interface Props {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenScriptures: () => void;
  theme?: 'dark' | 'light';
}

export const Footer: React.FC<Props> = ({
  onOpenPrivacy,
  onOpenTerms,
  onOpenScriptures,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <footer
      className={`mt-12 border-t transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          {/* Column 1: Institutional Identity */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ephesians Outreach
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800 uppercase tracking-wider">
                Official Ministry Portal
              </span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed text-xs">
              Field evangelism census, convert care management, and apostolic leadership coordination. Grounded in Scripture for harvest multiplication across all Councils, Governorships, and Bacentas.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Official Domain:</span>
              <a
                href="https://ephesiansoutreach.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-500 hover:underline"
              >
                ephesiansoutreach.org
              </a>
            </div>
          </div>

          {/* Column 2: Governance & Policies */}
          <div className="space-y-2">
            <span className={`font-bold text-xs uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
              Governance
            </span>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Terms & Conditions</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenScriptures}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Scripture Exhortations</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Administration */}
          <div className="space-y-2">
            <span className={`font-bold text-xs uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
              Administration
            </span>
            <div className="space-y-1 text-xs text-slate-400">
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-mono text-[11px] truncate">dogbatseyfredrick@gmail.com</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Lead Administrator & Field Coordination Desk
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Data Center: Secure TLS 1.3 · Local Offline Cache
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div>
            © {new Date().getFullYear()} Ephesians Outreach Ministry. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Terms of Use
            </button>
            <span>·</span>
            <a
              href="https://ephesiansoutreach.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              ephesiansoutreach.org
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
