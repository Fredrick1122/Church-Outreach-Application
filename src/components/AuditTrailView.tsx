import React, { useState } from 'react';
import { Shield, Clock, Database, Cloud, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { getAuditLogs, resetAllDataToDefault } from '../services/storage';
import { UserProfile } from '../types';

interface Props {
  currentUser: UserProfile;
}

export const AuditTrailView: React.FC<Props> = ({ currentUser }) => {
  const [logs, setLogs] = useState(getAuditLogs());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetAllDataToDefault();
    setLogs(getAuditLogs());
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Cloud Synchronization & Security Audit Log
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit record of field updates, sync events, and role authorizations
          </p>
        </div>

        {(currentUser.role === 'admin' || currentUser.role === 'general_overseer') && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/70 hover:bg-rose-900/70 border border-rose-800 rounded-lg transition-colors self-start sm:self-auto"
          >
            Reset to Default
          </button>
        )}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-800">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-800/40 transition-colors flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                {log.action === 'CLOUD_SYNC' && <Cloud className="w-4 h-4 text-blue-400" />}
                {log.action === 'CREATE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {log.action === 'UPDATE' && <RefreshCw className="w-4 h-4 text-amber-400" />}
                {log.action === 'DELETE' && <KeyRound className="w-4 h-4 text-rose-400" />}
                {log.action === 'OFFLINE_CACHE' && <Database className="w-4 h-4 text-purple-400" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{log.action}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-800">
            <h3 className="font-bold text-white text-base">Reset Database to Default?</h3>
            <p className="text-xs text-slate-400">
              This will clear outreach logs and restore the official 5 Ephesians Councils and Governorships to their pristine default schema.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
