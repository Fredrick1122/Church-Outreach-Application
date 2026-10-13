import { OutreachEntry, UserProfile, LeaderAttendance } from '../types';

// The ONLY pre-configured administrative account as instructed:
// All mock general overseers, council overseers, governors, and bacenta leaders are removed.
export const SYSTEM_USERS: UserProfile[] = [
  {
    id: 'user_admin_1',
    name: 'Fredrick Dogbatsey',
    email: 'dogbatseyfredrick.com',
    password: 'password123',
    role: 'admin',
    roleTitle: 'Lead Operations Admin',
    council: 'All Councils',
    avatarInitials: 'FD',
    avatarColor: 'bg-teal-600',
    phone: '+233 24 412 8990',
  },
];

// Initial Councils (Ephesians 1 to 5) - More councils can be added dynamically
export const COUNCILS_LIST: string[] = [
  'Ephesians 1',
  'Ephesians 2',
  'Ephesians 3',
  'Ephesians 4',
  'Ephesians 5',
];

// Governorships start empty - to be registered and added by leadership
export const INITIAL_GOVERNORSHIPS_BY_COUNCIL: Record<string, string[]> = {
  'Ephesians 1': [],
  'Ephesians 2': [],
  'Ephesians 3': [],
  'Ephesians 4': [],
  'Ephesians 5': [],
};

// Bacentas start empty - to be registered and added by leadership
export const INITIAL_BACENTAS_BY_GOVERNORSHIP: Record<string, string[]> = {};
export const INITIAL_BACENTAS_BY_COUNCIL: Record<string, string[]> = {};

// Initial Leaders pool contains only the active Admin
export const INITIAL_LEADERS_POOL: LeaderAttendance[] = [
  {
    id: 'lead_1',
    name: 'Fredrick Dogbatsey',
    role: 'Operations Admin',
    council: 'All Councils',
    isPresent: false,
    soulsWitnessed: 0,
  },
];

// Empty outreach ledger ready for genuine entries
export const INITIAL_OUTREACHES: OutreachEntry[] = [];
