import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getIsOnline, setIsOnline, getPendingSyncCount, syncPendingToCloud } from '../services/storage';

interface Props {
  onSyncComplete?: () => void;
}

export const OfflineStatusBar: React.FC<Props> = ({ onSyncComplete }) => {
  const [isOnline, setOnlineState] = useState(getIsOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const pendingCount = getPendingSyncCount();

  const toggleConnection = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    setOnlineState(newState);
    if (newState) {
      handleManualSync();
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncFeedback('Cannot sync while in Offline Mode. Switch to Online first.');
      setTimeout(() => setSyncFeedback(null), 3000);
      return;
    }
    setIsSyncing(true);
    const result = await syncPendingToCloud();
    setIsSyncing(false);
    setSyncFeedback(
      result.syncedCount > 0
        ? `Synced ${result.syncedCount} offline record(s) to cloud database!`
        : 'All records are up to date with cloud.'
    );
    if (onSyncComplete) onSyncComplete();
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  return (
    <aside aria-label="Network and synchronization status" className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode toggle & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleConnection}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/80'
                : 'bg-amber-950/80 text-amber-300 border border-amber-700/80 hover:bg-amber-900/80'
            }`}
            title="Click to toggle between Online and Simulated Offline field mode"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline Field Mode</span>
              </>
            )}
          </button>

          <span className="hidden sm:inline text-slate-400">
            {isOnline
              ? 'Real-time synchronization active'
              : 'Data saved locally to device storage'}
          </span>
        </div>

        {/* Center: Feedback notification if any */}
        {syncFeedback && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Right: Pending queue and manual sync */}
        <div className="flex items-center gap-3">
          {pendingCount > 0 ? (
            <div className="flex items-center gap-1.5 text-amber-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pendingCount} pending offline queue</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Database synced</span>
            </div>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white font-medium transition-colors ${
              !isOnline
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
