import React, { useState, useMemo } from 'react';
import {
  Shield,
  Building2,
  Users,
  TrendingUp,
  Award,
  Search,
  Filter,
  Plus,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronRight,
  ExternalLink,
  Target,
  Layers,
  MapPin,
  Calendar,
  Lock,
  Clock,
  Phone,
  UserCheck,
  X,
} from 'lucide-react';
import {
  OutreachEntry,
  UserProfile,
  OutreachType,
  ConvertRecord,
} from '../types';
import {
  getGovernorshipsForCouncil,
  addGovernorshipToCouncil,
  getBacentasForGovernorship,
  addBacentaToGovernorship,
  getUsers,
  getLeaderForGovernorship,
  getLeaderForBacenta,
} from '../services/storage';
import { exportMinistryReportPDF } from '../services/pdfExport';
import { approveOutreach } from '../services/realtime';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  onOpenReportPrint?: () => void;
  onNavigateToForm?: () => void;
  onSelectUser?: (user: UserProfile) => void;
}

export const CouncilOverseerDashboard: React.FC<Props> = ({
  outreaches,
  currentUser,
  onOpenReportPrint,
  onNavigateToForm,
  onSelectUser,
}) => {
  const council = currentUser.council || 'Ephesians 1';
  const allUsers = getUsers();

  // Governorships strictly under this Council
  const governorships = getGovernorshipsForCouncil(council);

  // Filters restricted strictly to this Council
  const [selectedGovernorship, setSelectedGovernorship] = useState<string>('all');
  const [selectedBacenta, setSelectedBacenta] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals & Forms
  const [isAddGovOpen, setIsAddGovOpen] = useState(false);
  const [newGovName, setNewGovName] = useState('');
  const [isAddBacentaOpen, setIsAddBacentaOpen] = useState(false);
  const [targetGovForBacenta, setTargetGovForBacenta] = useState<string>(governorships[0] || '');
  const [newBacentaName, setNewBacentaName] = useState('');
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<OutreachEntry | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Outreaches strictly in this Council
  const councilOutreaches = useMemo(() => {
    return outreaches.filter((o) => o.councilName === council);
  }, [outreaches, council]);

  // Dynamic Bacentas for filter
  const bacentasForFilter = useMemo(() => {
    if (selectedGovernorship === 'all') {
      const set = new Set<string>();
      governorships.forEach((gov) => {
        getBacentasForGovernorship(gov).forEach((b) => set.add(b));
      });
      return Array.from(set);
    }
    return getBacentasForGovernorship(selectedGovernorship);
  }, [selectedGovernorship, governorships]);

  // Filtered Outreaches
  const filteredOutreaches = useMemo(() => {
    return councilOutreaches.filter((o) => {
      // Governorship filter
      if (selectedGovernorship !== 'all') {
        if (o.governorshipName && o.governorshipName !== selectedGovernorship) {
          return false;
        }
        if (!o.governorshipName && o.bacentaName) {
          const bacentasOfGov = getBacentasForGovernorship(selectedGovernorship);
          if (!bacentasOfGov.includes(o.bacentaName)) return false;
        }
      }
      // Bacenta filter
      if (selectedBacenta !== 'all') {
        if (!o.bacentaName || o.bacentaName.toLowerCase() !== selectedBacenta.toLowerCase()) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all') {
        const itemStatus = o.approvalStatus || 'approved';
        if (itemStatus !== statusFilter) return false;
      }
      // Type filter
      if (typeFilter !== 'all' && o.outreachType !== typeFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLocation = o.locationArea?.toLowerCase().includes(q);
        const matchesBacenta = o.bacentaName?.toLowerCase().includes(q);
        const matchesGov = o.governorshipName?.toLowerCase().includes(q);
        const matchesSubmitter = o.submittedBy.name.toLowerCase().includes(q);
        const matchesType = o.outreachType.toLowerCase().includes(q);
        const matchesNotes = o.notes?.toLowerCase().includes(q);
        const matchesConvert = o.converts?.some((c) => c.fullName.toLowerCase().includes(q));
        if (
          !matchesLocation &&
          !matchesBacenta &&
          !matchesGov &&
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
  }, [councilOutreaches, selectedGovernorship, selectedBacenta, statusFilter, typeFilter, searchQuery]);

  // KPIs for this Council
  const totalSoulsWon = useMemo(
    () => councilOutreaches.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0),
    [councilOutreaches]
  );
  const totalOperations = councilOutreaches.length;
  const totalLeadersPresent = useMemo(
    () => councilOutreaches.reduce((sum, o) => sum + (o.leadersPresentCount || 0), 0),
    [councilOutreaches]
  );
  const totalConverts = useMemo(
    () => councilOutreaches.reduce((sum, o) => sum + (o.converts?.length || 0), 0),
    [councilOutreaches]
  );
  const pendingApprovalsCount = useMemo(
    () => councilOutreaches.filter((o) => o.approvalStatus === 'pending').length,
    [councilOutreaches]
  );

  // Total Bacentas under this Council
  const totalBacentasCount = useMemo(() => {
    let count = 0;
    governorships.forEach((gov) => {
      count += getBacentasForGovernorship(gov).length;
    });
    return count;
  }, [governorships]);

  // Governorship summaries
  const governorshipSummaries = useMemo(() => {
    return governorships.map((gov) => {
      const bacentas = getBacentasForGovernorship(gov);
      const govEntries = councilOutreaches.filter(
        (o) => o.governorshipName === gov || (o.bacentaName && bacentas.includes(o.bacentaName))
      );
      const souls = govEntries.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0);
      const governor = allUsers.find(
        (u) => u.role === 'governor' && (u.governorship === gov || u.council === council)
      );

      return {
        governorship: gov,
        governorName: governor ? governor.name : 'Unassigned Governor',
        governorEmail: governor?.email,
        governorPhone: governor?.phone,
        bacentas,
        bacentasCount: bacentas.length,
        soulsWon: souls,
        operationsCount: govEntries.length,
      };
    });
  }, [governorships, councilOutreaches, allUsers, council]);

  // Add Governorship
  const handleCreateGovernorship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGovName.trim()) return;
    addGovernorshipToCouncil(council, newGovName.trim());
    setNewGovName('');
    setIsAddGovOpen(false);
  };

  // Add Bacenta under Governorship
  const handleCreateBacenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBacentaName.trim() || !targetGovForBacenta) return;
    addBacentaToGovernorship(targetGovForBacenta, newBacentaName.trim());
    setNewBacentaName('');
    setIsAddBacentaOpen(false);
  };

  // Approve Outreach
  const handleApprove = async (outreachId: string) => {
    try {
      setApprovingId(outreachId);
      await approveOutreach(outreachId, currentUser);
    } finally {
      setApprovingId(null);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      exportMinistryReportPDF({
        currentUser,
        outreaches: councilOutreaches,
        councilFilter: council,
      });
      setPdfSuccessMessage(`${council} Council Overseer Report successfully exported.`);
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

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

      {/* COUNCIL OVERSEER HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Council Overseer Authority
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Sole Access to {council} Council
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>{council} Council Overseer Dashboard</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Council Overseer Pastor: <strong className="text-slate-200">{currentUser.name}</strong>. Sole supervisory authority over <strong>{council}</strong>. Access is restricted exclusively to this council, its subordinate Governorships, and all associated Bacentas.
            </p>
          </div>

          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddGovOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              title={`Add a new Governorship under ${council}`}
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>+ Add Governorship</span>
            </button>

            <button
              onClick={() => {
                if (governorships.length > 0) {
                  setTargetGovForBacenta(governorships[0]);
                }
                setIsAddBacentaOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              title={`Add a new Bacenta under a Governorship in ${council}`}
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add Bacenta</span>
            </button>

            {onNavigateToForm && (
              <button
                onClick={onNavigateToForm}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              >
                <span>Log Outreach</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-950 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPDF ? 'Generating...' : `Export ${council} PDF`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Souls Won */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{council} Souls Won</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalSoulsWon.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Across all {council} Bacentas</p>
        </div>

        {/* Operations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Field Operations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalOperations}
          </div>
          <p className="text-[11px] text-blue-400 font-medium mt-1">Logged in {council}</p>
        </div>

        {/* Governorships */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Governorships</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {governorships.length}
          </div>
          <p className="text-[11px] text-indigo-400 font-medium mt-1">Under {council} Council</p>
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
            {totalBacentasCount}
          </div>
          <p className="text-[11px] text-purple-400 font-medium mt-1">Under {council} Governorships</p>
        </div>

        {/* Converts in CRM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Converts Roster</span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalConverts}
          </div>
          <p className="text-[11px] text-rose-400 font-medium mt-1">With contact cards</p>
        </div>
      </div>

      {/* PENDING APPROVALS ALERT */}
      {pendingApprovalsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-900/60 border border-amber-700 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {pendingApprovalsCount} Field Report(s) Awaiting Your Council Approval
              </h4>
              <p className="text-[11px] text-slate-400">
                Review and approve outreach entries submitted by Bacenta leaders under {council}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shrink-0 transition-colors"
          >
            View Pending
          </button>
        </div>
      )}

      {/* GOVERNORSHIPS DIRECTORY UNDER THIS COUNCIL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Governorships Under {council}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Each Governorship is led by a Governor Pastor who oversees all subordinate Bacentas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {governorshipSummaries.map((summary) => (
            <div
              key={summary.governorship}
              onClick={() => {
                if (onSelectUser) {
                  const governorLeader = getLeaderForGovernorship(summary.governorship, council);
                  onSelectUser(governorLeader);
                } else {
                  setSelectedGovernorship(summary.governorship);
                  setSelectedBacenta('all');
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/70 transition-all shadow-sm flex flex-col justify-between cursor-pointer group"
              title={`Click to open ${summary.governorship} Governor account & dashboard`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                      Governorship
                    </span>
                    <h4 className="text-base font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                      {summary.governorship}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Governor: <strong className="text-slate-200">{summary.governorName}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-extrabold text-emerald-400 block">
                      {summary.soulsWon}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Souls Won</span>
                  </div>
                </div>

                {/* Subordinate Bacentas */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Subordinate Bacentas ({summary.bacentasCount}):</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetGovForBacenta(summary.governorship);
                        setIsAddBacentaOpen(true);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      + Add Bacenta
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {summary.bacentas.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectUser) {
                            const bacentaLeader = getLeaderForBacenta(b, summary.governorship, council);
                            onSelectUser(bacentaLeader);
                          } else {
                            setSelectedGovernorship(summary.governorship);
                            setSelectedBacenta(b);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                          selectedBacenta === b
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500 hover:text-amber-300'
                        }`}
                        title={`Click to open ${b} Leader account & dashboard`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">{summary.operationsCount} operations logged</span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 group-hover:underline">
                  <span>Open Governor Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MASTER DATABASE TABLE OF ENTRIES IN THIS COUNCIL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{council} Bacenta Master Database</span>
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredOutreaches.length} of {councilOutreaches.length} logged field operations under {council}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bacenta, convert, leader..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          {/* Governorship Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Governorship:</span>
            <select
              value={selectedGovernorship}
              onChange={(e) => {
                setSelectedGovernorship(e.target.value);
                setSelectedBacenta('all');
              }}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Governorships in {council}</option>
              {governorships.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Bacenta Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Bacenta:</span>
            <select
              value={selectedBacenta}
              onChange={(e) => setSelectedBacenta(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Bacentas</option>
              {bacentasForFilter.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>

          {(selectedGovernorship !== 'all' || selectedBacenta !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedGovernorship('all');
                setSelectedBacenta('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-slate-400 hover:text-white underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Governorship & Bacenta</th>
                <th className="py-3 px-4">Outreach Type</th>
                <th className="py-3 px-4 text-center">Souls</th>
                <th className="py-3 px-4 text-center">Leaders</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Approval</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {filteredOutreaches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No field operations match your filter criteria in {council}.
                  </td>
                </tr>
              ) : (
                filteredOutreaches.map((entry) => {
                  const isApproved = entry.approvalStatus === 'approved';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{entry.bacentaName || 'General Council'}</div>
                        <div className="text-[11px] text-slate-400">{entry.governorshipName || council}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{entry.outreachType}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-emerald-400 text-sm">
                          {entry.soulsWonCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {entry.leadersPresentCount}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="text-white font-semibold">{entry.submittedBy.name}</div>
                        <div className="text-[10px] text-slate-400">{entry.submittedBy.role}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{entry.approvalStatus || 'approved'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {!isApproved && (
                          <button
                            onClick={() => handleApprove(entry.id)}
                            disabled={approvingId === entry.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {approvingId === entry.id ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedEntryForDetails(entry)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors"
                        >
                          View Details
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

      {/* MODAL: ADD GOVERNORSHIP */}
      {isAddGovOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Add Governorship to {council}</span>
              </h3>
              <button
                onClick={() => setIsAddGovOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGovernorship} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Parent Council
                </label>
                <input
                  type="text"
                  disabled
                  value={council}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Governorship Name *
                </label>
                <input
                  type="text"
                  required
                  value={newGovName}
                  onChange={(e) => setNewGovName(e.target.value)}
                  placeholder="e.g. Governorship Bethesda (Grace)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddGovOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Create Governorship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BACENTA */}
      {isAddBacentaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Bacenta in {council}</span>
              </h3>
              <button
                onClick={() => setIsAddBacentaOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBacenta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Parent Governorship *
                </label>
                <select
                  value={targetGovForBacenta}
                  onChange={(e) => setTargetGovForBacenta(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                >
                  {governorships.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bacenta Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBacentaName}
                  onChange={(e) => setNewBacentaName(e.target.value)}
                  placeholder="e.g. Bacenta Living Waters"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBacentaOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Create Bacenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTRY DETAILS */}
      {selectedEntryForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {selectedEntryForDetails.councilName}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedEntryForDetails.bacentaName || 'Bacenta Entry'} Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntryForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Date</span>
                <span className="font-bold text-white">{selectedEntryForDetails.date}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Souls Won</span>
                <span className="font-bold text-emerald-400 text-base">
                  {selectedEntryForDetails.soulsWonCount}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Leaders</span>
                <span className="font-bold text-white">
                  {selectedEntryForDetails.leadersPresentCount}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Type</span>
                <span className="font-semibold text-slate-300 truncate block">
                  {selectedEntryForDetails.outreachType}
                </span>
              </div>
            </div>

            {selectedEntryForDetails.notes && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Field Notes & Observations
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedEntryForDetails.notes}</p>
              </div>
            )}

            {/* Converts Roster in Entry */}
            {selectedEntryForDetails.converts && selectedEntryForDetails.converts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  Registered Converts ({selectedEntryForDetails.converts.length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedEntryForDetails.converts.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white block">{c.fullName}</span>
                        <span className="text-[11px] text-slate-400">{c.phone} · {c.decision}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        {c.followUpStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEntryForDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
