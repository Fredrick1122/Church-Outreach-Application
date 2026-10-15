import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  Award,
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileDown,
  Phone,
  Mail,
  Shield,
  Layers,
  Heart,
  ChevronRight,
  Flame,
  UserCheck,
  Building2,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import {
  OutreachEntry,
  UserProfile,
  ConvertRecord,
  getHierarchyTier,
} from '../types';
import { exportMinistryReportPDF } from '../services/pdfExport';
import { OutreachPicturesGallery } from './OutreachPicturesGallery';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  onOpenReportPrint?: () => void;
  onNavigateToForm?: () => void;
  onNavigateToLeaders?: () => void;
  onNavigateToConverts?: () => void;
  theme?: 'dark' | 'light';
}

export const LeaderDashboard: React.FC<Props> = ({
  outreaches,
  currentUser,
  onOpenReportPrint,
  onNavigateToForm,
  onNavigateToLeaders,
  onNavigateToConverts,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'submissions' | 'converts' | 'jurisdiction'>('submissions');
  const [selectedOutreachForPhotos, setSelectedOutreachForPhotos] = useState<OutreachEntry | null>(null);

  const tier = getHierarchyTier(currentUser.role);

  // Filter outreaches strictly for this leader or their assigned bacenta
  const leaderOutreaches = useMemo(() => {
    return outreaches.filter((o) => {
      const matchBacenta = currentUser.bacenta && o.bacentaName?.toLowerCase() === currentUser.bacenta.toLowerCase();
      const matchEmail = o.submittedBy?.email?.toLowerCase() === currentUser.email?.toLowerCase();
      const matchCouncil = o.councilName === currentUser.council;
      return matchBacenta || matchEmail || matchCouncil;
    });
  }, [outreaches, currentUser]);

  // Aggregate stats
  const totalSoulsWon = useMemo(
    () => leaderOutreaches.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0),
    [leaderOutreaches]
  );

  const totalBornAgain = useMemo(
    () =>
      leaderOutreaches.reduce(
        (sum, o) =>
          sum + (o.converts?.filter((c) => c.decision === 'Born Again').length || 0),
        0
      ),
    [leaderOutreaches]
  );

  const totalFirstTimers = useMemo(
    () =>
      leaderOutreaches.reduce(
        (sum, o) =>
          sum + (o.converts?.filter((c) => c.decision === 'First Time Visitor').length || 0),
        0
      ),
    [leaderOutreaches]
  );

  const totalMobilizedLeaders = useMemo(
    () => leaderOutreaches.reduce((sum, o) => sum + (o.leadersPresentCount || 0), 0),
    [leaderOutreaches]
  );

  // Collect all converts logged under this leader's outreaches
  const allConverts = useMemo(() => {
    const list: Array<ConvertRecord & { outreachDate: string; outreachLocation: string }> = [];
    leaderOutreaches.forEach((o) => {
      if (Array.isArray(o.converts)) {
        o.converts.forEach((c) => {
          list.push({
            ...c,
            outreachDate: o.date,
            outreachLocation: o.locationArea || o.councilName,
          });
        });
      }
    });
    return list;
  }, [leaderOutreaches]);

  // Filtered outreaches
  const filteredOutreaches = useMemo(() => {
    return leaderOutreaches.filter((o) => {
      const matchQuery =
        (o.locationArea?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        o.outreachType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.bacentaName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        o.date?.includes(searchQuery);

      const matchType = selectedTypeFilter === 'all' || o.outreachType === selectedTypeFilter;
      return matchQuery && matchType;
    });
  }, [leaderOutreaches, searchQuery, selectedTypeFilter]);

  const handleExportPDF = () => {
    if (onOpenReportPrint) {
      onOpenReportPrint();
    } else {
      exportMinistryReportPDF({
        currentUser,
        outreaches: leaderOutreaches,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Header Banner: Leader Workspace & Identity */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          theme === 'light'
            ? 'bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-emerald-200'
            : 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30 border-slate-800'
        }`}
      >
        <div className="flex items-start sm:items-center gap-4.5 z-10 min-w-0">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg ${
              currentUser.avatarColor || 'bg-emerald-600'
            }`}
          >
            {currentUser.avatarInitials || 'LD'}
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={`text-xl sm:text-2xl font-black tracking-tight truncate ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}
              >
                {currentUser.name}
              </h1>
              <span
                className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border uppercase tracking-wider ${tier.badgeBg} ${tier.badgeColor} ${tier.badgeBorder}`}
              >
                Level {tier.level} · {currentUser.roleTitle || 'Bacenta Leader'}
              </span>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <Building2 className="w-3.5 h-3.5" />
                {currentUser.council}
              </span>
              {currentUser.governorship && (
                <span className="flex items-center gap-1">
                  / <Shield className="w-3.5 h-3.5 text-blue-400" />
                  {currentUser.governorship}
                </span>
              )}
              {currentUser.bacenta && (
                <span className="flex items-center gap-1 font-bold text-amber-300">
                  / <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {currentUser.bacenta} Bacenta
                </span>
              )}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {currentUser.email}
              </span>
              {currentUser.phone && (
                <a
                  href={`tel:${currentUser.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {currentUser.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap z-10 w-full sm:w-auto">
          {onNavigateToForm && (
            <button
              onClick={onNavigateToForm}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Submit Outreach Form</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Download Ministry Activity PDF Report"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* 2. Scripture Exhortation for Field Leaders */}
      <div
        className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
          theme === 'light'
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs leading-relaxed">
          <span className="font-extrabold uppercase tracking-wider block text-amber-400 text-[10px]">
            Soul Winner Exhortation · Daniel 12:3
          </span>
          <em>"And they that be wise shall shine as the brightness of the firmament; and they that turn many to righteousness as the stars for ever and ever."</em>
        </div>
      </div>

      {/* 3. High-Impact KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Metric 1: Souls Won */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Souls Won</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalSoulsWon}</p>
          <p className="text-[11px] text-slate-500 mt-1">Salvation Decisions Logged</p>
        </div>

        {/* Metric 2: Born Again */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Born Again</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalBornAgain}</p>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed Conversions</p>
        </div>

        {/* Metric 3: First Timers */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">First Timers</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalFirstTimers}</p>
          <p className="text-[11px] text-slate-500 mt-1">New Believers / Visitors</p>
        </div>

        {/* Metric 4: Mobilized Members */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Leaders Present</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalMobilizedLeaders}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total Attendance Count</p>
        </div>

        {/* Metric 5: Outreaches Conducted */}
        <div
          className={`p-5 rounded-2xl border shadow-sm col-span-2 lg:col-span-1 ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Sessions</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{leaderOutreaches.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Field Outreaches Logged</p>
        </div>
      </div>

      {/* 4. Tab Navigation: Submissions, Converts, Jurisdiction */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'submissions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Outreach Submissions ({leaderOutreaches.length})
        </button>

        <button
          onClick={() => setActiveTab('converts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'converts'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Converts Follow-Up Directory ({allConverts.length})
        </button>

        <button
          onClick={() => setActiveTab('jurisdiction')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'jurisdiction'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Bacenta Jurisdiction & Leadership Team
        </button>
      </div>

      {/* 5. TAB CONTENT */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by location, outreach type, bacenta..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <option value="all">All Outreach Types</option>
              <option value="Door to Door / 1 v 1">Door to Door / 1 v 1</option>
              <option value="Crusade">Crusade</option>
              <option value="Busstop">Busstop</option>
              <option value="Street Invasion / Stomp the Yard">Street Invasion / Stomp the Yard</option>
              <option value="Dance Outreach">Dance Outreach</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Submissions List */}
          {filteredOutreaches.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white">No outreach forms recorded yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ready to record your soul winning harvest? Click below to submit your first report!
              </p>
              {onNavigateToForm && (
                <button
                  onClick={onNavigateToForm}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Field Report</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOutreaches.map((o) => (
                <div
                  key={o.id}
                  className={`p-5 rounded-3xl border transition-all space-y-3.5 ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                          {o.outreachType}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {o.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-white mt-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{o.locationArea || 'Field Outreach Session'}</span>
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          o.syncStatus === 'synced'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {o.syncStatus === 'synced' ? 'Cloud Synced' : 'Offline / Queued'}
                      </span>
                    </div>
                  </div>

                  {/* Stat counters */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Souls</span>
                      <span className="text-base font-black text-emerald-400">{o.soulsWonCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Converts</span>
                      <span className="text-base font-black text-purple-400">{o.converts?.length || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Leaders</span>
                      <span className="text-base font-black text-blue-400">{o.leadersPresentCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Photos</span>
                      <span className="text-base font-black text-amber-400">{o.attachments?.length || 0}</span>
                    </div>
                  </div>

                  {/* Additional info footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="truncate">
                      Council: <strong>{o.councilName}</strong>
                      {o.bacentaName && <span> · {o.bacentaName}</span>}
                    </span>

                    {Array.isArray(o.attachments) && o.attachments.length > 0 && (
                      <button
                        onClick={() => setSelectedOutreachForPhotos(o)}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Photos ({o.attachments.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONVERTS DIRECTORY */}
      {activeTab === 'converts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">New Believers & Converts Follow-Up</h3>
              <p className="text-xs text-slate-400">
                Souls registered under your leadership awaiting shepherding, phone calls, and discipleship.
              </p>
            </div>
            {onNavigateToConverts && (
              <button
                onClick={onNavigateToConverts}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Full CRM</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {allConverts.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-sm text-white">No individual convert names logged yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Converts recorded during your outreach submissions will appear here for discipleship.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allConverts.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-white truncate">{c.fullName}</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {c.decision}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-400">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone.replace(/\s+/g, '')}`}
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {c.phone}
                      </a>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Outreach: {c.outreachDate} · {c.outreachLocation}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {c.followUpStatus}
                      </span>
                      {c.needsFollowUp && (
                        <span className="text-amber-400 font-semibold">Needs Follow-Up</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: JURISDICTION & LEADERSHIP DIRECTORY */}
      {activeTab === 'jurisdiction' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Assigned Bacenta Jurisdiction</h3>
                <p className="text-xs text-slate-400">Your pastoral oversight cell placement</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Council:</span>
                <strong className="text-white font-bold">{currentUser.council}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Governorship:</span>
                <strong className="text-white font-bold">{currentUser.governorship || 'Assigned under Council'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Bacenta:</span>
                <strong className="text-amber-400 font-bold">{currentUser.bacenta || 'Main Bacenta'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Official Title:</span>
                <strong className="text-emerald-400 font-bold">{currentUser.roleTitle}</strong>
              </div>
            </div>
          </div>

          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Primary Lead Admin Support</h3>
                <p className="text-xs text-slate-400">Direct leadership contact for credentials & hierarchy</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-white text-sm">Fredrick Dogbatsey</p>
              <p className="text-emerald-400 font-medium">Primary Lead Admin</p>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <a href="tel:+233597365182" className="hover:underline font-bold text-emerald-400">
                    +233 59 736 5182
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>dogbatseyfredrick@gmail.com</span>
                </div>
              </div>
            </div>

            {onNavigateToLeaders && (
              <button
                onClick={onNavigateToLeaders}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Full Leadership Directory</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Outreach Photos Modal */}
      {selectedOutreachForPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                Outreach Photos: {selectedOutreachForPhotos.outreachType} ({selectedOutreachForPhotos.date})
              </h3>
              <button
                onClick={() => setSelectedOutreachForPhotos(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>
            <OutreachPicturesGallery
              outreaches={selectedOutreachForPhotos ? [selectedOutreachForPhotos] : leaderOutreaches}
              currentUser={currentUser}
              theme={theme}
              title={selectedOutreachForPhotos ? selectedOutreachForPhotos.locationArea || selectedOutreachForPhotos.councilName : 'Outreach Photos'}
            />
          </div>
        </div>
      )}
    </div>
  );
};
