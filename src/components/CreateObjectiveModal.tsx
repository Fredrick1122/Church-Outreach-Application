import React, { useState } from 'react';
import { Target, X, Calendar, Building2, Users, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile, FieldObjective } from '../types';
import { getCouncils } from '../services/storage';
import { createFieldObjective } from '../services/realtime';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onObjectiveCreated?: (objective: FieldObjective) => void;
}

export const CreateObjectiveModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onObjectiveCreated,
}) => {
  const councils = ['All Councils', ...getCouncils()];

  const [title, setTitle] = useState('Operation Great Harvest: 5,000 Souls Blitz');
  const [targetCouncil, setTargetCouncil] = useState('All Councils');
  const [targetSouls, setTargetSouls] = useState<number>(5000);
  const [targetLeaders, setTargetLeaders] = useState<number>(50);
  const [priority, setPriority] = useState<'urgent' | 'high' | 'standard'>('urgent');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [instructions, setInstructions] = useState(
    'Kingdom mobilization across all councils: Personal evangelism, street invasions, and convert discipleship follow-up to achieve the 5,000 souls harvest goal.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the field objective.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const objective = await createFieldObjective(
        {
          title: title.trim(),
          targetCouncil,
          targetSouls: Number(targetSouls) || 5000,
          targetLeaders: Number(targetLeaders) || 50,
          priority,
          deadline,
          instructions: instructions.trim(),
        },
        currentUser
      );

      if (onObjectiveCreated) {
        onObjectiveCreated(objective);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch field objective.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Establish Field Objective
              </h3>
              <p className="text-xs text-slate-400">
                Dispatches real-time target notifications to all assigned field leaders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Objective Title / Mission Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Street Invasion & Busstop Harvest Blitz"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Target Council & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Target Council *
              </label>
              <select
                value={targetCouncil}
                onChange={(e) => setTargetCouncil(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
              >
                {councils.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Priority Tier *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
              >
                <option value="urgent">Urgent Priority (Immediate Mobilization)</option>
                <option value="high">High Priority</option>
                <option value="standard">Standard Priority</option>
              </select>
            </div>
          </div>

          {/* Target Souls, Target Leaders, Deadline */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Target Souls
              </label>
              <input
                type="number"
                min={1}
                required
                value={targetSouls}
                onChange={(e) => setTargetSouls(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Target Leaders
              </label>
              <input
                type="number"
                min={1}
                value={targetLeaders}
                onChange={(e) => setTargetLeaders(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Deadline Date
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium"
              />
            </div>
          </div>

          {/* Operational Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Directives & Field Guidance
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide strategic instructions, targeted meeting locations, prayer points, and mobilization directives for leaders..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Live Notification Preview Notice */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Upon submission, a <strong>real-time WebSocket event & audio chime</strong> will immediately alert all leaders in <strong>{targetCouncil}</strong>.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Objective'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
