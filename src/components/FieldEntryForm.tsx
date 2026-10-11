import React, { useState } from 'react';
import {
  Calendar,
  Building2,
  ChevronDown,
  Layers,
  MapPin,
  Users,
  Heart,
  Upload,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  WifiOff,
  CloudUpload,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Shield,
  Phone,
  FileUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  OutreachEntry,
  OutreachLevel,
  OutreachType,
  ConvertRecord,
  AttachmentInfo,
  UserProfile,
  LeaderAttendance,
} from '../types';
import {
  saveOutreach,
  getCouncils,
  addCouncil,
  getIsOnline,
  getLeadersPool,
} from '../services/storage';
import { LeaderTrackingModal } from './LeaderTrackingModal';

interface Props {
  currentUser: UserProfile;
  onSwitchAccount: () => void;
  onEntrySaved: (entry: OutreachEntry) => void;
}

const OUTREACH_LEVELS: OutreachLevel[] = ['Bacentas', 'Governorships', 'Overseership'];

const OUTREACH_TYPES: OutreachType[] = [
  'Door to Door / 1 v 1',
  'Busstop',
  'Street Invasion / Stomp the Yard',
  'Crusade',
  'Dance Outreach',
  'Other',
];

export const FieldEntryForm: React.FC<Props> = ({
  currentUser,
  onSwitchAccount,
  onEntrySaved,
}) => {
  const isOnline = getIsOnline();
  const availableCouncils = getCouncils();

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [councilName, setCouncilName] = useState(
    currentUser.council.includes('Executive') ? availableCouncils[0] : currentUser.council
  );
  const [newCouncilInput, setNewCouncilInput] = useState('');
  const [showAddCouncil, setShowAddCouncil] = useState(false);

  const [outreachLevel, setOutreachLevel] = useState<OutreachLevel>('Bacentas');
  const [outreachType, setOutreachType] = useState<OutreachType>('Door to Door / 1 v 1');
  const [otherTypeDetail, setOtherTypeDetail] = useState('');

  const [leadersCount, setLeadersCount] = useState<number>(4);
  const [soulsCount, setSoulsCount] = useState<number>(5);
  const [locationArea, setLocationArea] = useState('');
  const [notes, setNotes] = useState('');

  // Automated Leader Tracking
  const [leadersList, setLeadersList] = useState<LeaderAttendance[]>(() => {
    return getLeadersPool().map((l) => ({ ...l, isPresent: l.council === councilName }));
  });
  const [showLeaderModal, setShowLeaderModal] = useState(false);

  // Digital Converts Roster
  const [converts, setConverts] = useState<ConvertRecord[]>([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertForm, setConvertForm] = useState<{
    fullName: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    ageGroup: 'Youth (<18)' | 'Young Adult (18-30)' | 'Adult (31-50)' | 'Senior (50+)';
    decision: 'Born Again' | 'Rededicated' | 'First Time Visitor' | 'Prayer Request';
    needsFollowUp: boolean;
    addressOrArea: string;
    notes: string;
  }>({
    fullName: '',
    phone: '',
    gender: 'Female',
    ageGroup: 'Young Adult (18-30)',
    decision: 'Born Again',
    needsFollowUp: true,
    addressOrArea: '',
    notes: '',
  });

  // Attachments
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Date Presets
  const setDatePreset = (preset: 'today' | 'yesterday' | 'saturday') => {
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
    } else if (preset === 'saturday') {
      const day = d.getDay();
      const diff = day === 6 ? 0 : (day + 1);
      d.setDate(d.getDate() - diff);
    }
    setDate(d.toISOString().split('T')[0]);
  };

  // Add new council
  const handleCreateCouncil = () => {
    if (newCouncilInput.trim()) {
      addCouncil(newCouncilInput.trim());
      setCouncilName(newCouncilInput.trim());
      setNewCouncilInput('');
      setShowAddCouncil(false);
    }
  };

  // File Upload handling (Max 10MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit as in original form

    if (file.size > maxSizeBytes) {
      setFileError('File exceeds maximum size of 10 MB. Please upload a smaller document.');
      return;
    }

    const newAttachment: AttachmentInfo = {
      id: `att_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };

    setAttachments((prev) => [...prev, newAttachment]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Add convert
  const handleAddConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertForm.fullName.trim()) return;

    const newConvert: ConvertRecord = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: convertForm.fullName.trim(),
      phone: convertForm.phone.trim(),
      gender: convertForm.gender,
      ageGroup: convertForm.ageGroup,
      decision: convertForm.decision,
      needsFollowUp: convertForm.needsFollowUp,
      followUpStatus: 'Uncontacted',
      addressOrArea: convertForm.addressOrArea.trim(),
      notes: convertForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newConvert, ...converts];
    setConverts(updated);
    // Auto sync souls count if greater
    if (updated.length > soulsCount) {
      setSoulsCount(updated.length);
    }

    // Reset convert sub-form
    setConvertForm({
      fullName: '',
      phone: '',
      gender: 'Female',
      ageGroup: 'Young Adult (18-30)',
      decision: 'Born Again',
      needsFollowUp: true,
      addressOrArea: '',
      notes: '',
    });
    setShowConvertModal(false);
  };

  const removeConvert = (id: string) => {
    setConverts((prev) => prev.filter((c) => c.id !== id));
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newEntry: OutreachEntry = {
      id: `outreach_${Date.now()}`,
      date,
      councilName,
      outreachLevel,
      outreachType,
      otherTypeDetail: outreachType === 'Other' ? otherTypeDetail : undefined,
      leadersPresentCount: leadersCount,
      soulsWonCount: soulsCount,
      locationArea: locationArea.trim() || undefined,
      leadersList: leadersList.filter((l) => l.isPresent),
      converts,
      attachments,
      notes: notes.trim() || undefined,
      submittedBy: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveOutreach(newEntry);

    // Trigger celebration if souls won >= 10
    if (soulsCount >= 10) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // fallback
      }
    }

    setIsSubmitting(false);
    setSuccessMessage(
      isOnline
        ? `Outreach successfully logged & synced to cloud! (${soulsCount} souls won recorded)`
        : `Outreach saved locally in Offline Mode. It will sync automatically when back online.`
    );

    onEntrySaved(newEntry);

    // Reset fields for next entry
    setConverts([]);
    setAttachments([]);
    setNotes('');
    setLocationArea('');

    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Google Form Replica Card Header */}
      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden mb-5">
        <div className="h-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Ephesians Outreach
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Official Ministry Evangelism Activity & Harvest Metrics Report
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              EO
            </div>
          </div>

          {/* Account line matching prompt: "dogbatseyfredrick@gmail.com Switch account admin" */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-slate-200">{currentUser.email}</span>
              <button
                type="button"
                onClick={onSwitchAccount}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
              >
                Switch account ({currentUser.role})
              </button>
            </div>
            <span className="text-slate-400">
              Role: <strong className="text-slate-200 capitalize">{currentUser.roleTitle}</strong>
            </span>
          </div>

          <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            The name, email, and photo associated with your Google account will be recorded when you
            upload files and submit this form.
          </div>

          <p className="mt-3 text-xs font-semibold text-rose-400">* Indicates required question</p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 flex items-start gap-3 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <strong className="block font-semibold text-emerald-300">Report Successfully Submitted!</strong>
            <p className="mt-0.5 text-emerald-200/90">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Interactive Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* FIELD 1: DATE */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-3">
          <label htmlFor="outreach-date" className="block text-sm font-bold text-slate-100">
            Date <span className="text-rose-400">*</span>
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="outreach-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            {/* Quick date presets */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className="px-2.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700/60"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('yesterday')}
                className="px-2.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700/60"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('saturday')}
                className="px-2.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700/60"
              >
                Last Sat
              </button>
            </div>
          </div>
        </div>

        {/* FIELD 2: COUNCIL NAME */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="council-select" className="block text-sm font-bold text-slate-100">
              Council Name <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddCouncil(!showAddCouncil)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              {showAddCouncil ? 'Select Existing' : '+ Add New Council'}
            </button>
          </div>

          {showAddCouncil ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter new council name..."
                value={newCouncilInput}
                onChange={(e) => setNewCouncilInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleCreateCouncil}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition-colors"
              >
                Add
              </button>
            </div>
          ) : (
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400 pointer-events-none" />
              <select
                id="council-select"
                required
                value={councilName}
                onChange={(e) => setCouncilName(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none cursor-pointer"
              >
                <optgroup label="Ephesians Councils" className="bg-slate-900 text-slate-400 font-normal">
                  {availableCouncils.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-slate-100 font-medium">
                      {c}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* FIELD 3: OUTREACH LEVEL */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-slate-100">
            Outreach Level <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {OUTREACH_LEVELS.map((lvl) => {
              const isSelected = outreachLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setOutreachLevel(lvl)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-sm font-semibold">{lvl}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-bold'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isSelected && '✓'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FIELD 4: OUTREACH TYPE */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-slate-100">
            Outreach Type <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OUTREACH_TYPES.map((type) => {
              const isSelected = outreachType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOutreachType(type)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500 font-semibold'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{type}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-bold'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isSelected && '✓'}
                  </span>
                </button>
              );
            })}
          </div>

          {outreachType === 'Other' && (
            <div className="mt-2 pt-2">
              <label htmlFor="other-outreach-type" className="text-xs font-medium text-slate-400 block mb-1">
                Specify Other Outreach Type:
              </label>
              <input
                id="other-outreach-type"
                type="text"
                placeholder="e.g. Sports Outreach, Hospital Ministry, Campus Fellowship..."
                value={otherTypeDetail}
                onChange={(e) => setOtherTypeDetail(e.target.value)}
                required={outreachType === 'Other'}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* FIELD 5: NUMBER OF LEADERS/MEMBERS PRESENT */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-100">
              Number of Leaders/Members present at Outreaches <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowLeaderModal(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Track Roster</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
              <button
                type="button"
                onClick={() => setLeadersCount(Math.max(1, leadersCount - 1))}
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white font-bold text-lg transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                required
                value={leadersCount}
                onChange={(e) => setLeadersCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center py-2 bg-transparent text-base font-bold text-slate-100 tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setLeadersCount(leadersCount + 1)}
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[+2, +5, +10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setLeadersCount(leadersCount + delta)}
                  className="px-2.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700/60"
                >
                  +{delta}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {leadersList.filter((l) => l.isPresent).length > 0
              ? `${leadersList.filter((l) => l.isPresent).length} specific leaders checked on roster`
              : 'Tip: Click "Track Roster" to check specific names for attendance analytics.'}
          </p>
        </div>

        {/* FIELD 6: NUMBER OF SOULS WON */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-100">
              Number of Souls won <span className="text-rose-400">*</span>
            </label>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {converts.length > 0 ? `${converts.length} names recorded below` : 'Harvest Tracker'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
              <button
                type="button"
                onClick={() => setSoulsCount(Math.max(0, soulsCount - 1))}
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white font-bold text-lg transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                required
                value={soulsCount}
                onChange={(e) => setSoulsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center py-2 bg-transparent text-base font-bold text-slate-100 tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSoulsCount(soulsCount + 1)}
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[+1, +5, +10, +25].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setSoulsCount(soulsCount + delta)}
                  className="px-2.5 py-2 text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 rounded-lg transition-colors"
                >
                  +{delta}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FIELD 7: ATTACH CONVERTS DETAILS & DIGITAL ROSTER */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-slate-100">
                Attach Converts Details
              </label>
              <p className="text-xs text-slate-400">
                Upload 1 supported file. Max 10 MB. Or log souls digitally below for instant follow-up CRM.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConvertModal(true)}
              className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Convert</span>
            </button>
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 text-center bg-slate-950/40 transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <FileUp className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-emerald-400 hover:underline">Click to upload</span> or drag and drop
              </div>
              <p className="text-[11px] text-slate-400">PDF, Excel, CSV, or Photo sheet (Max 10 MB)</p>
            </label>
          </div>

          {fileError && (
            <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Uploaded File List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400">Uploaded File:</p>
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate">{file.name}</span>
                    <span className="text-slate-400 shrink-0">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file.id)}
                    className="text-slate-400 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Converts Roster Table */}
          {converts.length > 0 && (
            <div className="mt-3 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="bg-slate-850 px-3 py-2 text-xs font-bold text-slate-200 flex items-center justify-between border-b border-slate-800">
                <span>Recorded Converts ({converts.length})</span>
                <span className="text-[11px] font-normal text-slate-400">Ready for follow-up</span>
              </div>
              <div className="divide-y divide-slate-850 max-h-48 overflow-y-auto">
                {converts.map((c) => (
                  <div key={c.id} className="p-2.5 bg-slate-950 flex items-center justify-between text-xs gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{c.fullName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium border border-emerald-800">
                          {c.decision}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-0.5 text-[11px]">
                        {c.phone || 'No phone'} · {c.gender} · {c.ageGroup}
                        {c.addressOrArea ? ` · ${c.addressOrArea}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConvert(c.id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FIELD 8: FIELD AREA & NOTES (OPTIONAL) */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-3">
          <label htmlFor="field-location" className="block text-sm font-bold text-slate-100">
            Location Area & Field Notes
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="field-location"
              type="text"
              placeholder="e.g. Achimota Mall, Circle Station, Madina Zongo..."
              value={locationArea}
              onChange={(e) => setLocationArea(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Field testimonies, specific breakthroughs, challenges, or prayers..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* SUBMIT BUTTON WITH OFFLINE RESILIENCE */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
            }`}
          >
            {isOnline ? (
              <>
                <CloudUpload className="w-5 h-5" />
                <span>Submit Report & Cloud Sync</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                <span>Submit & Save to Offline Queue</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            {isOnline
              ? 'Real-time database sync is active. Submissions reflect instantly on admin console.'
              : 'You are currently in Field Offline Mode. Data will be saved locally and synced once reconnected.'}
          </p>
        </div>
      </form>

      {/* Leader Tracking Modal */}
      <LeaderTrackingModal
        isOpen={showLeaderModal}
        onClose={() => {
          setShowLeaderModal(false);
          const present = leadersList.filter((l) => l.isPresent).length;
          if (present > 0) setLeadersCount(present);
        }}
        leadersList={leadersList}
        onUpdateLeaders={(updated) => {
          setLeadersList(updated);
          const present = updated.filter((l) => l.isPresent).length;
          if (present > 0) setLeadersCount(present);
        }}
        currentCouncil={councilName}
      />

      {/* Digital Convert Add Drawer / Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add Convert Details</h3>
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddConvert} className="p-6 space-y-3.5 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={convertForm.fullName}
                  onChange={(e) => setConvertForm({ ...convertForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+233 24 000 0000"
                  value={convertForm.phone}
                  onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Gender</label>
                  <select
                    value={convertForm.gender}
                    onChange={(e) =>
                      setConvertForm({ ...convertForm, gender: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Age Group</label>
                  <select
                    value={convertForm.ageGroup}
                    onChange={(e) =>
                      setConvertForm({ ...convertForm, ageGroup: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                  >
                    <option value="Youth (<18)">Youth (&lt;18)</option>
                    <option value="Young Adult (18-30)">Young Adult (18-30)</option>
                    <option value="Adult (31-50)">Adult (31-50)</option>
                    <option value="Senior (50+)">Senior (50+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Decision Type
                </label>
                <select
                  value={convertForm.decision}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, decision: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg font-medium text-emerald-300"
                >
                  <option value="Born Again">Born Again (New Decision)</option>
                  <option value="Rededicated">Rededicated</option>
                  <option value="First Time Visitor">First Time Visitor</option>
                  <option value="Prayer Request">Prayer Request Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Residence / Landmark Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Total Filling Station"
                  value={convertForm.addressOrArea}
                  onChange={(e) => setConvertForm({ ...convertForm, addressOrArea: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="needsFollowUp"
                  checked={convertForm.needsFollowUp}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, needsFollowUp: e.target.checked })
                  }
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="needsFollowUp" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Mark for pastoral / bacenta follow-up call
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                >
                  Save Convert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
