import React from 'react';
import { X, Printer, Download, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { OutreachEntry, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
}

export const PrintableReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  outreaches,
  currentUser,
}) => {
  if (!isOpen) return null;

  const totalSouls = outreaches.reduce((acc, curr) => acc + curr.soulsWonCount, 0);
  const totalLeaders = outreaches.reduce((acc, curr) => acc + curr.leadersPresentCount, 0);
  const totalEvents = outreaches.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header Action Bar (Not shown in physical print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              Ministry Field Operations Executive Briefing
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 overflow-y-auto space-y-6 bg-slate-900 text-slate-100 print:bg-white print:text-slate-900 print:p-0 print:m-0">
          {/* Document Letterhead */}
          <div className="border-b-2 border-slate-800 print:border-slate-900 pb-6 flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 print:text-slate-500 block">
                Official Ministry Evangelism Record
              </span>
              <h1 className="text-3xl font-extrabold text-white print:text-slate-900 tracking-tight mt-1">
                EPHESIANS OUTREACH
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1 max-w-md">
                Evangelism Field Operations, Soul Harvest Analytics & Leader Turnout Report
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-slate-600">
              <p>
                <strong className="text-slate-300 print:text-slate-900">Date Generated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p>
                <strong className="text-slate-300 print:text-slate-900">Overseer:</strong> {currentUser.name}
              </p>
              <p>
                <strong className="text-slate-300 print:text-slate-900">Account:</strong> {currentUser.email}
              </p>
              <p>
                <strong className="text-slate-300 print:text-slate-900">Status:</strong> Certified & Audited
              </p>
            </div>
          </div>

          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-3 gap-4 border border-slate-800 print:border-slate-200 rounded-xl p-4 bg-slate-950/60 print:bg-slate-50/50">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-500 block font-semibold">
                Total Souls Won
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 print:text-slate-900 tabular-nums">
                {totalSouls}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-500 block font-semibold">
                Operations Conducted
              </span>
              <span className="text-2xl font-extrabold text-white print:text-slate-900 tabular-nums">
                {totalEvents}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-500 block font-semibold">
                Leaders Mobilized
              </span>
              <span className="text-2xl font-extrabold text-white print:text-slate-900 tabular-nums">
                {totalLeaders}
              </span>
            </div>
          </div>

          {/* Field Operations Summary Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-white print:text-slate-900 text-sm uppercase tracking-wider border-b border-slate-800 print:border-slate-200 pb-1">
              Field Operations Audit Ledger
            </h3>
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Council Name</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Outreach Type</th>
                  <th className="py-2.5 px-3 text-right">Leaders</th>
                  <th className="py-2.5 px-3 text-right">Souls Won</th>
                  <th className="py-2.5 px-3">Location / Field</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-100">
                {outreaches.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 px-3 font-mono text-slate-300 print:text-slate-800">{row.date}</td>
                    <td className="py-2 px-3 font-semibold text-white print:text-slate-900">{row.councilName}</td>
                    <td className="py-2 px-3 text-slate-400 print:text-slate-600">{row.outreachLevel}</td>
                    <td className="py-2 px-3 text-slate-300 print:text-slate-700">{row.outreachType}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-300 print:text-slate-800 tabular-nums">
                      {row.leadersPresentCount}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400 print:text-slate-900 tabular-nums">
                      {row.soulsWonCount}
                    </td>
                    <td className="py-2 px-3 text-slate-400 print:text-slate-500 truncate max-w-[140px]">
                      {row.locationArea || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ministry Sign-Off Seal */}
          <div className="pt-8 border-t border-slate-800 print:border-slate-200 flex items-end justify-between text-xs text-slate-400 print:text-slate-600">
            <div>
              <p className="font-semibold text-slate-200 print:text-slate-800">Ephesians Outreach Ministry</p>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                "And how shall they hear without a preacher? And how shall they preach, except they be sent?"
              </p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-700 print:border-slate-400 mb-1" />
              <p className="font-semibold text-white print:text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 print:text-slate-500">Authorized Overseer / Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
