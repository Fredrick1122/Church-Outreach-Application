import React, { useState } from 'react';
import { X, UserCheck, Plus, Check, Search, ShieldCheck } from 'lucide-react';
import { LeaderAttendance } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadersList: LeaderAttendance[];
  onUpdateLeaders: (updated: LeaderAttendance[]) => void;
  currentCouncil: string;
}

export const LeaderTrackingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  leadersList,
  onUpdateLeaders,
  currentCouncil,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderRole, setNewLeaderRole] = useState('Outreach Member');

  if (!isOpen) return null;

  const toggleLeader = (id: string) => {
    const updated = leadersList.map((lead) =>
      lead.id === id ? { ...lead, isPresent: !lead.isPresent } : lead
    );
    onUpdateLeaders(updated);
  };

  const handleAddNewLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderName.trim()) return;

    const newLead: LeaderAttendance = {
      id: `lead_${Date.now()}`,
      name: newLeaderName.trim(),
      role: newLeaderRole,
      council: currentCouncil,
      isPresent: true,
      soulsWitnessed: 0,
    };

    onUpdateLeaders([...leadersList, newLead]);
    setNewLeaderName('');
  };

  const filteredLeaders = leadersList.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = leadersList.filter((l) => l.isPresent).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white text-base">Automated Leader & Member Tracking</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mark who participated in this outreach ({presentCount} present)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leader by name or ministry role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Leaders List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredLeaders.map((lead) => (
            <div
              key={lead.id}
              onClick={() => toggleLeader(lead.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                lead.isPresent
                  ? 'border-emerald-600/80 bg-emerald-950/30 text-white'
                  : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    lead.isPresent
                      ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {lead.isPresent && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${lead.isPresent ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {lead.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lead.role} · {lead.council}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    lead.isPresent
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {lead.isPresent ? 'Present' : 'Absent'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Quick New Leader */}
        <form onSubmit={handleAddNewLeader} className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <input
            type="text"
            placeholder="Add new leader/member name..."
            value={newLeaderName}
            onChange={(e) => setNewLeaderName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <select
            value={newLeaderRole}
            onChange={(e) => setNewLeaderRole(e.target.value)}
            className="px-2 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300"
          >
            <option value="Bacenta Leader">Bacenta Leader</option>
            <option value="Field Evangelist">Field Evangelist</option>
            <option value="Youth Leader">Youth Leader</option>
            <option value="Outreach Member">Outreach Member</option>
          </select>
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900">
          <span className="text-xs text-slate-400">
            Total Selected: <strong className="text-emerald-400">{presentCount} Leaders</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Apply Attendance ({presentCount})
          </button>
        </div>
      </div>
    </div>
  );
};
