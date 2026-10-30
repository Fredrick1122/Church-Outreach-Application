import React from 'react';
import { X, Scale, CheckCircle2, ShieldAlert, Award, FileCheck, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const TermsConditionsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`max-w-3xl w-full rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ephesians Outreach Terms & Conditions
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Domain: ephesiansoutreach.org</span>
                <span>·</span>
                <span>Pastoral & Operational Charter</span>
                <span>·</span>
                <span>Revised 2026</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors ${
              isLight
                ? 'border-slate-200 hover:bg-slate-100 text-slate-600'
                : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* Charter Notice */}
          <section className={`p-4 rounded-xl border ${
            isLight ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-900/60 text-emerald-200'
          }`}>
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Ecclesiastical Field Protocol & Authorized Use
            </h3>
            <p className="text-xs leading-normal">
              By accessing the Ephesians Outreach portal (ephesiansoutreach.org), uploading field records, or managing leadership dashboards, you agree to comply with this ministerial operating charter. This system serves exclusively for church administrative census, evangelism stewardship, and apostolic supervision.
            </p>
          </section>

          {/* Term 1 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Award className="w-4 h-4 text-emerald-500 shrink-0" />
              1. Ministerial Integrity & Authentic Field Reporting
            </h3>
            <p className="text-slate-400">
              Field ministers, bacenta evangelists, and reporting overseers are held to the highest standard of spiritual integrity:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>All reported numbers (souls won, converts reached, attendance figures) must reflect actual, genuine field occurrences. Fabricated metrics, duplicate reporting of previously recorded converts, or inflated counts are strictly prohibited.</li>
              <li>Every convert entry must contain truthful information obtained with the individual's consent during public evangelism, door-to-door outreach, or crusade missions.</li>
              <li>Any suspected data falsification will be audited through the immutable audit trail and submitted to the General Overseer and pastoral committee for review.</li>
            </ul>
          </section>

          {/* Term 2 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
              2. Leadership Hierarchy & Account Responsibilities
            </h3>
            <p className="text-slate-400">
              Administrative credentials are non-transferable and assigned based on ecclesiastical appointment:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Leaders are responsible for safeguarding their login credentials and ensuring no unauthorized individuals access convert records from their devices.</li>
              <li>Governors and Council Overseers are required to regularly review outreach logs within their jurisdictions, ensuring timely shepherd contact with all newly won souls.</li>
              <li>Leadership appointments and role elevations are administered solely by the General Overseer and authorized Lead Administrators.</li>
            </ul>
          </section>

          {/* Term 3 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
              3. Protection of Convert Privacy & Non-Commercial Use
            </h3>
            <p className="text-slate-400">
              Convert information obtained through ministry activities must be treated as sacred pastoral trust:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Convert phone numbers, addresses, and prayer requests may not be extracted, distributed, or repurposed for personal businesses, political campaigns, or commercial marketing.</li>
              <li>Pastoral follow-up communication (calls, SMS, visitation) must remain respectful, edifying, and aligned with Christian doctrine.</li>
              <li>Photographic records uploaded to outreach reports must respect public decency and individual dignity.</li>
            </ul>
          </section>

          {/* Term 4 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              4. System Availability, Offline Sync & Modifications
            </h3>
            <p className="text-slate-400">
              While every effort is made to guarantee 24/7 uptime for field operations across local and regional network cells, Ephesians Outreach reserves the right to perform scheduled security maintenance, upgrade audit mechanisms, and refine database protocols. Field ministers are advised to utilize the built-in offline synchronization mode during low-bandwidth field missions.
            </p>
          </section>

          {/* Term 5 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
              5. Governing Policy & Amendments
            </h3>
            <p className="text-slate-400">
              These terms are established under the ecclesiastical guidance of the Ephesians Outreach Council. Continued use of ephesiansoutreach.org following posted revisions constitutes acceptance of updated operational policies.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/80'
          }`}
        >
          <span className="text-xs text-slate-500">
            Ephesians Outreach · ephesiansoutreach.org
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
