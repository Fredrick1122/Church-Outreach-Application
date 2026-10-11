export type UserRole = 'admin' | 'governor' | 'leader';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  council: string;
  avatarInitials: string;
  avatarColor: string;
  phone?: string;
}

export type OutreachLevel = 'Bacentas' | 'Governorships' | 'Overseership';

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
  isPresent: boolean;
  soulsWitnessed?: number;
}

export interface OutreachEntry {
  id: string;
  date: string;
  councilName: string;
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
  createdAt: string;
  updatedAt: string;
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
