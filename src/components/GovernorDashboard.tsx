import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  Award,
  Layers,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileDown,
  Shield,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  Lock,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import {
  OutreachEntry,
  UserProfile,
  OutreachLevel,
  OutreachType,
  ConvertRecord,
} from '../types';
import {
  getBacentasForGovernorship,
  addBacentaToGovernorship,
  getGovernorshipsForCouncil,
  getLeaderForCouncil,
  getLeaderForBacenta,
} from '../services/storage';
import { exportMinistryReportPDF } from '../services/pdfExport';
import { OutreachPicturesGallery } from './OutreachPicturesGallery';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  onOpenReportPrint?: () => void;
  onNavigateToForm?: () => void;
  onSelectUser?: (user: UserProfile) => void;
  theme?: 'dark' | 'light';
}

export const GovernorDashboard: React.FC<Props> = ({
  outreaches,
  currentUser,
  onOpenReportPrint,
  onNavigateToForm,
  onSelectUser,
  theme = 'dark',
}) => {
  const council = currentUser.council || 'Ephesians 1';
  const governorship =
    currentUser.governorship ||
    getGovernorshipsForCouncil(council)[0] ||
    `${council} Governorship`;
  const myBacentas = getBacentasForGovernorship(governorship);

  // Filters restricted strictly to this Governorship
  const [selectedBacenta, setSelectedBacenta] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dashboardTab, setDashboardTab] = useState<'database' | 'pictures'>('database');

  // Modals & States
  const [isAddBacentaOpen, setIsAddBacentaOpen] = useState(false);
  const [newBacentaName, setNewBacentaName] = useState<string>('');
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<OutreachEntry | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Add Bacenta under this governorship only
  const handleCreateBacenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBacentaName.trim()) return;
    addBacentaToGovernorship(governorship, newBacentaName.trim());
    setNewBacentaName('');
    setIsAddBacentaOpen(false);
  };

  // Export Governorship PDF
  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      exportMinistryReportPDF({
        currentUser,
        outreaches: govOutreaches,
        councilFilter: council,
      });
      setPdfSuccessMessage(`${governorship} report successfully downloaded.`);
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Outreaches belonging strictly to this Governorship
  const govOutreaches = useMemo(() => {
    return outreaches.filter((o) => {
      if (o.governorshipName) return o.governorshipName === governorship;
      if (o.bacentaName && myBacentas.includes(o.bacentaName)) return true;
      return false;
    });
  }, [outreaches, governorship, myBacentas]);

  // Filtered Outreaches
  const filteredOutreaches = useMemo(() => {
    return govOutreaches.filter((o) => {
      // Bacenta filter
      if (selectedBacenta !== 'all') {
        if (!o.bacentaName || o.bacentaName.toLowerCase() !== selectedBacenta.toLowerCase()) {
          return false;
        }
      }
      // Type filter
      if (typeFilter !== 'all' && o.outreachType !== typeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLocation = o.locationArea?.toLowerCase().includes(q);
        const matchesBacenta = o.bacentaName?.toLowerCase().includes(q);
        const matchesSubmitter = o.submittedBy.name.toLowerCase().includes(q);
        const matchesType = o.outreachType.toLowerCase().includes(q);
        const matchesNotes = o.notes?.toLowerCase().includes(q);
        const matchesConvert = o.converts?.some((c) => c.fullName.toLowerCase().includes(q));
        if (
          !matchesLocation &&
          !matchesBacenta &&
          !matchesSubmitter &&
          !matchesType &&
          !matchesNotes &&
          !matchesConvert
        ) {
          return false;
        }
      }
      return true;
    });
  }, [govOutreaches, selectedBacenta, typeFilter, searchQuery]);

  // Governorship KPIs
  const totalSoulsWon = useMemo(() => {
    return govOutreaches.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0);
  }, [govOutreaches]);

  const totalOperations = govOutreaches.length;

  const totalLeadersPresent = useMemo(() => {
    return govOutreaches.reduce((sum, o) => sum + (o.leadersPresentCount || 0), 0);
  }, [govOutreaches]);

  const totalConvertsInGov = useMemo(() => {
    return govOutreaches.reduce((sum, o) => sum + (o.converts?.length || 0), 0);
  }, [govOutreaches]);

  // Total pictures count scoped solely to this Governor's jurisdiction
  const picturesCount = useMemo(() => {
    return filteredOutreaches.reduce((acc, o) => {
      const photos =
        o.attachments?.filter(
          (a) =>
            a.previewUrl ||
            a.type?.startsWith('image/') ||
            a.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
        ) || [];
      return acc + photos.length;
    }, 0);
  }, [filteredOutreaches]);

  return (
    <div className="space-y-6 pb-20">
      {/* EXPORT CONFIRMATION TOAST */}
      {pdfSuccessMessage && (
        <div className="p-4 rounded-xl bg-blue-950/90 border border-blue-800 text-blue-200 flex items-center justify-between text-xs sm:text-sm animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-blue-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* GOVERNORSHIP BANNER & SECURITY SCOPE */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <AppLogo size="lg" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  Governorship Authorization
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Sole Access to {governorship} ({council})
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>{governorship} Dashboard</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Governorship Pastor: <strong className="text-slate-200">{currentUser.name}</strong> · Council: <strong className="text-slate-200">{council}</strong>. Access is restricted exclusively to <strong>{governorship}</strong> and its subordinate Bacentas. Oversee all evangelism operations, leaders, and soul rosters under your governorship.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddBacentaOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              title={`Add a new Bacenta under ${governorship}`}
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>+ Add Bacenta</span>
            </button>

            {onNavigateToForm && (
              <button
                onClick={onNavigateToForm}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Log Outreach</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-950 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPDF ? 'Generating...' : 'Export Governorship PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher: Operations vs Outreach Pictures */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setDashboardTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            dashboardTab === 'database'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Operations & Bacentas</span>
        </button>

        <button
          onClick={() => setDashboardTab('pictures')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            dashboardTab === 'pictures'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Camera className="w-4 h-4 text-blue-400" />
          <span>Outreach Pictures ({picturesCount})</span>
        </button>
      </div>

      {dashboardTab === 'pictures' ? (
        <OutreachPicturesGallery
          outreaches={filteredOutreaches}
          currentUser={currentUser}
          theme={theme}
          showCouncilFilter={false}
          title={`${governorship} Outreach Pictures`}
          subtitle={`Viewing outreach photos solely from ${governorship} and its subordinate Bacentas`}
        />
      ) : (
        <>

      {/* GOVERNORSHIP OVERVIEW KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Souls in this Governorship */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Souls Won</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalSoulsWon.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Under {governorship}</p>
        </div>

        {/* Operations logged */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Operations Logged</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalOperations}
          </div>
          <p className="text-[11px] text-blue-400 font-medium mt-1">Under this Governorship</p>
        </div>

        {/* Subordinate Bacentas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Subordinate Bacentas</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/80 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {myBacentas.length}
          </div>
          <p className="text-[11px] text-purple-400 font-medium mt-1">Under your pastoral charge</p>
        </div>

        {/* Leaders Mobilized */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mobilized Leaders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalLeadersPresent}
          </div>
          <p className="text-[11px] text-amber-400 font-medium mt-1">Active field evangelists</p>
        </div>
      </div>

      {/* BACENTAS DIRECTORY (Under this Governorship Only) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Bacentas Under {council} ({myBacentas.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any Bacenta to view its isolated records in the database ledger below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedBacenta !== 'all' && (
              <button
                onClick={() => setSelectedBacenta('all')}
                className="text-xs text-blue-400 hover:underline font-semibold"
              >
                View All Bacentas
              </button>
            )}

            <button
              onClick={() => setIsAddBacentaOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bacenta to {council}</span>
            </button>
          </div>
        </div>

        {/* Bacenta Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myBacentas.map((bacenta) => {
            const bacentaEntries = govOutreaches.filter(
              (o: OutreachEntry) => o.bacentaName?.toLowerCase() === bacenta.toLowerCase()
            );
            const souls = bacentaEntries.reduce((sum: number, o: OutreachEntry) => sum + (o.soulsWonCount || 0), 0);
            const leaders = bacentaEntries.reduce((sum: number, o: OutreachEntry) => sum + (o.leadersPresentCount || 0), 0);
            const isSelected = selectedBacenta === bacenta;

            return (
              <div
                key={bacenta}
                onClick={() => {
                  if (onSelectUser) {
                    const bacentaLeader = getLeaderForBacenta(bacenta, governorship, council);
                    onSelectUser(bacentaLeader);
                  } else {
                    setSelectedBacenta(isSelected ? 'all' : bacenta);
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/40'
                }`}
                title={`Click to open ${bacenta} Leader account & dashboard`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block truncate">
                      {council}
                    </span>
                    <h3 className="font-bold text-white text-sm truncate mt-0.5">{bacenta}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                    {souls} Souls
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>{bacentaEntries.length} Operations</span>
                  <span>{leaders} Leaders</span>
                  <span className="text-amber-400 font-bold text-[11px] group-hover:underline">
                    Open Leader Dashboard →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GOVERNORSHIP BACENTA ENTRIES DATABASE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              <span>{council} Bacenta Database & Operations Ledger</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized access to entries from {council} Bacentas only ({filteredOutreaches.length} records found)
            </p>
          </div>

          {/* Quick Clear Filter */}
          {(selectedBacenta !== 'all' || typeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBacenta('all');
                setTypeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-slate-400 hover:text-white font-semibold underline self-start sm:self-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Controls Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${council} entries...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>

          {/* Bacenta Select */}
          <select
            value={selectedBacenta}
            onChange={(e) => setSelectedBacenta(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Bacentas in {council}</option>
            {myBacentas.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Outreach Types</option>
            <option value="Door to Door / 1 v 1">Door to Door / 1 v 1</option>
            <option value="Busstop">Busstop</option>
            <option value="Street Invasion / Stomp the Yard">Street Invasion</option>
            <option value="Crusade">Crusade</option>
            <option value="Dance Outreach">Dance Outreach</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bacenta</th>
                <th className="py-3 px-4">Outreach Type</th>
                <th className="py-3 px-3 text-center">Souls</th>
                <th className="py-3 px-3 text-center">Leaders</th>
                <th className="py-3 px-4">Field Leader</th>
                <th className="py-3 px-4">Approval</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOutreaches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                    <p className="font-semibold text-slate-300">No entries recorded under this criteria in {council}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Log a new outreach operation for your subordinate Bacentas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOutreaches.map((entry) => {
                  const isApproved = entry.approvalStatus === 'approved';

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-900/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEntryForDetails(entry)}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                        {entry.date}
                      </td>

                      {/* Bacenta */}
                      <td className="py-3 px-4 font-bold text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                          {entry.bacentaName || `${council} General`}
                        </span>
                      </td>

                      {/* Outreach Type */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {entry.outreachType}
                      </td>

                      {/* Souls Won */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-extrabold text-emerald-400 text-sm">
                        {entry.soulsWonCount}
                      </td>

                      {/* Leaders */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-semibold text-slate-300">
                        {entry.leadersPresentCount}
                      </td>

                      {/* Submitter */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{entry.submittedBy.name}</div>
                        <div className="text-[10px] text-slate-400">{entry.submittedBy.email}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedEntryForDetails(entry)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View convert personal records & details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* MODAL: ADD BACENTA TO THIS GOVERNORSHIP */}
      {isAddBacentaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Add Bacenta to {council}</h3>
              </div>
              <button
                onClick={() => setIsAddBacentaOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBacenta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assigned Governorship Council
                </label>
                <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-blue-400">
                  {council} Governorship
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Bacenta Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bacenta Goshen (Light)"
                  value={newBacentaName}
                  onChange={(e) => setNewBacentaName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBacentaOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Register Bacenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTRY DETAILS & CONVERT ROSTER */}
      {selectedEntryForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded">
                  {selectedEntryForDetails.councilName} • {selectedEntryForDetails.bacentaName || 'Bacenta'}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedEntryForDetails.outreachType} on {selectedEntryForDetails.date}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntryForDetails(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase">Souls Won</span>
                  <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
                    {selectedEntryForDetails.soulsWonCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase">Leaders Present</span>
                  <span className="text-xl font-extrabold text-white mt-0.5 block">
                    {selectedEntryForDetails.leadersPresentCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1.5 block capitalize">
                    {selectedEntryForDetails.approvalStatus || 'approved'}
                  </span>
                </div>
              </div>

              {/* Submitter */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">Field Submitter</span>
                  <span className="font-bold text-white">{selectedEntryForDetails.submittedBy.name}</span>
                  <span className="text-slate-400 text-[11px] block">{selectedEntryForDetails.submittedBy.email}</span>
                </div>
              </div>

              {/* Location & Notes */}
              {selectedEntryForDetails.locationArea && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Location Area
                  </label>
                  <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                    {selectedEntryForDetails.locationArea}
                  </p>
                </div>
              )}

              {selectedEntryForDetails.notes && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Operation Notes
                  </label>
                  <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed">
                    {selectedEntryForDetails.notes}
                  </p>
                </div>
              )}

              {/* Outreach Pictures & Attachments */}
              {selectedEntryForDetails.attachments && selectedEntryForDetails.attachments.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Outreach Pictures & Evidence ({selectedEntryForDetails.attachments.length})</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedEntryForDetails.attachments.map((file) => {
                      const isImg = file.previewUrl || file.type?.startsWith('image/');
                      return (
                        <div key={file.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 space-y-1">
                          {isImg && file.previewUrl ? (
                            <a href={file.previewUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg group">
                              <img src={file.previewUrl} alt={file.name} className="w-full aspect-video object-cover rounded-lg border border-slate-800 group-hover:scale-105 transition-transform" />
                            </a>
                          ) : (
                            <div className="w-full aspect-video flex items-center justify-center bg-slate-900 rounded-lg text-slate-400 text-xs">
                              {file.name}
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400 truncate block px-0.5">{file.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Converts List */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                  Recorded Converts ({selectedEntryForDetails.converts?.length || 0})
                </label>
                {!selectedEntryForDetails.converts || selectedEntryForDetails.converts.length === 0 ? (
                  <p className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-center italic">
                    No individual convert personal details were captured for this operation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedEntryForDetails.converts.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-white block">{c.fullName}</strong>
                          <span className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                            <span>{c.phone}</span>
                            <span>•</span>
                            <span>{c.decision}</span>
                            <span>•</span>
                            <span className="text-blue-400">{c.bacentaAssigned || selectedEntryForDetails.bacentaName}</span>
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {c.followUpStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedEntryForDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
