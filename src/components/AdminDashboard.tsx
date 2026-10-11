import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Award,
  Bell,
  Sparkles,
  Download,
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
} from 'lucide-react';
import {
  OutreachEntry,
  UserProfile,
  SystemAlert,
  OutreachType,
  OutreachLevel,
} from '../types';
import {
  getSystemAlerts,
  markAlertRead,
  exportOutreachesToCSV,
  getCouncils,
} from '../services/storage';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  onOpenReportPrint: () => void;
  onNavigateToConverts: () => void;
  onNavigateToLog: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  outreaches,
  currentUser,
  onOpenReportPrint,
  onNavigateToConverts,
  onNavigateToLog,
}) => {
  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [councilFilter, setCouncilFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showAlertConfig, setShowAlertConfig] = useState(false);
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

  return (
    <div className="space-y-6 pb-20">
      {/* Dashboard Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Field Operations & Harvest Analytics
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking evangelism impact across Councils, Governorships, and Bacentas
          </p>
        </div>

        {/* Action Buttons: Export & Official Print */}
        <div className="flex items-center gap-2 flex-wrap">
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
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenReportPrint}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Official Report</span>
          </button>
        </div>
      </div>

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
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
              No data available for selected filter
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
                {councilLeaderboard.map((row, index) => (
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
                ))}
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
    </div>
  );
};
