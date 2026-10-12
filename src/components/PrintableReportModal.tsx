import React, { useState } from 'react';
import { X, Printer, Download, Sparkles, Building2, CheckCircle2, FileDown } from 'lucide-react';
import { OutreachEntry, UserProfile, OutreachLevel, OutreachType, isCouncilOverseer } from '../types';
import { generateAnalyticsPDF } from '../services/pdfExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  outreaches: OutreachEntry[];
  currentUser: UserProfile | null;
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
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      setIsExportingPDF(true);
      // Timeline Trend
      const groupedTimeline = new Map<string, number>();
      [...outreaches]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach((o) => {
          groupedTimeline.set(o.date, (groupedTimeline.get(o.date) || 0) + o.soulsWonCount);
        });
      const timelineData = Array.from(groupedTimeline.entries()).map(([date, souls]) => ({ date, souls }));

      // Types
      const typesMap: Record<OutreachType, { souls: number; count: number }> = {
        'Door to Door / 1 v 1': { souls: 0, count: 0 },
        'Busstop': { souls: 0, count: 0 },
        'Street Invasion / Stomp the Yard': { souls: 0, count: 0 },
        'Crusade': { souls: 0, count: 0 },
        'Dance Outreach': { souls: 0, count: 0 },
        'Other': { souls: 0, count: 0 },
      };
      outreaches.forEach((o) => {
        const t = o.outreachType as OutreachType;
        if (typesMap[t]) {
          typesMap[t].souls += o.soulsWonCount;
          typesMap[t].count += 1;
        }
      });
      const typeMetrics = Object.entries(typesMap).map(([name, d]) => ({
        name,
        souls: d.souls,
        count: d.count,
      }));

      // Council Leaderboard
      const councilMap = new Map<string, { council: string; souls: number; leaders: number; count: number }>();
      outreaches.forEach((o) => {
        const existing = councilMap.get(o.councilName) || {
          council: o.councilName,
          souls: 0,
          leaders: 0,
          count: 0,
        };
        existing.souls += o.soulsWonCount;
        existing.leaders += o.leadersPresentCount;
        existing.count += 1;
        councilMap.set(o.councilName, existing);
      });
      const councilLeaderboard = Array.from(councilMap.values()).sort((a, b) => b.souls - a.souls);

      // Levels
      const levelBreakdown: Record<OutreachLevel, number> = {
        Bacentas: 0,
        Governorships: 0,
        Councils: 0,
        Overseership: 0,
      };
      outreaches.forEach((o) => {
        if (levelBreakdown[o.outreachLevel] !== undefined) {
          levelBreakdown[o.outreachLevel] += o.soulsWonCount;
        }
      });

      const allConverts = outreaches.flatMap((o) => o.converts || []);
      const uncontacted = allConverts.filter((c) => c.followUpStatus === 'Uncontacted').length;

      generateAnalyticsPDF({
        currentUser: currentUser || {
          id: 'user_public',
          name: 'Executive Overseer',
          email: 'admin@ephesiansoutreach.org',
          password: '',
          role: 'admin',
          roleTitle: 'General Overseer Operations',
          council: 'All Councils',
          avatarInitials: 'EO',
          avatarColor: 'bg-emerald-600',
        },
        filters: {
          dateFilter: 'all',
          councilFilter: currentUser && isCouncilOverseer(currentUser.role) ? (currentUser.council || 'Ephesians 1') : 'all',
          levelFilter: 'all',
        },
        kpis: {
          totalSouls,
          totalOutreaches: totalEvents,
          totalLeadersEngaged: totalLeaders,
          avgSoulsPerOutreach: totalEvents > 0 ? (totalSouls / totalEvents).toFixed(1) : '0',
          uncontactedConvertsCount: uncontacted,
        },
        timelineData,
        typeMetrics,
        councilLeaderboard,
        levelBreakdown,
        filteredData: outreaches,
      });
    } finally {
      setIsExportingPDF(false);
    }
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
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Download compiled PDF document with charts"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isExportingPDF ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Browser</span>
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
                <strong className="text-slate-300 print:text-slate-900">Overseer:</strong> {currentUser ? currentUser.name : 'Public Executive View'}
              </p>
              <p>
                <strong className="text-slate-300 print:text-slate-900">Account:</strong> {currentUser ? currentUser.email : 'Public Session'}
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
                {outreaches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 italic text-xs">
                      No outreach activities recorded in the ledger yet.
                    </td>
                  </tr>
                ) : (
                  outreaches.map((row) => (
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
                  ))
                )}
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
