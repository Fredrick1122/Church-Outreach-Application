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
  passwordHash?: string;
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

export function isAdmin(role?: string): boolean {
  return role === 'admin';
}

export function isGeneralOverseer(role?: string): boolean {
  return role === 'general_overseer';
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

export function hasFullAccess(role?: string): boolean {
  return role === 'admin';
}

export interface HierarchyTier {
  role: UserRole;
  level: number;
  label: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
}

export const HIERARCHY_TIERS: HierarchyTier[] = [
  {
    role: 'leader',
    level: 1,
    label: 'Bacenta Leader / Field Evangelist',
    badgeColor: 'text-amber-300',
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-800/80',
    description: 'Local Bacenta outreach and soul winning cell leadership',
  },
  {
    role: 'governor',
    level: 2,
    label: 'Governor / Governorship Pastor',
    badgeColor: 'text-blue-300',
    badgeBg: 'bg-blue-950/60',
    badgeBorder: 'border-blue-800/80',
    description: 'Jurisdictional oversight over all bacentas in assigned Governorship',
  },
  {
    role: 'council_overseer',
    level: 3,
    label: 'Council Overseer',
    badgeColor: 'text-indigo-300',
    badgeBg: 'bg-indigo-950/60',
    badgeBorder: 'border-indigo-800/80',
    description: 'Pastoral oversight over assigned Council (Ephesians 1 to 5)',
  },
  {
    role: 'general_overseer',
    level: 4,
    label: 'General Overseer',
    badgeColor: 'text-purple-300',
    badgeBg: 'bg-purple-950/60',
    badgeBorder: 'border-purple-800/80',
    description: 'Apostolic oversight across all Councils & Governorships',
  },
  {
    role: 'admin',
    level: 5,
    label: 'Lead Admin / Admin',
    badgeColor: 'text-emerald-300',
    badgeBg: 'bg-emerald-950/60',
    badgeBorder: 'border-emerald-800/80',
    description: 'Platform master administrator with full unrestricted access to everything',
  },
];

export function getHierarchyTier(role?: string): HierarchyTier {
  const normRole = role === 'overseer' ? 'council_overseer' : role;
  return HIERARCHY_TIERS.find((t) => t.role === normRole) || HIERARCHY_TIERS[0];
}

export function getHierarchyLevel(role?: string): number {
  return getHierarchyTier(role).level;
}

export function getNextHigherRole(role?: string): UserRole | null {
  const currentLevel = getHierarchyLevel(role);
  if (currentLevel >= 5) return null;
  const nextTier = HIERARCHY_TIERS.find((t) => t.level === currentLevel + 1);
  return nextTier ? nextTier.role : null;
}

export function getNextLowerRole(role?: string): UserRole | null {
  const currentLevel = getHierarchyLevel(role);
  if (currentLevel <= 1) return null;
  const lowerTier = HIERARCHY_TIERS.find((t) => t.level === currentLevel - 1);
  return lowerTier ? lowerTier.role : null;
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
