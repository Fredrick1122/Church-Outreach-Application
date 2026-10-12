import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  Heart,
  Download,
  Share2,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { OutreachEntry, ConvertRecord, UserProfile, isGeneralOverseer, isCouncilOverseer, isGovernor } from '../types';
import { saveOutreach, getOutreaches } from '../services/storage';

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
}

export const ConvertsDirectory: React.FC<Props> = ({ outreaches, currentUser }) => {
  const isGen = isGeneralOverseer(currentUser.role);
  const isCouncil = isCouncilOverseer(currentUser.role);
  const isGov = isGovernor(currentUser.role);
  const userCouncil = currentUser.council && !currentUser.council.includes('All') ? currentUser.council : 'Ephesians 1';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');

  // Flatten all converts with parent outreach context
  const flattenedConverts = useMemo(() => {
    const list: Array<{
      convert: ConvertRecord;
      outreachId: string;
      councilName: string;
      outreachDate: string;
      outreachType: string;
    }> = [];

    outreaches.forEach((outreach) => {
      (outreach.converts || []).forEach((c) => {
        list.push({
          convert: c,
          outreachId: outreach.id,
          councilName: outreach.councilName,
          outreachDate: outreach.date,
          outreachType: outreach.outreachType,
        });
      });
    });

    return list;
  }, [outreaches]);

  const filteredConverts = useMemo(() => {
    return flattenedConverts.filter(({ convert, councilName }) => {
      if (statusFilter !== 'all' && convert.followUpStatus !== statusFilter) return false;
      if (decisionFilter !== 'all' && convert.decision !== decisionFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = convert.fullName.toLowerCase().includes(q);
        const matchesPhone = convert.phone.toLowerCase().includes(q);
        const matchesArea = (convert.addressOrArea || '').toLowerCase().includes(q);
        const matchesCouncil = councilName.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesArea && !matchesCouncil) return false;
      }

      return true;
    });
  }, [flattenedConverts, statusFilter, decisionFilter, searchTerm]);

  // Update status directly
  const handleUpdateStatus = (
    outreachId: string,
    convertId: string,
    newStatus: ConvertRecord['followUpStatus']
  ) => {
    const targetOutreach = outreaches.find((o) => o.id === outreachId);
    if (!targetOutreach) return;

    const updatedConverts = (targetOutreach.converts || []).map((c) =>
      c.id === convertId ? { ...c, followUpStatus: newStatus } : c
    );

    saveOutreach({
      ...targetOutreach,
      converts: updatedConverts,
    });
  };

  // WhatsApp click generator
  const getWhatsAppLink = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${name}, greetings from Ephesians Outreach Ministry! We are following up and thanking God for your salvation decision. We would love to welcome you to our fellowship this Sunday!`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // Export converts CSV
  const handleExportConverts = () => {
    const headers = [
      'Full Name',
      'Phone',
      'Gender',
      'Age Group',
      'Decision',
      'Follow-Up Status',
      'Council',
      'Outreach Date',
      'Area',
      'Notes',
    ];

    const rows = flattenedConverts.map(({ convert, councilName, outreachDate }) => [
      `"${convert.fullName.replace(/"/g, '""')}"`,
      `"${convert.phone}"`,
      `"${convert.gender}"`,
      `"${convert.ageGroup}"`,
      `"${convert.decision}"`,
      `"${convert.followUpStatus}"`,
      `"${councilName.replace(/"/g, '""')}"`,
      `"${outreachDate}"`,
      `"${(convert.addressOrArea || '').replace(/"/g, '""')}"`,
      `"${(convert.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ephesians_converts_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Converts Follow-Up Directory
            </h2>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              isGen
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : isCouncil
                ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                : 'bg-blue-950 text-blue-400 border border-blue-800'
            }`}>
              {isGen ? 'All 5 Councils Oversight' : isCouncil ? `${userCouncil} Oversight Only` : `${currentUser.governorship || 'Governorship'} Oversight Only`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isGen
              ? 'Tracking decisions, personal contact details, and discipleship integration across all 5 Councils'
              : isCouncil
              ? `Tracking discipleship integration under ${userCouncil} pastoral oversight only`
              : `Tracking discipleship integration under ${currentUser.governorship || 'Governorship'} oversight only`}
          </p>
        </div>

        <button
          onClick={handleExportConverts}
          className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Converts Roster</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Total Registered</span>
          <p className="text-xl font-bold text-white mt-1 tabular-nums">
            {flattenedConverts.length}
          </p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-xs text-rose-400 font-medium">Pending Call</span>
          <p className="text-xl font-bold text-rose-400 mt-1 tabular-nums">
            {flattenedConverts.filter((c) => c.convert.followUpStatus === 'Uncontacted').length}
          </p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-xs text-blue-400 font-medium">First Call Made</span>
          <p className="text-xl font-bold text-blue-400 mt-1 tabular-nums">
            {flattenedConverts.filter((c) => c.convert.followUpStatus === 'First Call Made').length}
          </p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-400 font-medium">In Church / Bacenta</span>
          <p className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
            {
              flattenedConverts.filter(
                (c) =>
                  c.convert.followUpStatus === 'Bacenta Assigned' ||
                  c.convert.followUpStatus === 'In Church'
              ).length
            }
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by convert name, phone, area, council..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-medium"
        >
          <option value="all">All Follow-Up Stages</option>
          <option value="Uncontacted">Uncontacted</option>
          <option value="First Call Made">First Call Made</option>
          <option value="Bacenta Assigned">Bacenta Assigned</option>
          <option value="In Church">In Church</option>
        </select>

        <select
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-medium"
        >
          <option value="all">All Decision Types</option>
          <option value="Born Again">Born Again</option>
          <option value="Rededicated">Rededicated</option>
          <option value="First Time Visitor">First Time Visitor</option>
          <option value="Prayer Request">Prayer Request</option>
        </select>
      </div>

      {/* Converts Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredConverts.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
            {flattenedConverts.length === 0
              ? 'No converts registered yet. When field evangelists record converts or attach rosters, they will appear here for discipleship follow-up.'
              : 'No converts found matching the current search filters.'}
          </div>
        ) : (
          filteredConverts.map(({ convert, outreachId, councilName, outreachDate }) => (
            <div
              key={convert.id}
              className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{convert.fullName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {convert.gender} · {convert.ageGroup}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      convert.decision === 'Born Again'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-blue-950 text-blue-300 border-blue-800'
                    }`}
                  >
                    {convert.decision}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-400">Council:</strong> {councilName} ({outreachDate})
                  </p>
                  {convert.addressOrArea && (
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{convert.addressOrArea}</span>
                    </p>
                  )}
                  {convert.notes && (
                    <p className="text-slate-400 italic text-[11px] mt-1 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      "{convert.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Call, WhatsApp, Status Selector */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {convert.phone ? (
                    <>
                      <a
                        href={`tel:${convert.phone}`}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Voice Call"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>Call</span>
                      </a>
                      <a
                        href={getWhatsAppLink(convert.phone, convert.fullName)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="WhatsApp Message"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No phone provided</span>
                  )}
                </div>

                {/* Status Dropdown */}
                <select
                  value={convert.followUpStatus}
                  onChange={(e) =>
                    handleUpdateStatus(outreachId, convert.id, e.target.value as any)
                  }
                  className={`px-2 py-1 text-xs rounded-lg font-semibold border ${
                    convert.followUpStatus === 'In Church'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : convert.followUpStatus === 'Bacenta Assigned'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : convert.followUpStatus === 'First Call Made'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  <option value="Uncontacted">Uncontacted</option>
                  <option value="First Call Made">First Call Made</option>
                  <option value="Bacenta Assigned">Bacenta Assigned</option>
                  <option value="In Church">In Church</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
