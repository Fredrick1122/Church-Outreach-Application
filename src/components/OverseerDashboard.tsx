import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  UserCheck,
  UserPlus,
  X,
  Phone,
  Clock,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import {
  OutreachEntry,
  UserProfile,
  OutreachLevel,
  OutreachType,
  ConvertRecord,
  FieldObjective,
  isCouncilOverseer,
  isGeneralOverseer,
} from '../types';
import {
  getAllBacentasByCouncil,
  getBacentasForCouncil,
  addBacentaToCouncil,
  getCouncils,
  getUsers,
  getGovernorshipsForCouncil,
  getAllGovernorshipsByCouncil,
  getAllBacentasByGovernorship,
  getBacentasForGovernorship,
  addBacentaToGovernorship,
} from '../services/storage';
import { exportMinistryReportPDF } from '../services/pdfExport';
import { approveOutreach, subscribeToObjectives, getFieldObjectives } from '../services/realtime';
import { CreateObjectiveModal } from './CreateObjectiveModal';
import { OutreachPicturesGallery } from './OutreachPicturesGallery';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  onOpenReportPrint?: () => void;
  onOpenRegisterModal?: () => void;
  onNavigateToForm?: () => void;
  theme?: 'dark' | 'light';
}

export const OverseerDashboard: React.FC<Props> = ({
  outreaches,
  currentUser,
  onOpenReportPrint,
  onOpenRegisterModal,
  onNavigateToForm,
  theme = 'dark',
}) => {
  const councils = getCouncils();
  const allUsers = getUsers();
  const allBacentasMap = getAllBacentasByCouncil();
  const bacentasByGovMap = getAllBacentasByGovernorship();

  const isCouncilSpecific = isCouncilOverseer(currentUser.role);
  const assignedCouncil = currentUser.council && !currentUser.council.includes('All') ? currentUser.council : 'Ephesians 1';

  // Filters
  const [selectedCouncil, setSelectedCouncil] = useState<string>(isCouncilSpecific ? assignedCouncil : 'all');
  const [selectedGovernorship, setSelectedGovernorship] = useState<string>('all');
  const [selectedBacenta, setSelectedBacenta] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const effectiveCouncil = isCouncilSpecific ? assignedCouncil : selectedCouncil;

  // Modals & States
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isAddBacentaOpen, setIsAddBacentaOpen] = useState(false);
  const [newBacentaCouncil, setNewBacentaCouncil] = useState<string>(isCouncilSpecific ? assignedCouncil : (councils[0] || 'Ephesians 1'));
  const [newBacentaGovernorship, setNewBacentaGovernorship] = useState<string>('');
  const [newBacentaName, setNewBacentaName] = useState<string>('');
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<OutreachEntry | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Real-time objectives
  const [objectives, setObjectives] = useState<FieldObjective[]>(getFieldObjectives);
  useEffect(() => {
    return subscribeToObjectives((updated) => setObjectives(updated));
  }, []);

  // Quick Approve Handler
  const handleApprove = async (outreachId: string) => {
    try {
      setApprovingId(outreachId);
      await approveOutreach(outreachId, currentUser);
    } finally {
      setApprovingId(null);
    }
  };

  // Add Bacenta Handler
  const handleCreateBacenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBacentaName.trim()) return;
    const targetCouncil = isCouncilSpecific ? assignedCouncil : newBacentaCouncil;
    addBacentaToCouncil(targetCouncil, newBacentaName.trim());
    if (newBacentaGovernorship) {
      addBacentaToGovernorship(newBacentaGovernorship, newBacentaName.trim());
    }
    setNewBacentaName('');
    setIsAddBacentaOpen(false);
  };

  // Scoped Outreaches for metrics
  const scopeOutreaches = useMemo(() => {
    if (isCouncilSpecific) {
      return outreaches.filter((o) => o.councilName === assignedCouncil);
    }
    return outreaches;
  }, [outreaches, isCouncilSpecific, assignedCouncil]);

  // Export Analytics PDF
  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      exportMinistryReportPDF({
        currentUser,
        outreaches: scopeOutreaches,
        councilFilter: isCouncilSpecific ? assignedCouncil : selectedCouncil,
      });
      setPdfSuccessMessage(
        `${isCouncilSpecific ? assignedCouncil : 'Apostolic Overseer'} Analytics PDF successfully compiled and downloaded.`
      );
      setTimeout(() => setPdfSuccessMessage(null), 6000);
    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Filtered Outreaches
  const filteredOutreaches = useMemo(() => {
    return outreaches.filter((o) => {
      // Council filter
      if (effectiveCouncil !== 'all' && o.councilName !== effectiveCouncil) {
        return false;
      }
      // Governorship filter
      if (selectedGovernorship !== 'all') {
        if (o.governorshipName && o.governorshipName !== selectedGovernorship) return false;
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
        const matchesCouncil = o.councilName.toLowerCase().includes(q);
        const matchesGov = o.governorshipName?.toLowerCase().includes(q);
        const matchesSubmitter = o.submittedBy.name.toLowerCase().includes(q);
        const matchesType = o.outreachType.toLowerCase().includes(q);
        const matchesNotes = o.notes?.toLowerCase().includes(q);
        const matchesConvert = o.converts?.some((c) => c.fullName.toLowerCase().includes(q));
        if (
          !matchesLocation &&
          !matchesBacenta &&
          !matchesCouncil &&
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
  }, [outreaches, effectiveCouncil, selectedGovernorship, selectedBacenta, statusFilter, typeFilter, searchQuery]);

  // View state: database vs outreach pictures
  const [dashboardTab, setDashboardTab] = useState<'database' | 'pictures'>('database');

  // Total pictures count scoped solely to this overseer's council
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

  // Overall Statistics scoped to Council Overseer or General Overseer
  const totalSoulsWon = useMemo(() => scopeOutreaches.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0), [scopeOutreaches]);
  const totalOperations = scopeOutreaches.length;
  const totalLeadersPresent = useMemo(() => scopeOutreaches.reduce((sum, o) => sum + (o.leadersPresentCount || 0), 0), [scopeOutreaches]);
  const totalConverts = useMemo(() => scopeOutreaches.reduce((sum, o) => sum + (o.converts?.length || 0), 0), [scopeOutreaches]);
  const pendingApprovalsCount = useMemo(() => scopeOutreaches.filter((o) => o.approvalStatus === 'pending').length, [scopeOutreaches]);

  // Total Bacentas Count scoped
  const totalBacentasCount = useMemo(() => {
    if (isCouncilSpecific) {
      return (allBacentasMap[assignedCouncil] || []).length;
    }
    return Object.values(allBacentasMap).reduce((sum, list) => sum + list.length, 0);
  }, [allBacentasMap, isCouncilSpecific, assignedCouncil]);

  // Council Summary Data for all 5 Councils (Ephesians 1 to 5)
  const councilSummaries = useMemo(() => {
    return councils.map((council) => {
      const councilOutreaches = outreaches.filter((o) => o.councilName === council);
      const souls = councilOutreaches.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0);
      const bacentas = allBacentasMap[council] || [];
      const overseer = allUsers.find(
        (u) => (u.role === 'council_overseer' || u.role === 'overseer') && u.council === council
      );
      const govs = getGovernorshipsForCouncil(council);
      return {
        council,
        overseerName: overseer ? overseer.name : 'Council Overseer Pastor',
        overseerEmail: overseer?.email,
        governorshipsCount: govs.length,
        governorships: govs,
        bacentasCount: bacentas.length,
        bacentas,
        soulsWon: souls,
        operationsCount: councilOutreaches.length,
      };
    });
  }, [councils, outreaches, allBacentasMap, allUsers]);

  // Dynamic Bacentas for current selection
  const bacentasForFilter = useMemo(() => {
    if (effectiveCouncil === 'all') {
      const set = new Set<string>();
      Object.values(allBacentasMap).forEach((list) => list.forEach((b) => set.add(b)));
      return Array.from(set);
    }
    return allBacentasMap[effectiveCouncil] || [];
  }, [effectiveCouncil, allBacentasMap]);

  // Dynamic Governorships for current selection
  const governorshipsForFilter = useMemo(() => {
    if (effectiveCouncil === 'all') {
      const allGovsMap = getAllGovernorshipsByCouncil();
      const set = new Set<string>();
      Object.values(allGovsMap).forEach((list) => list.forEach((g) => set.add(g)));
      return Array.from(set);
    }
    return getGovernorshipsForCouncil(effectiveCouncil);
  }, [effectiveCouncil]);

  // Displayed Governorships with details and subordinate Bacentas
  const displayedGovernorships = useMemo(() => {
    const list = effectiveCouncil === 'all'
      ? councils.flatMap((c) => getGovernorshipsForCouncil(c).map((g) => ({ council: c, governorship: g })))
      : getGovernorshipsForCouncil(effectiveCouncil).map((g) => ({ council: effectiveCouncil, governorship: g }));

    return list.map(({ council: c, governorship: g }) => {
      const govOutreaches = outreaches.filter(
        (o) => o.governorshipName === g || (o.councilName === c && !o.governorshipName)
      );
      const govSouls = govOutreaches.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0);
      const govBacentas = bacentasByGovMap[g] || [];
      const govUser = allUsers.find(
        (u) => u.role === 'governor' && (u.governorship === g || u.council === c)
      );

      return {
        council: c,
        governorship: g,
        governorName: govUser ? govUser.name : 'Governorship Pastor',
        governorPhone: govUser?.phone,
        bacentas: govBacentas,
        bacentasCount: govBacentas.length,
        soulsWon: govSouls,
        operationsCount: govOutreaches.length,
      };
    });
  }, [effectiveCouncil, councils, outreaches, allUsers, bacentasByGovMap]);

  return (
    <div className="space-y-6 pb-20">
      {/* EXPORT CONFIRMATION TOAST */}
      {pdfSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-200 flex items-center justify-between text-xs sm:text-sm animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* JURISDICTION HEADER */}
      <div className={`bg-gradient-to-r ${
        isCouncilSpecific
          ? 'from-slate-900 via-slate-900 to-indigo-950/50'
          : 'from-slate-900 via-slate-900 to-emerald-950/40'
      } rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-xl`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isCouncilSpecific
                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              } flex items-center gap-1.5`}>
                <Shield className="w-3 h-3" />
                {isCouncilSpecific ? 'Council Overseer Jurisdiction' : 'General Overseer Jurisdiction'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {isCouncilSpecific ? `${assignedCouncil} Solely` : 'All 5 Councils (Ephesians 1 to 5)'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>{isCouncilSpecific ? `${assignedCouncil} Council Overseer Dashboard` : 'General Overseer Ministry Command'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {isCouncilSpecific ? (
                <>
                  Council Overseer: <strong className="text-slate-200">{currentUser.name}</strong>. Sole oversight for <strong className="text-indigo-300">{assignedCouncil}</strong>, its Governorships, and every subordinate Bacenta under them. Viewing all field entries and database for {assignedCouncil} solely.
                </>
              ) : (
                <>
                  General Overseer: <strong className="text-slate-200">{currentUser.name}</strong>. Comprehensive oversight spanning all Apostolic Councils, their Overseer Pastors, Governorships, and every subordinate Bacenta. Access to view all entries and database across board.
                </>
              )}
            </p>
          </div>

          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isGeneralOverseer(currentUser.role) && onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
                title="Register new Overseer or Governorship Pastor (General Overseer Authority)"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>+ Register User</span>
              </button>
            )}

            <button
              onClick={() => setIsAddBacentaOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              title="Add a new Bacenta under any Governorship"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>+ Add Bacenta</span>
            </button>

            <button
              onClick={() => setIsObjectiveModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              title="Broadcast a field objective to councils & bacentas"
            >
              <Target className="w-4 h-4 text-amber-400" />
              <span>Set Directive</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPDF ? 'Generating...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher: Council Database vs Outreach Pictures */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setDashboardTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            dashboardTab === 'database'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Council Database & Metrics</span>
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
          outreaches={filteredOutreaches}
          currentUser={currentUser}
          theme={theme}
          showCouncilFilter={false}
          title={`${effectiveCouncil} Outreach Pictures Vault`}
          subtitle={`Viewing photos solely from ${effectiveCouncil} field operations`}
        />
      ) : (
        <>

      {/* EXECUTIVE KPI BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Souls Won */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Souls Won</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalSoulsWon.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">
            {isCouncilSpecific ? `Within ${assignedCouncil} solely` : 'Across all 5 Councils'}
          </p>
        </div>

        {/* Operations Logged */}
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
          <p className="text-[11px] text-blue-400 font-medium mt-1">Logged by field leaders</p>
        </div>

        {/* Total Bacentas */}
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
          <p className="text-[11px] text-purple-400 font-medium mt-1">
            {isCouncilSpecific ? `Under ${assignedCouncil}` : 'Under 5 Councils'}
          </p>
        </div>

        {/* Mobilized Leaders */}
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

        {/* Approval Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {pendingApprovalsCount}
          </div>
          <p className="text-[11px] text-rose-400 font-medium mt-1">
            {pendingApprovalsCount > 0 ? 'Awaiting overseer sign-off' : 'All records approved'}
          </p>
        </div>
      </div>

      {/* COUNCILS OVERVIEW (Ephesians 1 to 5) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className={`w-5 h-5 ${isCouncilSpecific ? 'text-indigo-400' : 'text-emerald-400'}`} />
              <span>
                {isCouncilSpecific
                  ? `Assigned Council: ${assignedCouncil}`
                  : 'Apostolic Councils (Ephesians 1 to 5)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCouncilSpecific
                ? `Council Overseer: ${currentUser.name}. Access solely to ${assignedCouncil} Governorships and subordinate Bacentas.`
                : 'Select any Council to inspect its Overseer Pastor, Governorships, and subordinate Bacentas.'}
            </p>
          </div>

          {!isCouncilSpecific && selectedCouncil !== 'all' && (
            <button
              onClick={() => {
                setSelectedCouncil('all');
                setSelectedGovernorship('all');
                setSelectedBacenta('all');
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Reset to All Councils
            </button>
          )}

          {isCouncilSpecific && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
              Sole Council Access
            </span>
          )}
        </div>

        {/* For Council Overseer: Dedicated card for their council solely */}
        {isCouncilSpecific ? (
          <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {assignedCouncil}
                </span>
                <p className="text-sm font-semibold text-slate-200 mt-1">
                  Overseer: {currentUser.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Jurisdiction restricted to {assignedCouncil} Governorships and subordinate Bacentas only.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Governorships</span>
                  <span className="font-bold text-indigo-400 text-sm">{getGovernorshipsForCouncil(assignedCouncil).length}</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Bacentas</span>
                  <span className="font-bold text-purple-400 text-sm">{(allBacentasMap[assignedCouncil] || []).length}</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Souls Won</span>
                  <span className="font-bold text-emerald-400 text-sm">{totalSoulsWon}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* For General Overseer: 5 columns for the 5 councils (Ephesians 1 to 5) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {councilSummaries.map((c) => {
              const isSelected = selectedCouncil === c.council;
              return (
                <div
                  key={c.council}
                  onClick={() => {
                    setSelectedCouncil(isSelected ? 'all' : c.council);
                    setSelectedGovernorship('all');
                    setSelectedBacenta('all');
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        {c.council}
                      </span>
                      <p className="text-[11px] text-slate-300 mt-1 font-medium truncate max-w-[110px]" title={c.overseerName}>
                        {c.overseerName}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {c.bacentasCount} Bacentas
                    </span>
                  </div>

                  {/* Governorships count */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-indigo-400 font-semibold">
                    {c.governorshipsCount} Governorships
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>Souls: <strong className="text-emerald-400">{c.soulsWon}</strong></span>
                    <span>Ops: <strong className="text-slate-200">{c.operationsCount}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GOVERNORSHIPS UNDER COUNCILS MATRIX */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>
                Governorships Hierarchy{' '}
                {effectiveCouncil !== 'all' ? `(${effectiveCouncil})` : '(Under All 5 Councils)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each Council contains Governorships led by Governor Pastors, and under each Governorship are its Bacentas.
            </p>
          </div>

          {selectedGovernorship !== 'all' && (
            <button
              onClick={() => {
                setSelectedGovernorship('all');
                setSelectedBacenta('all');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold self-start sm:self-auto"
            >
              Reset Governorship Filter
            </button>
          )}
        </div>

        {/* Governorship cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedGovernorships.map((gov) => {
            const isGovSelected = selectedGovernorship === gov.governorship;
            return (
              <div
                key={gov.governorship}
                onClick={() => {
                  setSelectedGovernorship(isGovSelected ? 'all' : gov.governorship);
                  setSelectedBacenta('all');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isGovSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                      {gov.council}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-0.5">{gov.governorship}</h3>
                    <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Pastor: <strong>{gov.governorName}</strong></span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                    {gov.soulsWon} Souls
                  </span>
                </div>

                {/* Subordinate Bacentas */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-300">
                      Subordinate Bacentas ({gov.bacentasCount}):
                    </span>
                    <span className="text-indigo-400 font-semibold text-[10px]">
                      {isGovSelected ? 'Active Filter' : 'Filter Ledger →'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {gov.bacentas.map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BACENTA BREAKDOWN MATRIX */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>
                Bacenta Matrix{' '}
                {selectedCouncil !== 'all' ? `(${selectedCouncil} Only)` : '(All Governorships)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live soul counts and operations per Bacenta under the governorships.
            </p>
          </div>

          <button
            onClick={() => setIsAddBacentaOpen(true)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Bacenta</span>
          </button>
        </div>

        {/* Bacenta Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bacentasForFilter.map((bacenta) => {
            const bacentaEntries = outreaches.filter(
              (o) => o.bacentaName?.toLowerCase() === bacenta.toLowerCase()
            );
            const souls = bacentaEntries.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0);
            const leaders = bacentaEntries.reduce((sum, o) => sum + (o.leadersPresentCount || 0), 0);
            const isSelected = selectedBacenta === bacenta;

            // Find which council this bacenta belongs to
            const parentCouncil =
              Object.entries(allBacentasMap).find(([_, list]) => list.includes(bacenta))?.[0] ||
              selectedCouncil;

            return (
              <div
                key={bacenta}
                onClick={() => setSelectedBacenta(isSelected ? 'all' : bacenta)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                      {parentCouncil}
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
                  <span className="text-purple-400 font-semibold text-[11px] hover:underline">
                    {isSelected ? 'Filter Active' : 'Filter Ledger →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MASTER BACENTA DATABASE & ENTRIES EXPLORER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <span>Bacenta Entries Master Ledger</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete database of field entries for each Bacenta under the Governorships ({filteredOutreaches.length} records found)
            </p>
          </div>

          {/* Quick Clear Filter */}
          {(selectedCouncil !== (isCouncilSpecific ? assignedCouncil : 'all') || selectedGovernorship !== 'all' || selectedBacenta !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                if (!isCouncilSpecific) setSelectedCouncil('all');
                setSelectedGovernorship('all');
                setSelectedBacenta('all');
                setStatusFilter('all');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leader, convert, bacenta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Council Select */}
          {isCouncilSpecific ? (
            <div className="w-full px-3 py-2 bg-slate-950/80 border border-indigo-900/60 rounded-xl text-xs font-semibold text-indigo-300 flex items-center justify-between">
              <span>{assignedCouncil}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Sole Access</span>
            </div>
          ) : (
            <select
              value={selectedCouncil}
              onChange={(e) => {
                setSelectedCouncil(e.target.value);
                setSelectedGovernorship('all');
                setSelectedBacenta('all');
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All 5 Councils</option>
              {councils.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Governorship Select */}
          <select
            value={selectedGovernorship}
            onChange={(e) => {
              setSelectedGovernorship(e.target.value);
              setSelectedBacenta('all');
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Governorships</option>
            {governorshipsForFilter.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Bacenta Select */}
          <select
            value={selectedBacenta}
            onChange={(e) => setSelectedBacenta(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Bacentas</option>
            {bacentasForFilter.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Council</th>
                <th className="py-3 px-4">Governorship & Bacenta</th>
                <th className="py-3 px-4">Outreach Type</th>
                <th className="py-3 px-3 text-center">Souls</th>
                <th className="py-3 px-3 text-center">Leaders</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOutreaches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                    <p className="font-semibold text-slate-300">No Bacenta entries match the selected filters</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Try resetting your search query or selecting another Governorship.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOutreaches.map((entry) => {
                  const isApproved = entry.approvalStatus === 'approved';
                  const isPending = entry.approvalStatus === 'pending';
                  const isApproving = approvingId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedEntryForDetails(entry)}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                        {entry.date}
                      </td>

                      {/* Council */}
                      <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{entry.councilName}</span>
                        </span>
                      </td>

                      {/* Governorship & Bacenta */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{entry.bacentaName || 'General Council'}</div>
                        {entry.governorshipName && (
                          <div className="text-[10px] text-indigo-400 font-medium">{entry.governorshipName}</div>
                        )}
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
                        <div className="text-[10px] text-slate-400 capitalize">{entry.submittedBy.role}</div>
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

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleApprove(entry.id)}
                              disabled={isApproving}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors"
                            >
                              {isApproving ? '...' : 'Approve'}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedEntryForDetails(entry)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Inspect details and convert records"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* MODAL: ADD BACENTA UNDER GOVERNORSHIP */}
      {isAddBacentaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Add New Bacenta</h3>
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
                  Parent Council (Ephesians 1 to 5) *
                </label>
                {isCouncilSpecific ? (
                  <div className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-indigo-900/60 rounded-xl text-xs font-semibold text-indigo-300 flex items-center justify-between">
                    <span>{assignedCouncil}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Assigned Council</span>
                  </div>
                ) : (
                  <select
                    value={newBacentaCouncil}
                    onChange={(e) => {
                      setNewBacentaCouncil(e.target.value);
                      const govs = getGovernorshipsForCouncil(e.target.value);
                      setNewBacentaGovernorship(govs[0] || '');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {councils.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Parent Governorship (Optional)
                </label>
                <select
                  value={newBacentaGovernorship}
                  onChange={(e) => setNewBacentaGovernorship(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Select Governorship...</option>
                  {getGovernorshipsForCouncil(isCouncilSpecific ? assignedCouncil : newBacentaCouncil).map((g) => (
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
                  placeholder="e.g. Bacenta Bethesda (Mercy)"
                  value={newBacentaName}
                  onChange={(e) => setNewBacentaName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Create Bacenta
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  {selectedEntryForDetails.councilName} • {selectedEntryForDetails.bacentaName || 'Bacenta Operation'}
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
              {/* Summary Metrics */}
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
                  <span className="text-slate-400 block text-[10px] uppercase">Approval Status</span>
                  <span className={`text-xs font-bold mt-1.5 block capitalize ${
                    selectedEntryForDetails.approvalStatus === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {selectedEntryForDetails.approvalStatus || 'approved'}
                  </span>
                </div>
              </div>

              {/* Submitter Info */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">Submitted By</span>
                  <span className="font-bold text-white">{selectedEntryForDetails.submittedBy.name}</span>
                  <span className="text-slate-400 text-[11px] block">{selectedEntryForDetails.submittedBy.email}</span>
                </div>
                {selectedEntryForDetails.approvedBy && (
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Approved By</span>
                    <span className="font-bold text-emerald-400">{selectedEntryForDetails.approvedBy.name}</span>
                    <span className="text-slate-500 text-[10px] block font-mono">
                      {new Date(selectedEntryForDetails.approvedBy.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
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
                    Operation Field Notes
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
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
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
                  Recorded Converts Roster ({selectedEntryForDetails.converts?.length || 0})
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
                            <span className="text-emerald-400">{c.bacentaAssigned || selectedEntryForDetails.bacentaName}</span>
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

      {/* CREATE OBJECTIVE MODAL */}
      <CreateObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={() => setIsObjectiveModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
