import React, { useState } from 'react';
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
  Share2,
} from 'lucide-react';
import { playNotificationChime } from '../services/realtime';

export interface ScriptureMotivation {
  reference: string;
  text: string;
  theme: string;
  exhortation: string;
  prayer: string;
}

const DEFAULT_SCRIPTURES: ScriptureMotivation[] = [
  {
    reference: 'Proverbs 11:30',
    text: 'The fruit of the righteous is a tree of life; and he that winneth souls is wise.',
    theme: 'Soul Winning & Eternal Wisdom',
    exhortation: 'Every soul you witness to is an eternal triumph over darkness. Winning souls into the kingdom of light is the highest calling and truest wisdom. Step out with divine confidence for the 5,000 Souls Great Harvest!',
    prayer: 'Lord Jesus, grant me heavenly wisdom, compassionate boldness, and utterance to win precious souls today.',
  },
  {
    reference: 'Matthew 28:19-20',
    text: 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.',
    theme: 'The Apostolic Great Commission',
    exhortation: 'You never walk the outreach fields alone. The King of Kings goes before you with all authority in heaven and earth. Speak Christ with bold, unshakable faith!',
    prayer: 'Lord Jesus, empower every field evangelist and overseer across all councils to proclaim Your word without fear.',
  },
  {
    reference: 'John 10:11, 14',
    text: 'I am the good shepherd: the good shepherd giveth his life for the sheep... I know my sheep, and am known of mine.',
    theme: 'Apostolic Shepherding & Bacenta Care',
    exhortation: 'Winning souls is the beginning; shepherding them with patient love and discipleship establishes the kingdom. Follow up with tenderness, prayer, and spiritual vigilance.',
    prayer: 'Holy Spirit, give our governors and bacenta leaders the heart of the Good Shepherd to nurse and establish every new convert.',
  },
  {
    reference: 'Daniel 12:3',
    text: 'And they that be wise shall shine as the brightness of the firmament; and they that turn many to righteousness as the stars for ever and ever.',
    theme: 'Eternal Reward of Soul Winners',
    exhortation: 'Earthly rewards fade away, but those who turn many to righteousness will shine as luminous stars across eternity. Your labor in the harvest field is never in vain!',
    prayer: 'Father, ignite an unquenchable fire in our spirits to turn multitudes unto righteousness.',
  },
  {
    reference: 'Acts 1:8',
    text: 'But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.',
    theme: 'Supernatural Power for the Streets',
    exhortation: 'You do not minister by human wisdom, but with the divine power of the Holy Ghost. Go into every neighborhood expecting miracles, convictions, and changed lives!',
    prayer: 'Almighty God, release Pentecostal boldness and demonstration of the Holy Spirit on every team today.',
  },
  {
    reference: 'John 21:15-17',
    text: 'He saith unto him, Feed my lambs... Feed my sheep.',
    theme: 'The Shepherd’s Sacred Trust',
    exhortation: 'The purest demonstration of our love for Christ is faithful shepherd-care over His flock. Call, visit, and pray over every convert on your roster until they are established.',
    prayer: 'Lord, give us persistent love to follow up on every convert until Christ is formed in them.',
  },
  {
    reference: 'Luke 15:7',
    text: 'I say unto you, that likewise joy shall be in heaven over one sinner that repenteth, more than over ninety and nine just persons, which need no repentance.',
    theme: 'Joy in the Courts of Heaven',
    exhortation: 'Every single soul led to repentance triggers celebratory joy in heaven! Let us cause heaven to rejoice abundantly through our harvest blitz today!',
    prayer: 'Lord, make our teams instruments of great heavenly joy as we bring sinners to repentance.',
  },
  {
    reference: '2 Timothy 4:2, 5',
    text: 'Preach the word; be instant in season, out of season... do the work of an evangelist, make full proof of thy ministry.',
    theme: 'Uncompromising Field Endurance',
    exhortation: 'Whether people welcome the word or hesitate, preach Christ with unyielding love. Fulfill your ministry and take your place in the harvest workforce!',
    prayer: 'Lord, make us steadfast and unmovable in preaching the gospel in every season.',
  },
  {
    reference: 'Psalm 126:5-6',
    text: 'They that sow in tears shall reap in joy. He that goeth forth and weepeth, bearing precious seed, shall doubtless come again with rejoicing, bringing his sheaves with him.',
    theme: 'The Law of the Harvest',
    exhortation: 'Every prayer, every tear shed for lost souls, and every tract handed out is eternal seed. The harvest is guaranteed by God’s covenant promise!',
    prayer: 'Father, let every seed sown by our field teams produce a hundredfold harvest into the house of God.',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalSoulsHarvested?: number;
}

export const AiScriptureMotivationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  totalSoulsHarvested = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentMotivation, setCurrentMotivation] = useState<ScriptureMotivation>(
    DEFAULT_SCRIPTURES[0]
  );
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleNextScripture = () => {
    const nextIdx = (currentIndex + 1) % DEFAULT_SCRIPTURES.length;
    setCurrentIndex(nextIdx);
    setCurrentMotivation(DEFAULT_SCRIPTURES[nextIdx]);
    playNotificationChime();
  };

  const handleGenerateAi = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai-motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.motivation) {
          setCurrentMotivation(data.motivation);
          playNotificationChime();
        }
      }
    } catch (err) {
      console.warn('AI scripture generation request fallback:', err);
      handleNextScripture();
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `📖 ${currentMotivation.reference}\n"${currentMotivation.text}"\n\n🔥 Apostolic Exhortation:\n${currentMotivation.exhortation}\n\n🙏 Prayer Point:\n${currentMotivation.prayer}\n\n— Ephesians Outreach: 5,000 Souls Great Harvest`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const goalTarget = 5000;
  const progressPercent = Math.min(100, Math.round((totalSoulsHarvested / goalTarget) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-emerald-500/30 flex flex-col max-h-[92vh]">
        {/* Glowing Top Banner */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <Flame className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  Apostolic Scripture Motivation
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Evangelism, Soul Winning & Shepherding Motivation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5,000 Souls Mandate Status Bar */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">
              Operation Great Harvest Goal:
            </span>
            <strong className="text-amber-400 font-mono font-bold">5,000 Souls</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {totalSoulsHarvested} won ({progressPercent}%)
            </span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all"
                style={{ width: `${Math.max(4, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {[
            { id: 'all', label: 'All Themes', icon: Compass },
            { id: 'Soul Winning', label: 'Soul Winning', icon: Flame },
            { id: 'Evangelism', label: 'Evangelism Field Power', icon: Sparkles },
            { id: 'Shepherding', label: 'Shepherding & Flocks', icon: HeartHandshake },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <cat.icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Main Motivation Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Scripture Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-inner space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {currentMotivation.theme}
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                {currentMotivation.reference}
              </span>
            </div>

            {/* Scripture Verse Text */}
            <blockquote className="text-base sm:text-lg font-serif italic text-white leading-relaxed pl-3 border-l-2 border-emerald-500">
              &ldquo;{currentMotivation.text}&rdquo;
            </blockquote>
          </div>

          {/* Apostolic Exhortation */}
          <div className="space-y-1.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Apostolic Exhortation & Field Charge</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {currentMotivation.exhortation}
            </p>
          </div>

          {/* Daily Soul Winner Prayer Point */}
          <div className="space-y-1.5 bg-emerald-950/30 p-4 rounded-xl border border-emerald-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Soul Winner’s Daily Prayer Point</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium italic">
              &ldquo;{currentMotivation.prayer}&rdquo;
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition-colors"
              title="Copy scripture and prayer to share"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Scripture</span>
                </>
              )}
            </button>

            <button
              onClick={handleNextScripture}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors"
            >
              Next Scripture →
            </button>
          </div>

          <button
            onClick={handleGenerateAi}
            disabled={isLoadingAi}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
            <span>{isLoadingAi ? 'Generating Inspiration...' : 'Fresh AI Apostolic Word'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
