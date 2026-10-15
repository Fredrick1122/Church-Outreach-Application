import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  Flame,
  HeartHandshake,
  Compass,
  Volume2,
  VolumeX,
  Search,
  ChevronLeft,
  ChevronRight,
  Share2,
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
}

export const AiScriptureMotivationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  totalSoulsHarvested = 0,
  initialTab = 'soul_winning',
}) => {
  const [activeCategory, setActiveCategory] = useState<ScriptureCategory>(initialTab);
  const [selectedScriptureId, setSelectedScriptureId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiCustomMotivation, setAiCustomMotivation] = useState<ScriptureItem | null>(null);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveCategory(initialTab);
      setSearchQuery('');
      setAiCustomMotivation(null);
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
    let list = categoryScriptures;
    if (aiCustomMotivation && (activeCategory === 'all' || aiCustomMotivation.category === activeCategory)) {
      list = [aiCustomMotivation, ...list];
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.reference.toLowerCase().includes(q) ||
        s.text.toLowerCase().includes(q) ||
        s.theme.toLowerCase().includes(q) ||
        s.exhortation.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [categoryScriptures, aiCustomMotivation, activeCategory, searchQuery]);

  // Active scripture selection
  const currentScripture: ScriptureItem = useMemo(() => {
    if (filteredScriptures.length === 0) {
      return (
        aiCustomMotivation ||
        SCRIPTURES_ON_SOUL_WINNING[0]
      );
    }
    const found = filteredScriptures.find((s) => s.id === selectedScriptureId);
    return found || filteredScriptures[0];
  }, [filteredScriptures, selectedScriptureId, aiCustomMotivation]);

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
  }, [currentScripture.id, isOpen]);

  if (!isOpen) return null;

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
    const textToCopy = `📖 ${currentScripture.reference}
"${currentScripture.text}"

🔥 Apostolic Exhortation:
${currentScripture.exhortation}

🙏 Prayer Point:
${currentScripture.prayer}

— Ephesians Outreach • 5,000 Souls Great Harvest`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${currentScripture.reference}. ${currentScripture.text}. Exhortation: ${currentScripture.exhortation}. Prayer: ${currentScripture.prayer}`
    );
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateAi = async () => {
    setIsLoadingAi(true);
    try {
      const topicLabel =
        activeCategory === 'soul_winning'
          ? 'Soul Winning, repentance, and saving the lost'
          : activeCategory === 'evangelism'
          ? 'Evangelism field boldness, great commission, and street invasions'
          : 'Shepherding, bacenta discipleship, and convert care';

      const res = await fetch('/api/ai-motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory === 'all' ? 'Soul Winning' : activeCategory,
          customTopic: topicLabel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.motivation) {
          const newAiItem: ScriptureItem = {
            id: `ai_${Date.now()}`,
            category: activeCategory === 'all' ? 'soul_winning' : activeCategory,
            reference: data.motivation.reference || 'Scripture Inspiration',
            book: 'Holy Bible',
            text: data.motivation.text || '',
            theme: data.motivation.theme || 'Fresh Apostolic Revelation',
            exhortation: data.motivation.exhortation || '',
            prayer: data.motivation.prayer || '',
            tags: ['AI Revelation', 'Fresh Word'],
          };
          setAiCustomMotivation(newAiItem);
          setSelectedScriptureId(newAiItem.id);
          playNotificationChime();
        }
      }
    } catch (err) {
      console.warn('AI scripture generation request fallback:', err);
      handleNext();
    } finally {
      setIsLoadingAi(false);
    }
  };

  const goalTarget = 5000;
  const progressPercent = Math.min(100, Math.round((totalSoulsHarvested / goalTarget) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-500/30 flex flex-col max-h-[92vh]">
        {/* Glowing Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-amber-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/50 shrink-0">
              <Flame className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  Apostolic Scripture Portal
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  Live Word
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Scriptures on Soul Winning, Evangelism, and Shepherding Discipleship
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5,000 Souls Mandate Status Banner */}
        <div className="px-5 py-2.5 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Operation 5,000 Souls Great Harvest:</span>
            <strong className="text-amber-300 font-mono font-bold">{totalSoulsHarvested} won</strong>
            <span className="text-slate-500">({progressPercent}% reached)</span>
          </div>

          <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* The Alive Category Navigation Tabs */}
        <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('soul_winning')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'soul_winning'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-950 ring-1 ring-amber-400/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="truncate">Soul Winning</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeCategory === 'soul_winning' ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {SCRIPTURES_ON_SOUL_WINNING.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('evangelism')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'evangelism'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950 ring-1 ring-emerald-400/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="truncate">Evangelism</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeCategory === 'evangelism' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {SCRIPTURES_ON_EVANGELISM.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('shepherding')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'shepherding'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-950 ring-1 ring-teal-400/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-teal-200 shrink-0" />
            <span className="truncate">Shepherding</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeCategory === 'shepherding' ? 'bg-teal-700 text-teal-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {SCRIPTURES_ON_SHEPHERDING.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-950 ring-1 ring-purple-400/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-200 shrink-0" />
            <span className="truncate">All Scriptures</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeCategory === 'all' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {ALL_SCRIPTURES.length}
            </span>
          </button>
        </div>

        {/* Quick Search and Verse Navigation Strip */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCategory === 'soul_winning' ? 'soul winning' : activeCategory === 'evangelism' ? 'evangelism' : 'all'} scriptures by book or keyword...`}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-emerald-500"
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
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="Previous verse"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={filteredScriptures.length <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="Next verse"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Scripture Selector Chips */}
        <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
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
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {item.reference}
              </button>
            );
          })}
        </div>

        {/* Main Motivation Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Scripture Verse Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/40 shadow-inner space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {currentScripture.theme}
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-700 shadow-xs">
                {currentScripture.reference}
              </span>
            </div>

            {/* Scripture Verse Text */}
            <blockquote className="text-base sm:text-xl font-serif italic text-white leading-relaxed pl-3.5 border-l-4 border-emerald-500 font-medium">
              &ldquo;{currentScripture.text}&rdquo;
            </blockquote>

            {/* Tags strip */}
            {currentScripture.tags && (
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {currentScripture.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Apostolic Exhortation & Field Charge */}
          <div className="space-y-1.5 bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-200 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Apostolic Exhortation & Field Charge</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-semibold">
              {currentScripture.exhortation}
            </p>
          </div>

          {/* Soul Winner & Evangelist Warfare Prayer */}
          <div className="space-y-1.5 bg-emerald-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-800/80 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Soul Winner’s Warfare & Harvest Prayer</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-bold italic leading-relaxed">
              &ldquo;{currentScripture.prayer}&rdquo;
            </p>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Audio Read-Aloud */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-600 border-amber-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
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
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Copy Scripture */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy scripture and prayer to share"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Scripture</span>
                </>
              )}
            </button>

            {/* Next Scripture */}
            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/80 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fresh AI Word */}
          <button
            type="button"
            onClick={handleGenerateAi}
            disabled={isLoadingAi}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-950 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
            <span>
              {isLoadingAi
                ? 'Generating Inspiration...'
                : activeCategory === 'soul_winning'
                ? 'Fresh Soul Winning Word'
                : activeCategory === 'evangelism'
                ? 'Fresh Evangelism Word'
                : 'Fresh Apostolic Word'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
