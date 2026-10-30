import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Copy,
  Check,
  Flame,
  HeartHandshake,
  Compass,
  Volume2,
  VolumeX,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { playNotificationChime } from '../services/realtime';
import {
  ScriptureItem,
  SCRIPTURES_ON_SOUL_WINNING,
  SCRIPTURES_ON_EVANGELISM,
  SCRIPTURES_ON_SHEPHERDING,
  ALL_SCRIPTURES,
} from '../data/scripturesData';

export type ScriptureCategory = 'soul_winning' | 'evangelism' | 'shepherding' | 'all';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalSoulsHarvested?: number;
  initialTab?: ScriptureCategory;
  theme?: 'dark' | 'light';
}

export const ScriptureMotivationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  totalSoulsHarvested = 0,
  initialTab = 'soul_winning',
  theme = 'dark',
}) => {
  const [activeCategory, setActiveCategory] = useState<ScriptureCategory>(initialTab);
  const [selectedScriptureId, setSelectedScriptureId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isLight = theme === 'light';

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveCategory(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Determine current list based on category
  const categoryScriptures = useMemo(() => {
    switch (activeCategory) {
      case 'soul_winning':
        return SCRIPTURES_ON_SOUL_WINNING;
      case 'evangelism':
        return SCRIPTURES_ON_EVANGELISM;
      case 'shepherding':
        return SCRIPTURES_ON_SHEPHERDING;
      default:
        return ALL_SCRIPTURES;
    }
  }, [activeCategory]);

  // Filter with search
  const filteredScriptures = useMemo(() => {
    if (!searchQuery.trim()) return categoryScriptures;
    const q = searchQuery.toLowerCase().trim();
    return categoryScriptures.filter(
      (s) =>
        s.reference.toLowerCase().includes(q) ||
        s.text.toLowerCase().includes(q) ||
        s.theme.toLowerCase().includes(q) ||
        s.exhortation.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [categoryScriptures, searchQuery]);

  // Active scripture selection
  const currentScripture: ScriptureItem = useMemo(() => {
    if (filteredScriptures.length === 0) {
      return SCRIPTURES_ON_SOUL_WINNING[0];
    }
    const found = filteredScriptures.find((s) => s.id === selectedScriptureId);
    return found || filteredScriptures[0];
  }, [filteredScriptures, selectedScriptureId]);

  // Set default selection when category changes
  useEffect(() => {
    if (filteredScriptures.length > 0) {
      setSelectedScriptureId(filteredScriptures[0].id);
    }
  }, [activeCategory, filteredScriptures]);

  // Stop speech when closing or changing verse
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentScripture?.id, isOpen]);

  if (!isOpen || !currentScripture) return null;

  const currentIndex = filteredScriptures.findIndex((s) => s.id === currentScripture.id);

  const handleNext = () => {
    if (filteredScriptures.length <= 1) return;
    const nextIdx = (currentIndex + 1) % filteredScriptures.length;
    setSelectedScriptureId(filteredScriptures[nextIdx].id);
    playNotificationChime();
  };

  const handlePrev = () => {
    if (filteredScriptures.length <= 1) return;
    const prevIdx = (currentIndex - 1 + filteredScriptures.length) % filteredScriptures.length;
    setSelectedScriptureId(filteredScriptures[prevIdx].id);
    playNotificationChime();
  };

  const handleTabChange = (cat: ScriptureCategory) => {
    setActiveCategory(cat);
    setSearchQuery('');
    playNotificationChime();
  };

  const handleCopy = () => {
    const textToCopy = `${currentScripture.reference}
"${currentScripture.text}"

Pastoral Exhortation:
${currentScripture.exhortation}

Prayer Focus:
${currentScripture.prayer}

Source: Ephesians Outreach - ephesiansoutreach.org`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${currentScripture.reference}. ${currentScripture.text}. Pastoral exhortation: ${currentScripture.exhortation}. Prayer: ${currentScripture.prayer}`
    );
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleRandomize = () => {
    if (filteredScriptures.length <= 1) return;
    let randomIdx = Math.floor(Math.random() * filteredScriptures.length);
    if (randomIdx === currentIndex) {
      randomIdx = (randomIdx + 1) % filteredScriptures.length;
    }
    setSelectedScriptureId(filteredScriptures[randomIdx].id);
    playNotificationChime();
  };

  const goalTarget = 5000;
  const progressPercent = Math.min(100, Math.round((totalSoulsHarvested / goalTarget) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border flex flex-col max-h-[92vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base sm:text-lg tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Scripture & Pastoral Exhortations
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800 uppercase tracking-wider">
                  Holy Scripture
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Biblical foundations for soul winning, field evangelism, and pastoral shepherding
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors ${
              isLight
                ? 'border-slate-200 hover:bg-slate-100 text-slate-600'
                : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5,000 Souls Target Status */}
        <div
          className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Operation 5,000 Souls Harvest Progress:</span>
            <strong className="text-emerald-500 font-mono font-bold">{totalSoulsHarvested} recorded</strong>
            <span className="text-slate-500">({progressPercent}% of target)</span>
          </div>

          <div className="w-32 h-2 bg-slate-800 rounded-md overflow-hidden border border-slate-700">
            <div
              className="h-full bg-emerald-500 rounded-md transition-all duration-300"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Category Filter Controls */}
        <div
          className={`p-2 border-b grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-semibold ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => handleTabChange('soul_winning')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
              activeCategory === 'soul_winning'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Soul Winning</span>
            <span className="text-[10px] font-mono opacity-80">
              ({SCRIPTURES_ON_SOUL_WINNING.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('evangelism')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
              activeCategory === 'evangelism'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Evangelism</span>
            <span className="text-[10px] font-mono opacity-80">
              ({SCRIPTURES_ON_EVANGELISM.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('shepherding')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
              activeCategory === 'shepherding'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Shepherding</span>
            <span className="text-[10px] font-mono opacity-80">
              ({SCRIPTURES_ON_SHEPHERDING.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">All Verses</span>
            <span className="text-[10px] font-mono opacity-80">
              ({ALL_SCRIPTURES.length})
            </span>
          </button>
        </div>

        {/* Search & Navigation Strip */}
        <div
          className={`px-5 py-2.5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scriptures by book, verse, or keyword..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">
              Verse {currentIndex + 1} of {filteredScriptures.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={filteredScriptures.length <= 1}
                className={`p-1.5 rounded-lg border text-slate-300 disabled:opacity-40 transition-colors ${
                  isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
                title="Previous verse"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={filteredScriptures.length <= 1}
                className={`p-1.5 rounded-lg border text-slate-300 disabled:opacity-40 transition-colors ${
                  isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
                title="Next verse"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scripture Selector Row */}
        <div
          className={`px-4 sm:px-5 py-2.5 border-b flex flex-wrap items-center gap-1.5 text-[11px] ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
          }`}
        >
          {filteredScriptures.map((item) => {
            const isSelected = item.id === currentScripture.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedScriptureId(item.id);
                  playNotificationChime();
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer border text-center ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.reference}
              </button>
            );
          })}
        </div>

        {/* Scripture Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Main Verse Box */}
          <div
            className={`p-5 sm:p-6 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {currentScripture.theme}
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                {currentScripture.reference}
              </span>
            </div>

            {/* Scripture Verse Text */}
            <blockquote className={`text-base sm:text-lg font-serif italic leading-relaxed pl-3 border-l-2 border-emerald-500 ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              &ldquo;{currentScripture.text}&rdquo;
            </blockquote>

            {/* Metadata Tags */}
            {currentScripture.tags && (
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {currentScripture.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                      isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pastoral Exhortation */}
          <div
            className={`p-4 sm:p-5 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-slate-200'
            }`}>
              <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Pastoral Exhortation & Field Charge</span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {currentScripture.exhortation}
            </p>
          </div>

          {/* Prayer Focus */}
          <div
            className={`p-4 sm:p-5 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/80'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Soul Winner Prayer Focus</span>
            </div>
            <p className={`text-xs sm:text-sm italic leading-relaxed ${isLight ? 'text-emerald-950 font-medium' : 'text-emerald-100'}`}>
              &ldquo;{currentScripture.prayer}&rdquo;
            </p>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div
          className={`p-4 sm:px-6 border-t flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {/* Audio Reading */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Listen to scripture reading"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Copy Scripture */}
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Copy scripture and prayer to share"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Scripture</span>
                </>
              )}
            </button>

            {/* Next Verse */}
            <button
              type="button"
              onClick={handleNext}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Random Exhortation */}
          <button
            type="button"
            onClick={handleRandomize}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Next Exhortation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
