export type UserRole =
  | 'admin'
  | 'general_overseer'
  | 'council_overseer'
  | 'overseer' // backward-compat alias for council_overseer
  | 'governor'
  | 'leader';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  council: string; // 'All Councils' | 'Ephesians 1' to 'Ephesians 5'
  governorship?: string; // Assigned Governorship under the Council
  bacenta?: string; // Assigned Bacenta under the Governorship
  avatarInitials: string;
  avatarColor: string;
  phone?: string;
  createdAt?: string;
}

export function isGeneralOverseer(role?: string): boolean {
  return role === 'admin' || role === 'general_overseer';
}

export function isCouncilOverseer(role?: string): boolean {
  return role === 'council_overseer' || role === 'overseer';
}

export function isGovernor(role?: string): boolean {
  return role === 'governor';
}

export function isLeader(role?: string): boolean {
  return role === 'leader';
}

export function isOverseer(role?: string): boolean {
  return isGeneralOverseer(role) || isCouncilOverseer(role);
}

export type OutreachLevel = 'Bacentas' | 'Governorships' | 'Councils' | 'Overseership';

export type OutreachType =
  | 'Door to Door / 1 v 1'
  | 'Busstop'
  | 'Street Invasion / Stomp the Yard'
  | 'Crusade'
  | 'Dance Outreach'
  | 'Other';

export interface ConvertRecord {
  id: string;
  fullName: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  ageGroup: 'Youth (<18)' | 'Young Adult (18-30)' | 'Adult (31-50)' | 'Senior (50+)';
  decision: 'Born Again' | 'Rededicated' | 'First Time Visitor' | 'Prayer Request';
  needsFollowUp: boolean;
  followUpStatus: 'Uncontacted' | 'First Call Made' | 'Bacenta Assigned' | 'In Church';
  addressOrArea?: string;
  governorshipAssigned?: string;
  bacentaAssigned?: string;
  notes?: string;
  createdAt: string;
}

export interface AttachmentInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  previewUrl?: string;
}

export interface LeaderAttendance {
  id: string;
  name: string;
  role: string;
  council: string;
  governorship?: string;
  bacenta?: string;
  isPresent: boolean;
  soulsWitnessed?: number;
}

export interface OutreachEntry {
  id: string;
  date: string;
  councilName: string; // Council (Ephesians 1 to 5)
  governorshipName?: string; // Governorship under this Council
  bacentaName?: string; // Bacenta under this Governorship
  outreachLevel: OutreachLevel;
  outreachType: OutreachType;
  otherTypeDetail?: string;
  leadersPresentCount: number;
  soulsWonCount: number;
  locationArea?: string;
  leadersList: LeaderAttendance[];
  converts: ConvertRecord[];
  attachments: AttachmentInfo[];
  notes?: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  syncStatus: 'synced' | 'pending';
  syncedAt?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    id: string;
    name: string;
    approvedAt: string;
    comment?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FieldObjective {
  id: string;
  title: string;
  targetCouncil: string; // 'All Councils' | 'Ephesians 1' ... 'Ephesians 5'
  targetSouls: number;
  targetLeaders?: number;
  priority: 'urgent' | 'high' | 'standard';
  deadline: string;
  instructions: string;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}

export interface LiveNotification {
  id: string;
  type: 'objective_created' | 'outreach_approved' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole?: UserRole | 'all';
  targetCouncil?: string;
  targetUserId?: string;
  metadata?: {
    objectiveId?: string;
    outreachId?: string;
    councilName?: string;
    targetSouls?: number;
    approvedBy?: string;
  };
}

export interface SystemAlert {
  id: string;
  severity: 'warning' | 'celebration' | 'info';
  title: string;
  message: string;
  timestamp: string;
  actionText?: string;
  read: boolean;
  relatedCouncil?: string;
}

export interface FilterState {
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  council: string;
  outreachLevel: string;
  outreachType: string;
  searchQuery: string;
}

export interface SyncAuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLOUD_SYNC' | 'OFFLINE_CACHE';
  details: string;
  status: 'SUCCESS' | 'QUEUED';
}
