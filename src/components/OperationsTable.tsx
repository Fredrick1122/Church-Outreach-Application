import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  UserCheck,
  Sparkles,
  MapPin,
  Shield,
  Eye,
} from 'lucide-react';
import {
  OutreachEntry,
  UserProfile,
  OutreachLevel,
  OutreachType,
  isGeneralOverseer,
  isCouncilOverseer,
  isGovernor,
} from '../types';
import { deleteOutreach, exportOutreachesToCSV, getCouncils } from '../services/storage';
import { approveOutreach } from '../services/realtime';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  onOpenReportPrint: () => void;
  onSelectEntryDetail?: (entry: OutreachEntry) => void;
}

export const OperationsTable: React.FC<Props> = ({
  outreaches,
  currentUser,
  onOpenReportPrint,
}) => {
  const isGen = isGeneralOverseer(currentUser.role);
  const isCouncil = isCouncilOverseer(currentUser.role);
  const isGov = isGovernor(currentUser.role);
  const userCouncil = currentUser.council && !currentUser.council.includes('All') ? currentUser.council : 'Ephesians 1';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCouncil, setSelectedCouncil] = useState<string>(isCouncil ? userCouncil : 'all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const effectiveCouncil = isCouncil ? userCouncil : selectedCouncil;

  const handleApprove = async (row: OutreachEntry) => {
    try {
      setApprovingId(row.id);
      await approveOutreach(row.id, currentUser);
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const councilsList = useMemo(() => {
    return Array.from(new Set([...getCouncils(), ...outreaches.map((o) => o.councilName)]));
  }, [outreaches]);

  const filteredEntries = useMemo(() => {
    return outreaches.filter((item) => {
      if (effectiveCouncil !== 'all' && item.councilName !== effectiveCouncil) return false;
      if (selectedLevel !== 'all' && item.outreachLevel !== selectedLevel) return false;
      if (selectedType !== 'all' && item.outreachType !== selectedType) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCouncil = item.councilName.toLowerCase().includes(query);
        const matchesNotes = (item.notes || '').toLowerCase().includes(query);
        const matchesLocation = (item.locationArea || '').toLowerCase().includes(query);
        const matchesSubmitter = item.submittedBy.name.toLowerCase().includes(query);
        const matchesConvert = item.converts?.some((c) => c.fullName.toLowerCase().includes(query));
        if (!matchesCouncil && !matchesNotes && !matchesLocation && !matchesSubmitter && !matchesConvert) {
          return false;
        }
      }

      return true;
    });
  }, [outreaches, effectiveCouncil, selectedLevel, selectedType, searchTerm]);

  const handleDownloadCSV = () => {
    const csv = exportOutreachesToCSV(filteredEntries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ephesians_field_operations_${effectiveCouncil}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'general_overseer') {
      alert('RBAC Restriction: Only General Overseer / Lead Admin accounts can delete operation records.');
      return;
    }
    deleteOutreach(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Bar with Search & Filters */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Field Operations Master Log
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isGen
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : isCouncil
                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                  : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {isGen ? 'All 5 Councils Oversight' : isCouncil ? `${userCouncil} Oversight Only` : `${currentUser.governorship || 'Governorship'} Oversight Only`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isGen
                ? 'Full apostolic oversight across all 5 Councils, Governorships, and Bacentas'
                : isCouncil
                ? `Restricted to records under ${userCouncil} pastoral oversight only`
                : `Restricted to records under ${currentUser.governorship || 'your Governorship'} oversight only`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>CSV ({filteredEntries.length})</span>
            </button>
            <button
              onClick={onOpenReportPrint}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search council, convert, area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Council Filter: Locked for Council Overseer and Governor */}
          {isCouncil ? (
            <div className="px-3 py-2 bg-slate-950 border border-indigo-900/60 rounded-xl text-xs text-indigo-300 font-semibold flex items-center justify-between">
              <span>{userCouncil}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Locked Scope</span>
            </div>
          ) : isGov ? (
            <div className="px-3 py-2 bg-slate-950 border border-blue-900/60 rounded-xl text-xs text-blue-300 font-semibold flex items-center justify-between">
              <span>{currentUser.governorship || userCouncil}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Locked Scope</span>
            </div>
          ) : (
            <select
              value={selectedCouncil}
              onChange={(e) => setSelectedCouncil(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-medium"
            >
              <option value="all">All 5 Councils</option>
              {councilsList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-medium"
          >
            <option value="all">All Outreach Levels</option>
            <option value="Bacentas">Bacentas</option>
            <option value="Governorships">Governorships</option>
            <option value="Overseership">Overseership</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-medium"
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
      </div>

      {/* Operations Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {outreaches.length === 0
              ? 'No outreach operations recorded yet. Submit your first field report to populate the master ledger.'
              : 'No outreach operations found matching the filter criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Council</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Outreach Type</th>
                  <th className="py-3 px-4 text-center">Leaders</th>
                  <th className="py-3 px-4 text-center">Souls</th>
                  <th className="py-3 px-4 text-center">Converts</th>
                  <th className="py-3 px-4 text-center">Approval</th>
                  <th className="py-3 px-4 text-center">Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredEntries.map((row) => {
                  const isExpanded = expandedId === row.id;
                  const isApproved = row.approvalStatus === 'approved';

                  return (
                    <React.Fragment key={row.id}>
                      <tr className={`hover:bg-slate-800/50 transition-colors ${isExpanded ? 'bg-slate-800/30' : ''}`}>
                        <td className="py-3 px-4 text-white font-semibold font-mono whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          <div>{row.councilName}</div>
                          {row.locationArea && (
                            <div className="text-[11px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{row.locationArea}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              row.outreachLevel === 'Overseership'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : row.outreachLevel === 'Governorships'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {row.outreachLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {row.outreachType}
                          {row.otherTypeDetail ? ` (${row.otherTypeDetail})` : ''}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-200">
                          {row.leadersPresentCount}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums font-bold text-emerald-400">
                          {row.soulsWonCount}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums text-slate-300">
                          {row.converts?.length || 0}
                        </td>
                        {/* Approval Status Badge & Admin Action */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isApproved ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-semibold"
                              title={
                                row.approvedBy
                                  ? `Approved by ${row.approvedBy.name} on ${new Date(
                                      row.approvedBy.approvedAt
                                    ).toLocaleDateString()}`
                                  : 'Approved by Administration'
                              }
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-semibold">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Pending</span>
                              </span>
                              {currentUser.role === 'admin' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(row);
                                  }}
                                  disabled={approvingId === row.id}
                                  className="px-2 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
                                  title="Approve outreach and broadcast real-time alert to submitting leader"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>{approvingId === row.id ? 'Approving...' : 'Approve'}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {row.syncStatus === 'synced' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              <span>Cloud</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>Queued</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : row.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Toggle details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {currentUser.role === 'admin' ? (
                              <button
                                onClick={() => setDeleteConfirmId(row.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Delete entry (Admin Only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/60 border-b border-slate-800">
                          <td colSpan={10} className="p-4 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Submitter & Testimonies */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-200 text-xs">
                                  Field Operation Context
                                </h4>
                                <div className="text-xs text-slate-300 space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                                  <p>
                                    <strong>Submitted by:</strong> {row.submittedBy.name} (
                                    {row.submittedBy.email})
                                  </p>
                                  <p>
                                    <strong>Outreach Type:</strong> {row.outreachType}
                                  </p>
                                  <p>
                                    <strong>Location:</strong> {row.locationArea || 'Not specified'}
                                  </p>
                                  {row.notes && (
                                    <p className="mt-2 text-slate-400 italic border-t border-slate-800 pt-2">
                                      "{row.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Verified Leaders Present */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Leaders Present ({row.leadersPresentCount})</span>
                                </h4>
                                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto text-xs space-y-1.5">
                                  {row.leadersList && row.leadersList.length > 0 ? (
                                    row.leadersList.map((lead) => (
                                      <div
                                        key={lead.id}
                                        className="flex items-center justify-between text-[11px]"
                                      >
                                        <span className="font-medium text-slate-200">{lead.name}</span>
                                        <span className="text-slate-400">{lead.role}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-slate-500 italic">
                                      Total head count: {row.leadersPresentCount} leaders
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Attached Files & Uploads */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Attached Files ({row.attachments?.length || 0})</span>
                                </h4>
                                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto text-xs space-y-2">
                                  {row.attachments && row.attachments.length > 0 ? (
                                    row.attachments.map((file) => (
                                      <div
                                        key={file.id}
                                        className="flex items-center justify-between text-[11px] p-1.5 bg-slate-950 border border-slate-800/80 rounded-lg"
                                      >
                                        <span className="font-medium text-slate-200 truncate max-w-[140px]">
                                          {file.name}
                                        </span>
                                        <span className="text-slate-400 shrink-0 font-mono">
                                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-slate-500 italic">No files attached</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Converts Roster Attached */}
                            {row.converts && row.converts.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Registered Converts Roster ({row.converts.length})</span>
                                </h4>
                                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                                      <tr>
                                        <th className="py-2 px-3">Name</th>
                                        <th className="py-2 px-3">Phone</th>
                                        <th className="py-2 px-3">Gender / Age</th>
                                        <th className="py-2 px-3">Decision</th>
                                        <th className="py-2 px-3">Follow-Up Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                      {row.converts.map((c) => (
                                        <tr key={c.id}>
                                          <td className="py-2 px-3 font-semibold text-slate-100">
                                            {c.fullName}
                                          </td>
                                          <td className="py-2 px-3 text-slate-300 font-mono">
                                            {c.phone || '—'}
                                          </td>
                                          <td className="py-2 px-3 text-slate-400">
                                            {c.gender} · {c.ageGroup}
                                          </td>
                                          <td className="py-2 px-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                                              {c.decision}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-slate-300">
                                            {c.followUpStatus}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-800">
            <h3 className="font-bold text-white text-base">Confirm Record Deletion</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete this field outreach report? This action is
              logged in the audit trail.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
