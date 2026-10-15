import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Award,
  Bell,
  Sparkles,
  Download,
  FileDown,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ChevronRight,
  Filter,
  RefreshCw,
  PhoneCall,
  UserCheck,
  Camera,
  UserPlus,
  Image as ImageIcon,
  Target,
} from 'lucide-react';
import {
  OutreachEntry,
  UserProfile,
  SystemAlert,
  OutreachType,
  OutreachLevel,
  FieldObjective,
} from '../types';
import {
  getSystemAlerts,
  markAlertRead,
  exportOutreachesToCSV,
  getCouncils,
} from '../services/storage';
import { generateAnalyticsPDF } from '../services/pdfExport';
import {
  getFieldObjectives,
  subscribeToObjectives,
  approveOutreach,
} from '../services/realtime';
import { CreateObjectiveModal } from './CreateObjectiveModal';
import { OutreachPicturesGallery } from './OutreachPicturesGallery';
import { AppLogo } from './AppLogo';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  onOpenReportPrint: () => void;
  onNavigateToConverts: () => void;
  onNavigateToLog: () => void;
  onNavigateToForm?: () => void;
  onOpenRegisterModal?: () => void;
  theme?: 'dark' | 'light';
}

export const AdminDashboard: React.FC<Props> = ({
  outreaches,
  currentUser,
  onOpenReportPrint,
  onNavigateToConverts,
  onNavigateToLog,
  onNavigateToForm,
  onOpenRegisterModal,
  theme = 'dark',
}) => {
  // Views: Metrics vs Outreach Pictures
  const [dashboardTab, setDashboardTab] = useState<'metrics' | 'pictures'>('metrics');

  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [councilFilter, setCouncilFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [objectives, setObjectives] = useState<FieldObjective[]>(getFieldObjectives);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Total pictures across all outreaches
  const picturesCount = useMemo(() => {
    return outreaches.reduce((acc, o) => {
      const photos =
        o.attachments?.filter(
          (a) =>
            a.previewUrl ||
            a.type?.startsWith('image/') ||
            a.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
        ) || [];
      return acc + photos.length;
    }, 0);
  }, [outreaches]);

  useEffect(() => {
    const unsub = subscribeToObjectives((updated) => {
      setObjectives(updated);
    });
    return unsub;
  }, []);

  const pendingApprovals = useMemo(() => {
    return outreaches.filter((o) => o.approvalStatus === 'pending');
  }, [outreaches]);

  const handleQuickApprove = async (outreach: OutreachEntry) => {
    try {
      setApprovingId(outreach.id);
      await approveOutreach(outreach.id, currentUser);
    } finally {
      setApprovingId(null);
    }
  };

  const [alertThresholds, setAlertThresholds] = useState({
    milestoneSouls: 30,
    minLeadersCrusade: 5,
  });

  const alerts = getSystemAlerts();

  const councilsList = useMemo(() => {
    return Array.from(new Set([...getCouncils(), ...outreaches.map((o) => o.councilName)]));
  }, [outreaches]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return outreaches.filter((item) => {
      // Council filter
      if (councilFilter !== 'all' && item.councilName !== councilFilter) return false;
      // Level filter
      if (levelFilter !== 'all' && item.outreachLevel !== levelFilter) return false;
      // Date filter
      if (dateFilter === '7days') {
        const itemDate = new Date(item.date).getTime();
        const diffDays = (Date.now() - itemDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      } else if (dateFilter === '30days') {
        const itemDate = new Date(item.date).getTime();
        const diffDays = (Date.now() - itemDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) return false;
      }
      return true;
    });
  }, [outreaches, councilFilter, levelFilter, dateFilter]);

  // Key Performance Indicators (KPIs)
  const totalSouls = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.soulsWonCount, 0),
    [filteredData]
  );

  const totalOutreaches = filteredData.length;

  const totalLeadersEngaged = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.leadersPresentCount, 0),
    [filteredData]
  );

  const avgSoulsPerOutreach = totalOutreaches > 0 ? (totalSouls / totalOutreaches).toFixed(1) : '0';

  // Total recorded converts needing follow up
  const allConverts = useMemo(() => {
    return filteredData.flatMap((o) => o.converts || []);
  }, [filteredData]);

  const uncontactedConvertsCount = allConverts.filter(
    (c) => c.followUpStatus === 'Uncontacted'
  ).length;

  // Outreach Types Breakdown
  const typeMetrics = useMemo(() => {
    const types: Record<OutreachType, { souls: number; count: number }> = {
      'Door to Door / 1 v 1': { souls: 0, count: 0 },
      'Busstop': { souls: 0, count: 0 },
      'Street Invasion / Stomp the Yard': { souls: 0, count: 0 },
      'Crusade': { souls: 0, count: 0 },
      'Dance Outreach': { souls: 0, count: 0 },
      'Other': { souls: 0, count: 0 },
    };

    filteredData.forEach((item) => {
      const t = item.outreachType as OutreachType;
      if (types[t]) {
        types[t].souls += item.soulsWonCount;
        types[t].count += 1;
      }
    });

    return Object.entries(types).map(([name, data]) => ({
      name,
      souls: data.souls,
      count: data.count,
    }));
  }, [filteredData]);

  // Council Leaderboard
  const councilLeaderboard = useMemo(() => {
    const map = new Map<string, { council: string; souls: number; leaders: number; count: number }>();

    filteredData.forEach((o) => {
      const existing = map.get(o.councilName) || {
        council: o.councilName,
        souls: 0,
        leaders: 0,
        count: 0,
      };
      existing.souls += o.soulsWonCount;
      existing.leaders += o.leadersPresentCount;
      existing.count += 1;
      map.set(o.councilName, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.souls - a.souls);
  }, [filteredData]);

  // Outreach Level Breakdown
  const levelBreakdown = useMemo(() => {
    const counts: Record<OutreachLevel, number> = {
      Bacentas: 0,
      Governorships: 0,
      Councils: 0,
      Overseership: 0,
    };
    filteredData.forEach((o) => {
      if (counts[o.outreachLevel] !== undefined) {
        counts[o.outreachLevel] += o.soulsWonCount;
      }
    });
    return counts;
  }, [filteredData]);

  // Timeline Trend (sorted by date)
  const timelineData = useMemo(() => {
    const grouped = new Map<string, number>();
    [...filteredData]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((o) => {
        const current = grouped.get(o.date) || 0;
        grouped.set(o.date, current + o.soulsWonCount);
      });
    return Array.from(grouped.entries()).map(([date, souls]) => ({ date, souls }));
  }, [filteredData]);

  // Max value for timeline chart scale
  const maxTimelineSouls = Math.max(...timelineData.map((d) => d.souls), 20);

  // Download CSV
  const handleDownloadCSV = () => {
    const csv = exportOutreachesToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ephesians_outreach_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download PDF Report with Analytics Charts and Summarized Ministry Metrics
  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      generateAnalyticsPDF({
        currentUser,
        filters: {
          dateFilter,
          councilFilter,
          levelFilter,
        },
        kpis: {
          totalSouls,
          totalOutreaches,
          totalLeadersEngaged,
          avgSoulsPerOutreach,
          uncontactedConvertsCount,
        },
        timelineData,
        typeMetrics,
        councilLeaderboard,
        levelBreakdown,
        filteredData,
      });
      setPdfSuccessMessage('Ministry analytics PDF report successfully compiled and downloaded!');
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to export analytics PDF:', err);
      alert('Unable to generate PDF report. Please check system console.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification for Export */}
      {pdfSuccessMessage && (
        <div className="bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dashboard Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <AppLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Field Operations & Harvest Analytics
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              Tracking evangelism impact across Councils, Governorships, and Bacentas
            </p>
          </div>
        </div>

        {/* Action Buttons: Export & Official Print */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              title="Register new Admin, Overseer, Governor, or Bacenta Leader"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Register Leadership</span>
            </button>
          )}

          <button
            onClick={() => setIsObjectiveModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-amber-200 bg-amber-950/80 hover:bg-amber-900/80 border border-amber-700/80 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            title="Establish new target objective and alert field leaders via real-time WebSocket"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Set Field Objective</span>
          </button>

          <button
            onClick={() => setShowAlertConfig(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-colors flex items-center gap-1.5"
            title="Configure Alert Rules"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Alert Rules</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-colors flex items-center gap-1.5"
            title="Export raw tabular data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            title="Export downloadable PDF report with analytics charts and summarized ministry metrics"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPDF ? 'Generating PDF...' : 'Export Analytics PDF'}</span>
          </button>

          <button
            onClick={onOpenReportPrint}
            className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-colors flex items-center gap-1.5"
            title="View printable letterhead preview"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Official Brief</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Metrics & Operations vs Outreach Pictures */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setDashboardTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            dashboardTab === 'metrics'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Metrics & Analytics</span>
        </button>

        <button
          onClick={() => setDashboardTab('pictures')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            dashboardTab === 'pictures'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Outreach Pictures ({picturesCount})</span>
        </button>
      </div>

      {dashboardTab === 'pictures' ? (
        <OutreachPicturesGallery
          outreaches={outreaches}
          currentUser={currentUser}
          theme={theme}
          showCouncilFilter={true}
          title="All Councils Outreach Picture Vault"
          subtitle="General Overseer view across all 5 Councils, Governorships, and Bacentas"
        />
      ) : (
        <>

      {/* Zero State Notice Banner */}
      {outreaches.length === 0 && (
        <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/50 text-emerald-400 border border-emerald-700/60 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Database is Clean — Ready for First Entry</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All sample records have been cleared. Submit your first field outreach using the <strong>Field Entry</strong> form to test real-time analytics and charts!
              </p>
            </div>
          </div>
          {onNavigateToForm && (
            <button
              onClick={onNavigateToForm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shadow-sm shrink-0"
            >
              Log First Outreach →
            </button>
          )}
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-300">Filters:</span>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-medium"
          >
            <option value="all">All Dates</option>
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
          </select>

          <select
            value={councilFilter}
            onChange={(e) => setCouncilFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-medium max-w-[150px] truncate"
          >
            <option value="all">All Councils</option>
            {councilsList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-medium"
          >
            <option value="all">All Levels</option>
            <option value="Bacentas">Bacentas</option>
            <option value="Governorships">Governorships</option>
            <option value="Overseership">Overseership</option>
          </select>
        </div>

        <div className="text-slate-400">
          Showing <strong className="text-slate-100">{filteredData.length}</strong> of {outreaches.length} field operations
        </div>
      </div>

      {/* PENDING FIELD APPROVALS BANNER (Real-Time Leader Notification Trigger) */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-700/80 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Pending Leader Outreach Submissions ({pendingApprovals.length})</span>
              </h3>
            </div>
            <span className="text-[11px] text-amber-300 font-semibold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
              Awaiting Admin Approval
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Field leaders submitted the following operations. Approving an entry automatically sends an immediate <strong>real-time push alert & audio chime</strong> to the submitting leader.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingApprovals.slice(0, 3).map((pending) => (
              <div
                key={pending.id}
                className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{pending.councilName}</span>
                    <span className="font-mono text-[10px] text-slate-400">{pending.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Submitted by <strong>{pending.submittedBy.name}</strong> •{' '}
                    <span className="text-emerald-400 font-bold">{pending.soulsWonCount} souls</span>
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {pending.outreachType} • {pending.locationArea || 'Field area'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleQuickApprove(pending)}
                    disabled={approvingId === pending.id}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{approvingId === pending.id ? 'Approving...' : 'Approve & Notify Leader'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE FIELD OBJECTIVES & MINISTRY MANDATES */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm sm:text-base">
                Active Field Objectives & Mandates
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-wider">
                Live Directives
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target mandates established by the Overseer and dispatched in real time to field leaders
            </p>
          </div>

          <button
            onClick={() => setIsObjectiveModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto shrink-0"
          >
            <Target className="w-3.5 h-3.5" />
            <span>+ Set Field Objective</span>
          </button>
        </div>

        {objectives.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No active field objectives currently set. Click &quot;+ Set Field Objective&quot; to broadcast new mandates to field leaders.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {objectives.map((obj) => {
              // Calculate progress against objective target in this council
              const relevantOutreaches =
                obj.targetCouncil === 'All Councils'
                  ? outreaches
                  : outreaches.filter((o) => o.councilName === obj.targetCouncil);
              const soulsAchieved = relevantOutreaches.reduce(
                (acc, curr) => acc + curr.soulsWonCount,
                0
              );
              const progressPct = Math.min(
                100,
                Math.round((soulsAchieved / (obj.targetSouls || 1)) * 100)
              );

              return (
                <div
                  key={obj.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          obj.priority === 'urgent'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : obj.priority === 'high'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {obj.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Due: {obj.deadline}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">{obj.title}</h4>
                    <p className="text-xs text-emerald-400 font-medium">
                      Target Council: <strong>{obj.targetCouncil}</strong>
                    </p>
                    {obj.instructions && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {obj.instructions}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Harvest Progress</span>
                      <span className="text-white font-bold tabular-nums text-[11px]">
                        {soulsAchieved} / {obj.targetSouls} souls ({progressPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full rounded-full transition-all ${
                          progressPct >= 100
                            ? 'bg-emerald-400'
                            : progressPct >= 50
                            ? 'bg-amber-400'
                            : 'bg-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AUTOMATED ALERTS RIBBON */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Automated Operational Alerts & Insights
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {alerts.filter((a) => !a.read).length} unread alerts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  alert.severity === 'celebration'
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : alert.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    {alert.severity === 'celebration' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                    {alert.severity === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    {alert.severity === 'info' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{alert.title}</span>
                  </div>
                  {!alert.read && (
                    <button
                      onClick={() => markAlertRead(alert.id)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
                <p className="text-xs mt-1 text-slate-300 leading-snug">{alert.message}</p>
                {alert.actionText && (
                  <button
                    onClick={() => {
                      if (alert.actionText?.includes('Converts') || alert.actionText?.includes('Roster')) {
                        onNavigateToConverts();
                      } else {
                        onNavigateToLog();
                      }
                    }}
                    className="mt-2 text-[11px] font-bold text-white flex items-center gap-1 hover:underline"
                  >
                    <span>{alert.actionText}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total Souls */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Souls Won</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
              {totalSouls.toLocaleString()}
            </span>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Harvest Total</p>
          </div>
        </div>

        {/* Metric 2: Outreaches Conducted */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Operations Logged</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
              {totalOutreaches}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Field events</p>
          </div>
        </div>

        {/* Metric 3: Active Leaders Mobilized */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Leaders Mobilized</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
              {totalLeadersEngaged}
            </span>
            <p className="text-[11px] text-purple-300 font-medium mt-0.5">Member turnouts</p>
          </div>
        </div>

        {/* Metric 4: Average Harvest Yield */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Yield</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
              {avgSoulsPerOutreach}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Souls / outreach</p>
          </div>
        </div>

        {/* Metric 5: Follow-Up Backlog */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xs col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Follow-up Backlog</span>
            <PhoneCall className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 tabular-nums">
              {uncontactedConvertsCount}
            </span>
            <p className="text-[11px] text-rose-300 font-medium mt-0.5">Pending first call</p>
          </div>
        </div>
      </div>

      {/* VISUAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: TIMELINE HARVEST TREND (SVG CURVE/BARS) */}
        <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Souls Won Timeline Trend</h3>
              <p className="text-xs text-slate-400">Daily harvest momentum across all participating councils</p>
            </div>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg">
              {totalSouls} Total Souls
            </span>
          </div>

          {timelineData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              No field outreach entries logged yet. Submit your first report to view harvest timeline curves.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-48 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
                {timelineData.map((item, idx) => {
                  const heightPct = Math.max(10, Math.round((item.souls / maxTimelineSouls) * 100));
                  return (
                    <div
                      key={item.date + idx}
                      className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 border border-slate-700 text-white text-[10px] py-0.5 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                        {item.date}: {item.souls} souls
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-emerald-700 to-emerald-400 rounded-t-md transition-all group-hover:opacity-90"
                      />
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[48px]">
                        {item.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: OUTREACH TYPES BREAKDOWN */}
        <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Outreach Type Effectiveness</h3>
              <p className="text-xs text-slate-400">Harvest yield comparison by evangelism method</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Souls / Events</span>
          </div>

          <div className="space-y-3 pt-1">
            {typeMetrics.map((type) => {
              const maxSouls = Math.max(...typeMetrics.map((t) => t.souls), 1);
              const percentage = Math.round((type.souls / maxSouls) * 100);

              return (
                <div key={type.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{type.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">{type.count} events</span>
                      <strong className="text-white tabular-nums font-bold w-12 text-right">
                        {type.souls} souls
                      </strong>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: COUNCIL LEADERBOARD & OUTREACH LEVEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COUNCIL RANKINGS (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Council Performance Leaderboard</h3>
              <p className="text-xs text-slate-400">Ranked by total converts and leader participation</p>
            </div>
            <button
              onClick={onNavigateToLog}
              className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Council Name</th>
                  <th className="pb-2 text-right">Events</th>
                  <th className="pb-2 text-right">Leaders Present</th>
                  <th className="pb-2 text-right">Souls Won</th>
                  <th className="pb-2 text-right">Avg Souls/Evt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {councilLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs italic">
                      No outreach operations recorded yet. Councils will rank here dynamically once field reports are submitted.
                    </td>
                  </tr>
                ) : (
                  councilLeaderboard.map((row, index) => (
                    <tr key={row.council} className="hover:bg-slate-800/40">
                      <td className="py-2.5 flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            index === 0
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : index === 1
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-850 text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-100">{row.council}</span>
                      </td>
                      <td className="py-2.5 text-right text-slate-300 tabular-nums">{row.count}</td>
                      <td className="py-2.5 text-right text-slate-300 tabular-nums">{row.leaders}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400 tabular-nums">
                        {row.souls}
                      </td>
                      <td className="py-2.5 text-right text-slate-400 tabular-nums">
                        {(row.souls / (row.count || 1)).toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* OUTREACH LEVEL DISTRIBUTION (1 Col) */}
        <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Outreach Level Distribution</h3>
            <p className="text-xs text-slate-400">Distribution of souls by organizational tier</p>
          </div>

          <div className="space-y-4 pt-2">
            {(['Bacentas', 'Governorships', 'Overseership'] as OutreachLevel[]).map((level) => {
              const souls = levelBreakdown[level] || 0;
              const pct = totalSouls > 0 ? Math.round((souls / totalSouls) * 100) : 0;
              return (
                <div key={level} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{level}</span>
                    <span className="font-bold text-white tabular-nums">
                      {souls} souls ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        level === 'Bacentas'
                          ? 'bg-amber-500'
                          : level === 'Governorships'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={onNavigateToConverts}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Manage Convert Follow-Up</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* ALERT THRESHOLDS CONFIG DRAWER */}
      {showAlertConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Custom Alert Rules & Thresholds</h3>
              <button
                onClick={() => setShowAlertConfig(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  High Harvest Celebration Threshold (Souls won in single event)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={alertThresholds.milestoneSouls}
                    onChange={(e) =>
                      setAlertThresholds({
                        ...alertThresholds,
                        milestoneSouls: parseInt(e.target.value) || 20,
                      })
                    }
                    className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100"
                  />
                  <span className="text-xs text-slate-400">souls or more</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Crusade Low Mobilization Warning Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={alertThresholds.minLeadersCrusade}
                    onChange={(e) =>
                      setAlertThresholds({
                        ...alertThresholds,
                        minLeadersCrusade: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100"
                  />
                  <span className="text-xs text-slate-400">leaders minimum required</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-400 leading-relaxed border border-slate-800">
                Automated alerts evaluate continuously upon submission of field outreach forms. Notifications are distributed to Governors and Overseers.
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setShowAlertConfig(false)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
              >
                Save Alert Settings
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE OBJECTIVE MODAL */}
      <CreateObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={() => setIsObjectiveModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
