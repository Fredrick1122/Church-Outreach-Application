import React, { useState, useMemo } from 'react';
import {
  Camera,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Building,
  Maximize2,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import {
  OutreachEntry,
  UserProfile,
  AttachmentInfo,
  isGeneralOverseer,
  isCouncilOverseer,
  isGovernor,
} from '../types';

export interface PictureItem {
  id: string;
  attachment: AttachmentInfo;
  outreach: OutreachEntry;
}

interface Props {
  outreaches: OutreachEntry[];
  currentUser: UserProfile;
  theme?: 'dark' | 'light';
  title?: string;
  subtitle?: string;
  showCouncilFilter?: boolean;
}

export const OutreachPicturesGallery: React.FC<Props> = ({
  outreaches,
  currentUser,
  theme = 'dark',
  title,
  subtitle,
  showCouncilFilter = false,
}) => {
  const isGenOverseer = currentUser.role === 'admin' || isGeneralOverseer(currentUser.role);
  const isCnlOverseer = isCouncilOverseer(currentUser.role);
  const isGov = isGovernor(currentUser.role);

  // Extract all picture items from outreaches
  const allPictures = useMemo<PictureItem[]>(() => {
    const list: PictureItem[] = [];
    outreaches.forEach((outreach) => {
      if (Array.isArray(outreach.attachments)) {
        outreach.attachments.forEach((att) => {
          const isImage =
            att.previewUrl ||
            att.type?.startsWith('image/') ||
            att.name?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
          if (isImage) {
            list.push({
              id: `${outreach.id}_${att.id}`,
              attachment: att,
              outreach,
            });
          }
        });
      }
    });
    return list;
  }, [outreaches]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [councilFilter, setCouncilFilter] = useState('all');
  const [governorshipFilter, setGovernorshipFilter] = useState('all');
  const [bacentaFilter, setBacentaFilter] = useState('all');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Collect available councils, governorships, bacentas for dropdowns
  const availableCouncils = useMemo(() => {
    return Array.from(new Set(allPictures.map((p) => p.outreach.councilName))).filter(Boolean);
  }, [allPictures]);

  const availableGovernorships = useMemo(() => {
    return Array.from(
      new Set(
        allPictures
          .filter((p) => councilFilter === 'all' || p.outreach.councilName === councilFilter)
          .map((p) => p.outreach.governorshipName)
      )
    ).filter(Boolean) as string[];
  }, [allPictures, councilFilter]);

  const availableBacentas = useMemo(() => {
    return Array.from(
      new Set(
        allPictures
          .filter((p) => {
            const matchesCouncil = councilFilter === 'all' || p.outreach.councilName === councilFilter;
            const matchesGov =
              governorshipFilter === 'all' || p.outreach.governorshipName === governorshipFilter;
            return matchesCouncil && matchesGov;
          })
          .map((p) => p.outreach.bacentaName)
      )
    ).filter(Boolean) as string[];
  }, [allPictures, councilFilter, governorshipFilter]);

  // Filtered pictures
  const filteredPictures = useMemo(() => {
    return allPictures.filter((item) => {
      const { outreach, attachment } = item;

      // Council filter
      if (showCouncilFilter && councilFilter !== 'all' && outreach.councilName !== councilFilter) {
        return false;
      }

      // Governorship filter
      if (governorshipFilter !== 'all' && outreach.governorshipName !== governorshipFilter) {
        return false;
      }

      // Bacenta filter
      if (bacentaFilter !== 'all' && outreach.bacentaName !== bacentaFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = attachment.name?.toLowerCase().includes(q);
        const inCouncil = outreach.councilName?.toLowerCase().includes(q);
        const inGov = outreach.governorshipName?.toLowerCase().includes(q);
        const inBacenta = outreach.bacentaName?.toLowerCase().includes(q);
        const inNotes = outreach.notes?.toLowerCase().includes(q);
        const inSubmitter = outreach.submittedBy?.name?.toLowerCase().includes(q);
        const inLocation = outreach.locationArea?.toLowerCase().includes(q);
        if (!inName && !inCouncil && !inGov && !inBacenta && !inNotes && !inSubmitter && !inLocation) {
          return false;
        }
      }

      return true;
    });
  }, [allPictures, showCouncilFilter, councilFilter, governorshipFilter, bacentaFilter, searchQuery]);

  const activePhoto = activePhotoIndex !== null ? filteredPictures[activePhotoIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null && activePhotoIndex > 0) {
      setActivePhotoIndex(activePhotoIndex - 1);
    } else if (activePhotoIndex === 0) {
      setActivePhotoIndex(filteredPictures.length - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null && activePhotoIndex < filteredPictures.length - 1) {
      setActivePhotoIndex(activePhotoIndex + 1);
    } else {
      setActivePhotoIndex(0);
    }
  };

  // Default headers depending on role
  const resolvedTitle =
    title ||
    (isGenOverseer
      ? 'All Councils Outreach Pictures & Visual Evidence'
      : isCnlOverseer
      ? `${currentUser.council} Field Outreach Pictures`
      : isGov
      ? `${currentUser.governorship || 'Governorship'} Outreach Photos`
      : 'Outreach Pictures Gallery');

  const resolvedSubtitle =
    subtitle ||
    (isGenOverseer
      ? 'Viewing outreach photos across all 5 Apostolic Councils'
      : isCnlOverseer
      ? `Viewing photos solely from ${currentUser.council} outreaches`
      : isGov
      ? `Viewing photos solely from ${currentUser.governorship || 'your Governorship'} and its bacentas`
      : 'Visual verification of soul winning and street evangelism');

  const isLight = theme === 'light';

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
      } p-5 space-y-5`}
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isLight
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
            }`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                {resolvedTitle}
              </h3>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {filteredPictures.length} {filteredPictures.length === 1 ? 'Picture' : 'Pictures'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {resolvedSubtitle}
            </p>
          </div>
        </div>

        {/* Scope Tag */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 ${
              isLight
                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {isGenOverseer
                ? 'All 5 Councils Access'
                : isCnlOverseer
                ? `${currentUser.council} Exclusive`
                : isGov
                ? `${currentUser.governorship || 'Governorship'} Exclusive`
                : 'Field Area'}
            </span>
          </span>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by bacenta, area, leader, or notes..."
            className={`w-full bg-transparent border-none text-xs focus:outline-none ${
              isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-slate-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Council Filter (General Overseer only) */}
          {showCouncilFilter && availableCouncils.length > 0 && (
            <select
              value={councilFilter}
              onChange={(e) => {
                setCouncilFilter(e.target.value);
                setGovernorshipFilter('all');
                setBacentaFilter('all');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <option value="all">All Councils</option>
              {availableCouncils.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Governorship Filter */}
          {availableGovernorships.length > 0 && !isGov && (
            <select
              value={governorshipFilter}
              onChange={(e) => {
                setGovernorshipFilter(e.target.value);
                setBacentaFilter('all');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <option value="all">All Governorships</option>
              {availableGovernorships.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}

          {/* Bacenta Filter */}
          {availableBacentas.length > 0 && (
            <select
              value={bacentaFilter}
              onChange={(e) => setBacentaFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <option value="all">All Bacentas</option>
              {availableBacentas.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Picture Grid or Empty State */}
      {filteredPictures.length === 0 ? (
        <div
          className={`py-12 px-6 rounded-2xl border text-center space-y-3 ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-600'
              : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
          }`}
        >
          <div
            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-500'
            }`}
          >
            <ImageIcon className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              No Outreach Pictures Uploaded Yet
            </h4>
            <p className="text-xs mt-1 leading-relaxed text-slate-400">
              When field leaders and soul winners upload photos using the{' '}
              <strong>Upload Form</strong> for their outreaches in this area, the pictures will
              appear here automatically with full details and verified soul counts.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPictures.map((item, idx) => {
            const { outreach, attachment } = item;
            const imgSrc =
              attachment.previewUrl ||
              'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={item.id}
                onClick={() => setActivePhotoIndex(idx)}
                className={`group cursor-pointer rounded-xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-lg ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                    : 'bg-slate-950 border-slate-800 hover:border-emerald-500/60'
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                  <img
                    src={imgSrc}
                    alt={attachment.name || 'Outreach Photo'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-xs text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {outreach.councilName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-xs text-[10px] font-bold text-amber-300 border border-amber-500/30">
                      +{outreach.soulsWonCount} Souls
                    </span>
                  </div>

                  {/* Expand icon hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-slate-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-md">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Card Caption Info */}
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                      {outreach.bacentaName || outreach.governorshipName || 'Outreach Area'}
                    </span>
                    <span className="text-slate-400 shrink-0 font-mono text-[10px]">
                      {outreach.date}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {outreach.locationArea || outreach.outreachType}
                  </p>

                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[120px]">
                      By: {outreach.submittedBy?.name || 'Field Worker'}
                    </span>
                    <span className="text-emerald-400 font-medium">Click to inspect →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* High-Resolution Lightbox Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhotoIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-scaleUp"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  {activePhoto.outreach.councilName} ·{' '}
                  {activePhoto.outreach.governorshipName || 'Governorship'} ·{' '}
                  {activePhoto.outreach.bacentaName || 'Bacenta'}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  ({activePhotoIndex! + 1} of {filteredPictures.length})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activePhoto.attachment.previewUrl && (
                  <a
                    href={activePhoto.attachment.previewUrl}
                    download={activePhoto.attachment.name || 'outreach_photo.jpg'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Download / Open Full Photo"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setActivePhotoIndex(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Image & Navigation */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[300px] max-h-[55vh]">
              <img
                src={
                  activePhoto.attachment.previewUrl ||
                  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80'
                }
                alt={activePhoto.attachment.name || 'Outreach Photo'}
                className="max-h-[55vh] max-w-full object-contain mx-auto"
              />

              {/* Prev / Next buttons */}
              {filteredPictures.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 border border-slate-700 hover:border-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                    title="Previous Picture"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 border border-slate-700 hover:border-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                    title="Next Picture"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer: Detailed Outreach Information */}
            <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-3 overflow-y-auto max-h-48 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Souls Won
                  </span>
                  <span className="text-base font-extrabold text-amber-300">
                    +{activePhoto.outreach.soulsWonCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Leaders Present
                  </span>
                  <span className="text-base font-extrabold text-blue-400">
                    {activePhoto.outreach.leadersPresentCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Outreach Date
                  </span>
                  <span className="text-xs font-bold text-white block mt-0.5">
                    {activePhoto.outreach.date}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Operation Type
                  </span>
                  <span className="text-xs font-bold text-white block mt-0.5 truncate">
                    {activePhoto.outreach.outreachType}
                  </span>
                </div>
              </div>

              {/* Location and Submitter notes */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span>
                    Location:{' '}
                    <strong className="text-slate-200">
                      {activePhoto.outreach.locationArea || 'Not specified'}
                    </strong>
                  </span>
                  <span>
                    Captured & Submitted by:{' '}
                    <strong className="text-slate-200">
                      {activePhoto.outreach.submittedBy?.name} (
                      {activePhoto.outreach.submittedBy?.email})
                    </strong>
                  </span>
                </div>

                {activePhoto.outreach.notes && (
                  <p className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed italic">
                    "{activePhoto.outreach.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
