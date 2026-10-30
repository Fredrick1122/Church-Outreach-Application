import React from 'react';
import { X, Shield, Lock, FileText, CheckCircle2, UserCheck, Eye, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const PrivacyPolicyModal: React.FC<Props> = ({
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
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ephesians Outreach Privacy Policy
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Domain: ephesiansoutreach.org</span>
                <span>·</span>
                <span>Effective Date: January 1, 2026</span>
                <span>·</span>
                <span>Version 2.4</span>
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

        {/* Scrollable Policy Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* Executive Summary */}
          <section className={`p-4 rounded-xl border ${
            isLight ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-900/60 text-emerald-200'
          }`}>
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Institutional Data Stewardship Commitment
            </h3>
            <p className="text-xs leading-normal">
              Ephesians Outreach operates this ministry portal (accessible at ephesiansoutreach.org) to facilitate evangelism records, field census management, soul care, and discipleship oversight. We uphold strict confidentiality protocols protecting the personal information of new converts, church leaders, and outreach workers.
            </p>
          </section>

          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
              1. Information We Collect
            </h3>
            <p className="text-slate-400">
              In conducting gospel outreach, field campaigns, and pastoral follow-ups, authorized field ministers and leaders record:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Field Outreach Data:</strong> Date of outreach, designated location/community, bacenta assignment, total souls won, and outreach attendance.</li>
              <li><strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Convert Contact Details:</strong> Full name, verified mobile phone number, location address, pastoral follow-up status (e.g. Born Again, Holy Ghost Baptized), and prayer requests provided voluntarily during evangelism encounters.</li>
              <li><strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Leadership Account Credentials:</strong> Full name, institutional email address, ministerial hierarchy role (Admin, General Overseer, Council Overseer, Governor, Bacenta Leader), and cryptographically salted password hashes.</li>
              <li><strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Audit and Operational Logs:</strong> Timestamped action logs capturing record entries, data modifications, and report generation for integrity and accountability.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              2. Purpose of Data Processing
            </h3>
            <p className="text-slate-400">
              Information collected through this portal is utilized exclusively for genuine ecclesiastical and pastoral objectives:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Direct pastoral follow-up, discipleship visitation, and convert spiritual integration into local bacentas.</li>
              <li>Accurate reporting to Governors, Council Overseers, and General Overseers regarding evangelism milestones.</li>
              <li>Ensuring convert care accountability so that no soul is neglected or left without spiritual shepherding.</li>
              <li>Verification of field entries against duplicate records and maintenance of authentic ministry ledgers.</li>
            </ul>
            <p className="text-slate-400 font-semibold pt-1">
              Ephesians Outreach strictly does not sell, lease, rent, monetize, or disclose personal convert data to third-party advertisers, commercial entities, or unverified external organizations.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
              3. Role-Based Access Governance
            </h3>
            <p className="text-slate-400">
              Access to convert records and leadership data is strictly gated by hierarchical ecclesiastical authorization:
            </p>
            <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <p><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Bacenta Leaders:</strong> Have access exclusively to their own outreach submissions and the converts directly assigned to their bacenta.</p>
              <p><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Governors:</strong> Have access to aggregated data and convert rosters strictly within the bacentas under their assigned Governorship.</p>
              <p><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Council Overseers:</strong> Supervise records across all governorships and bacentas within their territorial council boundary.</p>
              <p><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Lead Administrator & General Overseer:</strong> Hold comprehensive administrative oversight to audit records, manage access permissions, and generate institutional harvest reports.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <RefreshCw className="w-4 h-4 text-emerald-500 shrink-0" />
              4. Data Retention, Security & Offline Synchronization
            </h3>
            <p className="text-slate-400">
              Data transmitted via ephesiansoutreach.org is secured in transit using TLS 1.3 encryption. For field ministers operating in areas with intermittent connectivity, local device caching (IndexedDB/LocalStorage) is employed. Cached records are synchronized securely to the central church database immediately upon re-establishing connection and cleared from transient client cache in accordance with data sanitation policies.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
              5. Rights of Individuals & Contact Office
            </h3>
            <p className="text-slate-400">
              Any individual or convert registered on this system maintains the right to request review, correction, or deletion of their contact details. Inquiries regarding data privacy or requests to update records can be addressed directly to the administrative desk:
            </p>
            <div className={`p-3 rounded-lg border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <p className="font-semibold">Ephesians Outreach Administrative Data Office</p>
              <p className="text-slate-400">Email: dogbatseyfredrick@gmail.com</p>
              <p className="text-slate-400">Institutional Portal: https://ephesiansoutreach.org</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/80'
          }`}
        >
          <span className="text-xs text-slate-500">
            Ephesians Outreach · Official Ministry Record Governance
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
