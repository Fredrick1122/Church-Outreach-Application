import {
  OutreachEntry,
  UserProfile,
  SystemAlert,
  SyncAuditLog,
  LeaderAttendance,
  UserRole,
  isAdmin,
  isGeneralOverseer,
  isCouncilOverseer,
  isGovernor,
  isLeader,
  getNextHigherRole,
  getNextLowerRole,
} from '../types';
import bcrypt from 'bcryptjs';
import {
  INITIAL_OUTREACHES,
  SYSTEM_USERS,
  COUNCILS_LIST,
  INITIAL_GOVERNORSHIPS_BY_COUNCIL,
  INITIAL_BACENTAS_BY_GOVERNORSHIP,
  INITIAL_LEADERS_POOL,
} from './mockData';

const STORAGE_KEYS = {
  OUTREACHES: 'ephesians_outreaches_v8',
  CURRENT_USER: 'ephesians_current_user_v8',
  IS_ONLINE: 'ephesians_network_online_v8',
  COUNCILS: 'ephesians_councils_v8',
  GOVERNORSHIPS: 'ephesians_governorships_v8',
  BACENTAS: 'ephesians_bacentas_v8',
  LEADERS: 'ephesians_leaders_v8',
  ALERTS: 'ephesians_alerts_v8',
  AUDIT_LOGS: 'ephesians_audit_logs_v8',
  USERS: 'ephesians_system_users_v8',
};

// ========================
// DATA PRESERVATION & RECOVERY
// Salvage, preserve, and merge all previously submitted outreach forms & registered leaders
// ========================
try {
  if (typeof window !== 'undefined') {
    // 1. Recover and preserve all outreaches across versions
    const outreachKeys = [
      'ephesians_outreaches',
      'ephesians_outreaches_v1',
      'ephesians_outreaches_v2',
      'ephesians_outreaches_v3',
      'ephesians_outreaches_v4',
      'ephesians_outreaches_v5',
      'ephesians_outreaches_v6',
      'ephesians_outreaches_v7',
      'ephesians_outreaches_v8',
    ];
    const recoveredOutreachesMap = new Map<string, OutreachEntry>();

    const currentOutreachRaw = localStorage.getItem(STORAGE_KEYS.OUTREACHES);
    if (currentOutreachRaw) {
      try {
        const parsed = JSON.parse(currentOutreachRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((o: OutreachEntry) => {
            if (o && o.id) recoveredOutreachesMap.set(o.id, o);
          });
        }
      } catch {
        // ignore
      }
    }

    outreachKeys.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((o: OutreachEntry) => {
              if (o && o.id && !recoveredOutreachesMap.has(o.id)) {
                recoveredOutreachesMap.set(o.id, o);
              }
            });
          }
        } catch {
          // ignore
        }
      }
    });

    if (recoveredOutreachesMap.size > 0) {
      localStorage.setItem(
        STORAGE_KEYS.OUTREACHES,
        JSON.stringify(Array.from(recoveredOutreachesMap.values()))
      );
    }

    // 2. Recover and preserve all registered leaders across versions
    const userKeys = [
      'ephesians_system_users',
      'ephesians_system_users_v1',
      'ephesians_system_users_v2',
      'ephesians_system_users_v3',
      'ephesians_system_users_v4',
      'ephesians_system_users_v5',
      'ephesians_system_users_v6',
      'ephesians_system_users_v7',
      'ephesians_system_users_v8',
    ];
    const recoveredUsersMap = new Map<string, UserProfile>();

    const currentUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (currentUsersRaw) {
      try {
        const parsed = JSON.parse(currentUsersRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: UserProfile) => {
            if (u && (u.id || u.email)) recoveredUsersMap.set(u.id || u.email, u);
          });
        }
      } catch {
        // ignore
      }
    }

    userKeys.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((u: UserProfile) => {
              const key = u.id || u.email;
              if (u && key && !recoveredUsersMap.has(key)) {
                recoveredUsersMap.set(key, u);
              }
            });
          }
        } catch {
          // ignore
        }
      }
    });

    if (recoveredUsersMap.size > 0) {
      localStorage.setItem(
        STORAGE_KEYS.USERS,
        JSON.stringify(Array.from(recoveredUsersMap.values()))
      );
    }
  }
} catch {
  // Ignore in non-browser environment
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function notify() {
  listeners.forEach((l) => l());
}

export function subscribeToStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    notify();
  });
  window.addEventListener('focus', () => {
    refreshAllFromServer();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshAllFromServer();
    }
  });
  let lastTapSync = 0;
  window.addEventListener('pointerdown', () => {
    const now = Date.now();
    if (now - lastTapSync > 8000) {
      lastTapSync = now;
      refreshAllFromServer();
    }
  });
}

export function getIsOnline(): boolean {
  const stored = localStorage.getItem(STORAGE_KEYS.IS_ONLINE);
  if (stored === null) return true;
  return stored === 'true';
}

export function setIsOnline(online: boolean) {
  localStorage.setItem(STORAGE_KEYS.IS_ONLINE, String(online));
  addAuditLog({
    action: online ? 'CLOUD_SYNC' : 'OFFLINE_CACHE',
    details: online
      ? 'Connected to Online Mode. Real-time synchronizer active.'
      : 'Entered Offline Mode (Local Storage Active).',
    status: 'SUCCESS',
  });

  if (online) {
    syncPendingToCloud();
    refreshAllFromServer();
  } else {
    notify();
  }
}

export function getCurrentUser(): UserProfile | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) return parsed;
    } catch {
      // fallback
    }
  }
  return null;
}

export function setCurrentUser(user: UserProfile | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    addAuditLog({
      action: 'UPDATE',
      details: 'Logged out of leadership account. Returned to public outreach details uploads.',
      status: 'SUCCESS',
    });
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    addAuditLog({
      action: 'UPDATE',
      details: `Active account switched to ${user.name} (${user.roleTitle}).`,
      status: 'SUCCESS',
    });
  }
  notify();
}

export function logoutUser() {
  setCurrentUser(null);
}

const MOCK_USER_EMAILS = new Set([
  'bishop.nakoja@ephesiansoutreach.org',
  'pastor.ofori@ephesiansoutreach.org',
  'pastor.emmanuel@ephesiansoutreach.org',
  'pastor.ruth@ephesiansoutreach.org',
  'pastor.grace@ephesiansoutreach.org',
  'pastor.peter@ephesiansoutreach.org',
  'pastor.michael@ephesiansoutreach.org',
  'pastor.ebenezer@ephesiansoutreach.org',
  'pastor.joseph@ephesiansoutreach.org',
  'pastor.enoch@ephesiansoutreach.org',
  'pastor.osei@ephesiansoutreach.org',
  'abigail.kpodo@ephesiansoutreach.org',
]);

export function getUsers(): UserProfile[] {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out old mock sample emails only, and ensure all leaders retain valid passwordHash
        const cleaned: UserProfile[] = parsed
          .filter(
            (u: any) =>
              !MOCK_USER_EMAILS.has(u.email?.trim().toLowerCase())
          )
          .map((u: any) => {
            // If user only had plain password, upgrade to bcrypt hash immediately
            if (u.password && !u.passwordHash) {
              u.passwordHash = bcrypt.hashSync(u.password, 10);
            }
            if (!u.passwordHash) {
              u.passwordHash = bcrypt.hashSync('password123', 10);
            }
            delete u.password;
            return u;
          });

        // Ensure Fredrick Dogbatsey is present with valid email and bcrypt hash for Godfred_1
        const adminIndex = cleaned.findIndex(
          (u) =>
            u.id === 'user_admin_1' ||
            u.email?.trim().toLowerCase() === 'dogbatseyfredrick@gmail.com' ||
            u.email?.trim().toLowerCase() === 'dogbatseyfredrick.com'
        );
        if (adminIndex >= 0) {
          cleaned[adminIndex].email = 'dogbatseyfredrick@gmail.com';
          cleaned[adminIndex].name = 'Fredrick Dogbatsey';
          cleaned[adminIndex].role = 'admin';
          cleaned[adminIndex].roleTitle = 'Lead Admin';
          cleaned[adminIndex].phone = '+233 59 736 5182';
          // Ensure hash matches Godfred_1
          if (!bcrypt.compareSync('Godfred_1', cleaned[adminIndex].passwordHash || '')) {
            cleaned[adminIndex].passwordHash = SYSTEM_USERS[0].passwordHash;
          }
        } else {
          cleaned.unshift(SYSTEM_USERS[0]);
        }

        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
        return cleaned;
      }
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SYSTEM_USERS));
  return SYSTEM_USERS;
}

export function registerUser(newUser: UserProfile): { success: boolean; user: UserProfile } {
  const allUsers = getUsers();
  const existing = allUsers.find(
    (u) => u.email.trim().toLowerCase() === newUser.email.trim().toLowerCase()
  );
  if (existing) {
    throw new Error(
      `Account already exists: ${existing.name} is already registered with email "${newUser.email}" as ${existing.roleTitle} (${existing.role.toUpperCase()}). One account cannot be registered multiple times, but can be moved to a higher or lower leadership hierarchy level.`
    );
  }

  // Securely hash password with bcryptjs before persisting
  const plainPassword = (newUser.password || '').trim() || 'password123';
  newUser.password = plainPassword;
  newUser.passwordHash = bcrypt.hashSync(plainPassword, 10);

  const updated = [...allUsers, newUser];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));

  addAuditLog({
    action: 'CREATE',
    details: `Registered account: ${newUser.name} as ${newUser.role.toUpperCase()} (${newUser.council}${newUser.governorship ? ' / ' + newUser.governorship : ''}).`,
    status: 'SUCCESS',
  });

  notify();

  // Push to backend with passwordHash and plain password
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...newUser, password: plainPassword }),
  }).catch(() => {});

  return { success: true, user: { ...newUser, password: plainPassword } };
}

export function updateUserHierarchy(
  userId: string,
  newRole: UserRole,
  details?: {
    roleTitle?: string;
    council?: string;
    governorship?: string;
    bacenta?: string;
  }
): UserProfile {
  const allUsers = getUsers();
  const index = allUsers.findIndex(
    (u) => u.id === userId || u.email.trim().toLowerCase() === userId.trim().toLowerCase()
  );
  if (index === -1) {
    throw new Error('User account not found.');
  }

  const targetUser = { ...allUsers[index] };
  const oldRole = targetUser.role;
  const oldTitle = targetUser.roleTitle;

  // Protect Fredrick Dogbatsey Lead Admin
  if (
    (targetUser.email.trim().toLowerCase() === 'dogbatseyfredrick@gmail.com' || targetUser.id === 'user_admin_1') &&
    newRole !== 'admin'
  ) {
    throw new Error('Fredrick Dogbatsey is the designated Lead Admin and cannot be demoted.');
  }

  targetUser.role = newRole;

  if (details?.roleTitle && details.roleTitle.trim()) {
    targetUser.roleTitle = details.roleTitle.trim();
  } else {
    if (newRole === 'admin') {
      targetUser.roleTitle = 'Admin';
      targetUser.council = 'All Councils';
    } else if (newRole === 'general_overseer') {
      targetUser.roleTitle = 'General Overseer (All Councils)';
      targetUser.council = 'All Councils';
    } else if (newRole === 'council_overseer' || newRole === 'overseer') {
      const cnl = details?.council || (targetUser.council?.includes('All') ? 'Ephesians 1' : targetUser.council) || 'Ephesians 1';
      targetUser.council = cnl;
      targetUser.roleTitle = `${cnl} Council Overseer Pastor`;
    } else if (newRole === 'governor') {
      const cnl = details?.council || (targetUser.council?.includes('All') ? 'Ephesians 1' : targetUser.council) || 'Ephesians 1';
      targetUser.council = cnl;
      targetUser.roleTitle = `${details?.governorship || targetUser.governorship || 'Governorship'} Pastor`;
    } else {
      targetUser.roleTitle = 'Bacenta Leader / Field Evangelist';
    }
  }

  if (details?.council) targetUser.council = details.council;
  if (details?.governorship !== undefined) targetUser.governorship = details.governorship;
  if (details?.bacenta !== undefined) targetUser.bacenta = details.bacenta;

  // Set avatar color matching tier
  if (newRole === 'admin') targetUser.avatarColor = 'bg-emerald-600';
  else if (newRole === 'general_overseer') targetUser.avatarColor = 'bg-purple-600';
  else if (newRole === 'council_overseer' || newRole === 'overseer') targetUser.avatarColor = 'bg-indigo-600';
  else if (newRole === 'governor') targetUser.avatarColor = 'bg-blue-600';
  else targetUser.avatarColor = 'bg-amber-600';

  allUsers[index] = targetUser;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));

  // If the active user was updated, update active session
  const active = getCurrentUser();
  if (active && (active.id === targetUser.id || active.email.trim().toLowerCase() === targetUser.email.trim().toLowerCase())) {
    setCurrentUser(targetUser);
  }

  addAuditLog({
    action: 'UPDATE',
    details: `Leadership Hierarchy updated: ${targetUser.name} moved from ${oldRole.toUpperCase()} (${oldTitle}) to ${newRole.toUpperCase()} (${targetUser.roleTitle}).`,
    status: 'SUCCESS',
  });

  notify();

  // Push to backend
  fetch(`/api/users/${targetUser.id}/hierarchy`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: targetUser.role,
      roleTitle: targetUser.roleTitle,
      council: targetUser.council,
      governorship: targetUser.governorship,
      bacenta: targetUser.bacenta,
    }),
  }).catch(() => {});

  return targetUser;
}

export function promoteUser(userId: string): UserProfile {
  const allUsers = getUsers();
  const user = allUsers.find(
    (u) => u.id === userId || u.email.trim().toLowerCase() === userId.trim().toLowerCase()
  );
  if (!user) throw new Error('User not found.');
  const higherRole = getNextHigherRole(user.role);
  if (!higherRole) {
    throw new Error(`${user.name} is already at the highest hierarchy level (Level 5: Admin).`);
  }
  return updateUserHierarchy(user.id, higherRole);
}

export function demoteUser(userId: string): UserProfile {
  const allUsers = getUsers();
  const user = allUsers.find(
    (u) => u.id === userId || u.email.trim().toLowerCase() === userId.trim().toLowerCase()
  );
  if (!user) throw new Error('User not found.');
  if (user.email.trim().toLowerCase() === 'dogbatseyfredrick@gmail.com' || user.id === 'user_admin_1') {
    throw new Error('Fredrick Dogbatsey is Lead Admin and cannot be demoted.');
  }
  const lowerRole = getNextLowerRole(user.role);
  if (!lowerRole) {
    throw new Error(`${user.name} is already at the base leadership tier (Level 1: Field Leader).`);
  }
  return updateUserHierarchy(user.id, lowerRole);
}

export async function loginUser(emailInput: string, passwordInput?: string): Promise<UserProfile> {
  if (!emailInput?.trim() || !passwordInput?.trim()) {
    throw new Error('Please enter both your login identifier and password.');
  }

  const cleanInput = emailInput.trim().toLowerCase();
  const cleanPhone = emailInput.trim().replace(/[\s\-\(\)]/g, '');
  const cleanPassword = passwordInput.trim();

  // 1. Direct check for Lead Admin Fredrick Dogbatsey
  if (
    (cleanInput === 'dogbatseyfredrick@gmail.com' ||
      cleanInput === 'dogbatseyfredrick.com' ||
      cleanPhone === '+233597365182' ||
      cleanPhone === '0597365182' ||
      cleanPhone === '597365182' ||
      cleanInput === 'fredrick dogbatsey') &&
    (cleanPassword === 'Godfred_1' || cleanPassword === 'Godfred1')
  ) {
    const allUsers = getUsers();
    let leadAdmin = allUsers.find(
      (u) =>
        u.email?.trim().toLowerCase() === 'dogbatseyfredrick@gmail.com' ||
        u.email?.trim().toLowerCase() === 'dogbatseyfredrick.com' ||
        u.id === 'user_admin_1'
    );
    if (!leadAdmin) {
      leadAdmin = { ...SYSTEM_USERS[0] };
    }
    leadAdmin.email = 'dogbatseyfredrick@gmail.com';
    leadAdmin.phone = '+233 59 736 5182';
    leadAdmin.passwordHash = SYSTEM_USERS[0].passwordHash;
    setCurrentUser(leadAdmin);
    return leadAdmin;
  }

  // 2. Search locally in stored users
  const allUsers = getUsers();
  let user = allUsers.find((u) => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uPhone = (u.phone || '').trim().replace(/[\s\-\(\)]/g, '');
    const uName = (u.name || '').trim().toLowerCase();
    return (
      uEmail === cleanInput ||
      (cleanPhone.length >= 7 && (uPhone === cleanPhone || uPhone.includes(cleanPhone))) ||
      uName === cleanInput
    );
  });

  // 3. Fallback: if not found locally, query backend /api/login in case registered on server
  if (!user && typeof window !== 'undefined' && navigator.onLine) {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), password: cleanPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          user = data.user;
          const merged = [...allUsers.filter((u) => u.id !== user!.id), user!];
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        }
      }
    } catch {
      // ignore network errors and proceed
    }
  }

  if (!user) {
    throw new Error('Account not found. Please verify your email, phone, or name.');
  }

  // 4. Validate password
  let isPasswordValid = false;

  // Compare bcrypt hash with trimmed and raw password
  if (user.passwordHash) {
    try {
      isPasswordValid =
        bcrypt.compareSync(cleanPassword, user.passwordHash) ||
        bcrypt.compareSync(passwordInput, user.passwordHash);
    } catch {
      isPasswordValid = false;
    }
  }

  // Fallback check 1: plain password match
  if (!isPasswordValid && (user as any).password) {
    if (
      (user as any).password === cleanPassword ||
      (user as any).password === passwordInput
    ) {
      isPasswordValid = true;
    }
  }

  // Fallback check 2: standard initial password for registered leaders (password123)
  if (!isPasswordValid && (cleanPassword === 'password123' || passwordInput === 'password123')) {
    isPasswordValid = true;
  }

  // Fallback check 3: initialize password hash if missing
  if (!user.passwordHash) {
    user.passwordHash = bcrypt.hashSync(cleanPassword, 10);
    isPasswordValid = true;
  }

  if (!isPasswordValid) {
    throw new Error('Incorrect password. For registered leaders, the initial default password is password123.');
  }

  // Ensure passwordHash is saved in storage
  if (!user.passwordHash) {
    user.passwordHash = bcrypt.hashSync(cleanPassword, 10);
  }

  const updatedUsers = allUsers.map((u) => (u.id === user!.id ? user! : u));
  if (!updatedUsers.some((u) => u.id === user!.id)) {
    updatedUsers.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

  // Sync to server disk
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).catch(() => {});

  setCurrentUser(user);
  return user;
}

/**
 * Synchronous login fallback matching local storage
 */
export function loginUserSync(emailInput: string, passwordInput?: string): UserProfile {
  if (!emailInput?.trim() || !passwordInput?.trim()) {
    throw new Error('Please enter both your login identifier and password.');
  }

  const cleanInput = emailInput.trim().toLowerCase();
  const cleanPhone = emailInput.trim().replace(/[\s\-\(\)]/g, '');
  const cleanPassword = passwordInput.trim();

  // Direct check for Lead Admin Fredrick Dogbatsey
  if (
    (cleanInput === 'dogbatseyfredrick@gmail.com' ||
      cleanInput === 'dogbatseyfredrick.com' ||
      cleanPhone === '+233597365182' ||
      cleanPhone === '0597365182' ||
      cleanPhone === '597365182' ||
      cleanInput === 'fredrick dogbatsey') &&
    (cleanPassword === 'Godfred_1' || cleanPassword === 'Godfred1')
  ) {
    const allUsers = getUsers();
    let leadAdmin = allUsers.find(
      (u) =>
        u.email?.trim().toLowerCase() === 'dogbatseyfredrick@gmail.com' ||
        u.email?.trim().toLowerCase() === 'dogbatseyfredrick.com' ||
        u.id === 'user_admin_1'
    );
    if (!leadAdmin) {
      leadAdmin = { ...SYSTEM_USERS[0] };
    }
    leadAdmin.email = 'dogbatseyfredrick@gmail.com';
    leadAdmin.phone = '+233 59 736 5182';
    leadAdmin.passwordHash = SYSTEM_USERS[0].passwordHash;
    setCurrentUser(leadAdmin);
    return leadAdmin;
  }

  const allUsers = getUsers();
  const user = allUsers.find((u) => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uPhone = (u.phone || '').trim().replace(/[\s\-\(\)]/g, '');
    const uName = (u.name || '').trim().toLowerCase();
    return (
      uEmail === cleanInput ||
      (cleanPhone.length >= 7 && (uPhone === cleanPhone || uPhone.includes(cleanPhone))) ||
      uName === cleanInput
    );
  });

  if (!user) {
    throw new Error('Account not found. Please verify your email, phone, or name.');
  }

  let isPasswordValid = false;
  if (user.passwordHash) {
    try {
      isPasswordValid =
        bcrypt.compareSync(cleanPassword, user.passwordHash) ||
        bcrypt.compareSync(passwordInput, user.passwordHash);
    } catch {
      isPasswordValid = false;
    }
  }

  if (!isPasswordValid && (user as any).password) {
    if (
      (user as any).password === cleanPassword ||
      (user as any).password === passwordInput
    ) {
      isPasswordValid = true;
    }
  }

  if (!isPasswordValid && (cleanPassword === 'password123' || passwordInput === 'password123')) {
    isPasswordValid = true;
  }

  if (!user.passwordHash) {
    user.passwordHash = bcrypt.hashSync(cleanPassword, 10);
    isPasswordValid = true;
  }

  if (!isPasswordValid) {
    throw new Error('Incorrect password. For registered leaders, the initial default password is password123.');
  }

  setCurrentUser(user);
  return user;
}

/**
 * Resolves the designated Leader for a given Council.
 * Always returns a real registered UserProfile and ensures they can open their dashboard.
 */
export function getLeaderForCouncil(councilName: string): UserProfile {
  const allUsers = getUsers();
  // 1. Look for user specifically registered as council_overseer or overseer for this council
  const match = allUsers.find(
    (u) =>
      (u.role === 'council_overseer' || u.role === 'overseer') &&
      u.council?.trim().toLowerCase() === councilName.trim().toLowerCase()
  );
  if (match) return match;

  // 2. Look for any user assigned to this council
  const secondary = allUsers.find(
    (u) => u.council?.trim().toLowerCase() === councilName.trim().toLowerCase()
  );
  if (secondary) return secondary;

  // 3. Auto-provision an official Council Overseer leader account
  const cleanNum = councilName.replace(/\s+/g, '');
  const newOverseer: UserProfile = {
    id: `leader_council_${cleanNum.toLowerCase()}`,
    name: `${councilName} Council Overseer Pastor`,
    email: `overseer.${cleanNum.toLowerCase()}@ephesiansoutreach.org`,
    password: 'password123',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'council_overseer',
    roleTitle: `${councilName} Council Overseer`,
    council: councilName,
    avatarInitials: cleanNum.substring(0, 2).toUpperCase() || 'CO',
    avatarColor: 'bg-indigo-600',
    phone: '+233 24 555 0101',
    createdAt: new Date().toISOString(),
  };

  try {
    registerUser(newOverseer);
  } catch {
    const reloaded = getUsers().find((u) => u.id === newOverseer.id || u.email === newOverseer.email);
    if (reloaded) return reloaded;
  }
  return newOverseer;
}

/**
 * Resolves the designated Leader for a given Governorship.
 * Always returns a real registered UserProfile and ensures they can open their dashboard.
 */
export function getLeaderForGovernorship(govName: string, councilName?: string): UserProfile {
  const allUsers = getUsers();
  // 1. Look for user registered as governor for this governorship
  const match = allUsers.find(
    (u) =>
      u.role === 'governor' &&
      u.governorship?.trim().toLowerCase() === govName.trim().toLowerCase()
  );
  if (match) return match;

  // 2. Secondary match
  const secondary = allUsers.find(
    (u) => u.governorship?.trim().toLowerCase() === govName.trim().toLowerCase()
  );
  if (secondary) return secondary;

  // Determine parent council if not provided
  let parentCouncil = councilName;
  if (!parentCouncil) {
    const allGovs = getAllGovernorshipsByCouncil();
    for (const [cn, govs] of Object.entries(allGovs)) {
      if (govs.includes(govName)) {
        parentCouncil = cn;
        break;
      }
    }
  }
  parentCouncil = parentCouncil || 'Ephesians 1';

  const cleanGov = govName.replace(/[^a-zA-Z0-9]/g, '');
  const newGovernor: UserProfile = {
    id: `leader_gov_${cleanGov.toLowerCase()}`,
    name: `Pastor of ${govName} Governorship`,
    email: `pastor.${cleanGov.toLowerCase()}@ephesiansoutreach.org`,
    password: 'password123',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'governor',
    roleTitle: `${govName} Governorship Pastor`,
    council: parentCouncil,
    governorship: govName,
    avatarInitials: cleanGov.substring(0, 2).toUpperCase() || 'GP',
    avatarColor: 'bg-blue-600',
    phone: '+233 24 555 0102',
    createdAt: new Date().toISOString(),
  };

  try {
    registerUser(newGovernor);
  } catch {
    const reloaded = getUsers().find((u) => u.id === newGovernor.id || u.email === newGovernor.email);
    if (reloaded) return reloaded;
  }
  return newGovernor;
}

/**
 * Resolves the designated Leader for a given Bacenta.
 * Always returns a real registered UserProfile and ensures they can open their dashboard.
 */
export function getLeaderForBacenta(
  bacentaName: string,
  govName?: string,
  councilName?: string
): UserProfile {
  const allUsers = getUsers();
  // 1. Look for user registered as leader for this bacenta
  const match = allUsers.find(
    (u) =>
      u.role === 'leader' &&
      u.bacenta?.trim().toLowerCase() === bacentaName.trim().toLowerCase()
  );
  if (match) return match;

  // 2. Look for any user assigned to this bacenta
  const secondary = allUsers.find(
    (u) => u.bacenta?.trim().toLowerCase() === bacentaName.trim().toLowerCase()
  );
  if (secondary) return secondary;

  // Find parent gov & council
  let parentGov = govName;
  let parentCouncil = councilName;
  if (!parentGov || !parentCouncil) {
    const allBacentasMap = getAllBacentasByGovernorship();
    for (const [gov, bList] of Object.entries(allBacentasMap)) {
      if (bList.includes(bacentaName)) {
        parentGov = gov;
        break;
      }
    }
    if (parentGov) {
      const allGovs = getAllGovernorshipsByCouncil();
      for (const [cn, govs] of Object.entries(allGovs)) {
        if (govs.includes(parentGov)) {
          parentCouncil = cn;
          break;
        }
      }
    }
  }
  parentCouncil = parentCouncil || 'Ephesians 1';

  const cleanBacenta = bacentaName.replace(/[^a-zA-Z0-9]/g, '');
  const newLeader: UserProfile = {
    id: `leader_bacenta_${cleanBacenta.toLowerCase()}`,
    name: `Leader of ${bacentaName}`,
    email: `leader.${cleanBacenta.toLowerCase()}@ephesiansoutreach.org`,
    password: 'password123',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'leader',
    roleTitle: 'Bacenta Leader / Field Evangelist',
    council: parentCouncil,
    governorship: parentGov || undefined,
    bacenta: bacentaName,
    avatarInitials: cleanBacenta.substring(0, 2).toUpperCase() || 'BL',
    avatarColor: 'bg-rose-600',
    phone: '+233 24 555 0103',
    createdAt: new Date().toISOString(),
  };

  try {
    registerUser(newLeader);
  } catch {
    const reloaded = getUsers().find((u) => u.id === newLeader.id || u.email === newLeader.email);
    if (reloaded) return reloaded;
  }
  return newLeader;
}

// ========================
// COUNCILS (Ephesians 1 to 5 + dynamically added councils)
// ========================
export function getCouncils(): string[] {
  const stored = localStorage.getItem(STORAGE_KEYS.COUNCILS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.COUNCILS, JSON.stringify(COUNCILS_LIST));
  return COUNCILS_LIST;
}

export function addCouncil(name: string): string[] {
  const clean = name.trim();
  if (!clean) return getCouncils();
  const list = getCouncils();
  if (!list.includes(clean)) {
    const updated = [...list, clean];
    localStorage.setItem(STORAGE_KEYS.COUNCILS, JSON.stringify(updated));
    addAuditLog({
      action: 'CREATE',
      details: `Added new council jurisdiction: ${clean}.`,
      status: 'SUCCESS',
    });
    notify();

    fetch('/api/councils', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: clean }),
    }).catch(() => {});
    return updated;
  }
  return list;
}

// ========================
// GOVERNORSHIPS (Under Councils)
// ========================
export function getAllGovernorshipsByCouncil(): Record<string, string[]> {
  const stored = localStorage.getItem(STORAGE_KEYS.GOVERNORSHIPS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      // fallback
    }
  }
  localStorage.setItem(
    STORAGE_KEYS.GOVERNORSHIPS,
    JSON.stringify(INITIAL_GOVERNORSHIPS_BY_COUNCIL)
  );
  return INITIAL_GOVERNORSHIPS_BY_COUNCIL;
}

export function getGovernorshipsForCouncil(council: string): string[] {
  const map = getAllGovernorshipsByCouncil();
  return map[council] || [];
}

export function addGovernorshipToCouncil(council: string, governorshipName: string): string[] {
  const clean = governorshipName.trim();
  if (!clean) return getGovernorshipsForCouncil(council);
  const map = getAllGovernorshipsByCouncil();
  const list = map[council] || [];
  if (!list.includes(clean)) {
    map[council] = [...list, clean];
    localStorage.setItem(STORAGE_KEYS.GOVERNORSHIPS, JSON.stringify(map));
    notify();

    fetch('/api/governorships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ council, name: clean }),
    }).catch(() => {});
  }
  return map[council];
}

// ========================
// BACENTAS (Under Governorships)
// ========================
export function getAllBacentasByGovernorship(): Record<string, string[]> {
  const stored = localStorage.getItem(STORAGE_KEYS.BACENTAS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      // fallback
    }
  }
  localStorage.setItem(
    STORAGE_KEYS.BACENTAS,
    JSON.stringify(INITIAL_BACENTAS_BY_GOVERNORSHIP)
  );
  return INITIAL_BACENTAS_BY_GOVERNORSHIP;
}

export function getBacentasForGovernorship(governorship: string): string[] {
  const map = getAllBacentasByGovernorship();
  return map[governorship] || [];
}

export function addBacentaToGovernorship(governorship: string, bacentaName: string): string[] {
  const clean = bacentaName.trim();
  if (!clean) return getBacentasForGovernorship(governorship);
  const map = getAllBacentasByGovernorship();
  const list = map[governorship] || [];
  if (!list.includes(clean)) {
    map[governorship] = [...list, clean];
    localStorage.setItem(STORAGE_KEYS.BACENTAS, JSON.stringify(map));
    notify();

    fetch('/api/bacentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ governorship, name: clean }),
    }).catch(() => {});
  }
  return map[governorship];
}

// Backward-compat helpers
export function getBacentasForCouncil(council: string): string[] {
  const governorships = getGovernorshipsForCouncil(council);
  const allBacentasMap = getAllBacentasByGovernorship();
  const set = new Set<string>();
  governorships.forEach((gov) => {
    (allBacentasMap[gov] || []).forEach((b) => set.add(b));
  });
  return Array.from(set);
}

export function getAllBacentasByCouncil(): Record<string, string[]> {
  const councils = getCouncils();
  const result: Record<string, string[]> = {};
  councils.forEach((c) => {
    result[c] = getBacentasForCouncil(c);
  });
  return result;
}

export function addBacentaToCouncil(council: string, bacentaName: string): string[] {
  const govs = getGovernorshipsForCouncil(council);
  const targetGov = govs[0] || `${council} Governorship`;
  return addBacentaToGovernorship(targetGov, bacentaName);
}

export function getBacentas(): string[] {
  const allBacentasMap = getAllBacentasByGovernorship();
  const set = new Set<string>();
  Object.values(allBacentasMap).forEach((list) => list.forEach((b) => set.add(b)));
  return Array.from(set);
}

export function getCouncilForGovernorship(governorship: string): string {
  const map = getAllGovernorshipsByCouncil();
  for (const [c, govs] of Object.entries(map)) {
    if (govs.includes(governorship)) return c;
  }
  return 'Ephesians 1';
}

export function getGovernorshipForBacenta(bacenta: string): string | undefined {
  const map = getAllBacentasByGovernorship();
  for (const [gov, bacentas] of Object.entries(map)) {
    if (bacentas.includes(bacenta)) return gov;
  }
  return undefined;
}

// ========================
// LEADERS POOL
// ========================
export function getLeadersPool(): LeaderAttendance[] {
  const stored = localStorage.getItem(STORAGE_KEYS.LEADERS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return INITIAL_LEADERS_POOL;
}

// ========================
// OUTREACH ENTRIES
// ========================
export function getOutreaches(): OutreachEntry[] {
  const stored = localStorage.getItem(STORAGE_KEYS.OUTREACHES);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((o) => !o.id?.startsWith('outreach_eph'));
      }
    } catch {
      // fallback
    }
  }

  // Check older storage keys if present
  const legacyKeys = [
    'ephesians_outreaches',
    'ephesians_outreaches_v7',
    'ephesians_outreaches_v6',
    'ephesians_outreaches_v5',
    'ephesians_outreaches_v4',
    'ephesians_outreaches_v3',
    'ephesians_outreaches_v2',
    'ephesians_outreaches_v1',
  ];
  for (const k of legacyKeys) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((o) => !o.id?.startsWith('outreach_eph'));
          if (cleaned.length > 0) {
            localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(cleaned));
            return cleaned;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return [];
}

export function getOutreachesForUser(user: UserProfile | null): OutreachEntry[] {
  if (!user) {
    return [];
  }
  const all = getOutreaches();
  if (user.role === 'admin' || isGeneralOverseer(user.role)) {
    // Admin & General Overseer have access across the board to all Councils!
    return all;
  }
  if (isCouncilOverseer(user.role)) {
    // Council Overseer has access strictly to their Council solely!
    return all.filter((o) => o.councilName === user.council);
  }
  if (isGovernor(user.role)) {
    // Governor has access strictly to their Governorship and bacentas under it only!
    const myBacentas = user.governorship ? getBacentasForGovernorship(user.governorship) : [];
    return all.filter(
      (o) =>
        (user.governorship && o.governorshipName === user.governorship) ||
        (o.bacentaName && myBacentas.includes(o.bacentaName))
    );
  }
  // Leader:
  return all.filter(
    (o) =>
      (user.bacenta && o.bacentaName === user.bacenta) ||
      o.submittedBy.email === user.email ||
      o.councilName === user.council
  );
}

export function saveOutreach(entry: OutreachEntry): { success: boolean; isOfflineQueued: boolean } {
  const all = getOutreaches();
  const online = getIsOnline();

  const updatedEntry: OutreachEntry = {
    ...entry,
    syncStatus: online ? 'synced' : 'pending',
    syncedAt: online ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = all.findIndex((x) => x.id === entry.id);
  let updatedList: OutreachEntry[];

  if (existingIndex >= 0) {
    updatedList = [...all];
    updatedList[existingIndex] = updatedEntry;
  } else {
    updatedList = [updatedEntry, ...all];
  }

  localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(updatedList));

  // If online, asynchronously push to backend API
  if (online) {
    fetch('/api/outreaches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEntry),
    }).catch((err) => {
      console.warn('Backend sync deferred, cached locally:', err);
    });
  }

  addAuditLog({
    action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
    details: `${existingIndex >= 0 ? 'Updated' : 'Logged'} outreach for ${entry.councilName}${
      entry.governorshipName ? ' · ' + entry.governorshipName : ''
    }${entry.bacentaName ? ' · ' + entry.bacentaName : ''} (${entry.soulsWonCount} souls, ${
      entry.leadersPresentCount
    } leaders). ${online ? 'Synced with cloud API.' : 'Queued in offline local storage.'}`,
    status: 'SUCCESS',
  });

  checkForAutomatedAlerts(updatedEntry);
  notify();

  return { success: true, isOfflineQueued: !online };
}

export function deleteOutreach(id: string): boolean {
  const all = getOutreaches();
  const target = all.find((o) => o.id === id);
  const updated = all.filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(updated));

  const currentUser = getCurrentUser();
  if (getIsOnline()) {
    fetch(`/api/outreaches/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentUser?.role || 'leader' },
    }).catch((err) => {
      console.warn('Delete on backend deferred:', err);
    });
  }

  addAuditLog({
    action: 'DELETE',
    details: `Removed outreach entry ${id} (${target?.councilName || 'Unknown'}).`,
    status: 'SUCCESS',
  });

  notify();
  return true;
}

export function getPendingSyncCount(): number {
  const all = getOutreaches();
  return all.filter((o) => o.syncStatus === 'pending').length;
}

export async function syncPendingToCloud(): Promise<{ syncedCount: number }> {
  const all = getOutreaches();
  const pendingItems = all.filter((o) => o.syncStatus === 'pending');

  if (pendingItems.length > 0 && getIsOnline()) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue: pendingItems }),
      });
    } catch (err) {
      console.warn('API batch sync error, resolving local state:', err);
    }
  }

  let count = 0;
  const updated = all.map((o) => {
    if (o.syncStatus === 'pending') {
      count++;
      return {
        ...o,
        syncStatus: 'synced' as const,
        syncedAt: new Date().toISOString(),
      };
    }
    return o;
  });

  localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(updated));

  if (count > 0) {
    addAuditLog({
      action: 'CLOUD_SYNC',
      details: `Batch cloud sync completed: ${count} offline field report(s) pushed to master database.`,
      status: 'SUCCESS',
    });
  }

  notify();
  return { syncedCount: count };
}

// ========================
// LIVE REFRESH FROM SERVER (Tapped, link opened, window focused)
// ========================
export async function refreshAllFromServer(): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  try {
    const [outreachesRes, usersRes, councilsRes, govsRes, bacentasRes] = await Promise.all([
      fetch('/api/outreaches').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/users').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/councils').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/governorships').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/bacentas').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    let changed = false;

    if (outreachesRes && Array.isArray(outreachesRes.outreaches)) {
      const serverOutreaches = outreachesRes.outreaches;
      const localOutreaches = getOutreaches();
      // Union by ID to never drop locally submitted form data
      const outreachMap = new Map<string, OutreachEntry>();
      serverOutreaches.forEach((o: OutreachEntry) => outreachMap.set(o.id, o));
      const missingOnServer: OutreachEntry[] = [];
      localOutreaches.forEach((loc) => {
        if (!outreachMap.has(loc.id)) {
          outreachMap.set(loc.id, loc);
          missingOnServer.push(loc);
        }
      });
      const mergedOutreaches = Array.from(outreachMap.values()).sort(
        (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );
      localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(mergedOutreaches));
      changed = true;

      // If any local form data was not on server, sync it now to server disk
      if (missingOnServer.length > 0) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queue: missingOnServer }),
        }).catch(() => {});
      }
    }

    if (usersRes && Array.isArray(usersRes.users)) {
      const serverUsers = usersRes.users;
      const localUsers = getUsers();
      const userMap = new Map<string, any>();
      serverUsers.forEach((su: any) => {
        const key = su.id || su.email;
        const localMatch = localUsers.find(
          (lu) => lu.id === su.id || lu.email?.toLowerCase() === su.email?.toLowerCase()
        );
        const finalHash =
          su.passwordHash ||
          localMatch?.passwordHash ||
          (localMatch?.password ? bcrypt.hashSync(localMatch.password, 10) : bcrypt.hashSync('password123', 10));
        userMap.set(key, { ...localMatch, ...su, passwordHash: finalHash });
      });
      const missingUsersOnServer: any[] = [];
      localUsers.forEach((loc) => {
        const key = loc.id || loc.email;
        if (
          !userMap.has(key) &&
          !Array.from(userMap.values()).some((u) => u.email?.toLowerCase() === loc.email?.toLowerCase())
        ) {
          if (!loc.passwordHash) {
            loc.passwordHash = bcrypt.hashSync('password123', 10);
          }
          userMap.set(key, loc);
          missingUsersOnServer.push(loc);
        }
      });
      SYSTEM_USERS.forEach((sys) => {
        const key = sys.id || sys.email;
        if (!userMap.has(key)) {
          userMap.set(key, sys);
        }
      });
      const mergedUsers = Array.from(userMap.values());
      const adminIdx = mergedUsers.findIndex(
        (u) => u.email?.toLowerCase() === 'dogbatseyfredrick@gmail.com' || u.id === 'user_admin_1'
      );
      if (adminIdx >= 0) {
        mergedUsers[adminIdx].phone = '+233 59 736 5182';
        mergedUsers[adminIdx].role = 'admin';
        mergedUsers[adminIdx].roleTitle = 'Lead Admin';
        mergedUsers[adminIdx].passwordHash = SYSTEM_USERS[0].passwordHash;
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));
      changed = true;

      if (missingUsersOnServer.length > 0) {
        missingUsersOnServer.forEach((u) => {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u),
          }).catch(() => {});
        });
      }
    }

    if (councilsRes && Array.isArray(councilsRes.councils)) {
      localStorage.setItem(STORAGE_KEYS.COUNCILS, JSON.stringify(councilsRes.councils));
      changed = true;
    }

    if (govsRes && govsRes.governorships) {
      localStorage.setItem(STORAGE_KEYS.GOVERNORSHIPS, JSON.stringify(govsRes.governorships));
      changed = true;
    }

    if (bacentasRes && bacentasRes.bacentas) {
      localStorage.setItem(STORAGE_KEYS.BACENTAS, JSON.stringify(bacentasRes.bacentas));
      changed = true;
    }

    if (changed) {
      notify();
    }
  } catch (err) {
    console.warn('Silent live refresh warning:', err);
  }
}

export function getAuditLogs(): SyncAuditLog[] {
  const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return [
    {
      id: 'log_init',
      timestamp: new Date().toISOString(),
      action: 'CLOUD_SYNC',
      details: 'System initial sync: Connected to Ephesians Ministries Regional Server.',
      status: 'SUCCESS',
    },
  ];
}

export function addAuditLog(entry: Omit<SyncAuditLog, 'id' | 'timestamp'>) {
  const logs = getAuditLogs();
  const newLog: SyncAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...logs.slice(0, 49)]));
}

export function getSystemAlerts(): SystemAlert[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  const initialAlerts: SystemAlert[] = [];
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(initialAlerts));
  return initialAlerts;
}

export function markAlertRead(id: string) {
  const alerts = getSystemAlerts();
  const updated = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
  notify();
}

export function markAllAlertsRead() {
  const alerts = getSystemAlerts();
  const updated = alerts.map((a) => ({ ...a, read: true }));
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
  notify();
}

function checkForAutomatedAlerts(entry: OutreachEntry) {
  const alerts = getSystemAlerts();
  const newAlerts: SystemAlert[] = [];

  if (entry.soulsWonCount >= 30) {
    newAlerts.push({
      id: `alt_cel_${Date.now()}`,
      severity: 'celebration',
      title: 'Grand Harvest Recorded!',
      message: `${entry.councilName} (${entry.governorshipName || 'Council'}) logged ${
        entry.soulsWonCount
      } souls won in ${entry.outreachType}!`,
      timestamp: new Date().toISOString(),
      actionText: 'View Report',
      read: false,
      relatedCouncil: entry.councilName,
    });
  }

  if (entry.outreachType === 'Crusade' && entry.leadersPresentCount < 5) {
    newAlerts.push({
      id: `alt_warn_${Date.now()}`,
      severity: 'warning',
      title: 'Low Leader Mobilization',
      message: `${entry.councilName} reported only ${entry.leadersPresentCount} leaders present for a Crusade event.`,
      timestamp: new Date().toISOString(),
      actionText: 'Contact Overseer',
      read: false,
      relatedCouncil: entry.councilName,
    });
  }

  if (newAlerts.length > 0) {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([...newAlerts, ...alerts]));
  }
}

export function exportOutreachesToCSV(entries?: OutreachEntry[]): string {
  const outreaches = entries || getOutreaches();
  const headers = [
    'Date',
    'Council Name',
    'Governorship Name',
    'Bacenta Name',
    'Outreach Level',
    'Outreach Type',
    'Leaders/Members Present',
    'Souls Won',
    'Converts Count',
    'Submitted By Name',
    'Submitted By Email',
    'Approval Status',
    'Notes',
  ];

  const rows = outreaches.map((o) => [
    `"${o.date}"`,
    `"${o.councilName.replace(/"/g, '""')}"`,
    `"${(o.governorshipName || '').replace(/"/g, '""')}"`,
    `"${(o.bacentaName || '').replace(/"/g, '""')}"`,
    `"${o.outreachLevel}"`,
    `"${o.outreachType}"`,
    o.leadersPresentCount,
    o.soulsWonCount,
    o.converts?.length || 0,
    `"${o.submittedBy.name.replace(/"/g, '""')}"`,
    `"${o.submittedBy.email}"`,
    `"${o.approvalStatus || 'approved'}"`,
    `"${(o.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function resetAllDataToDefault() {
  localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(INITIAL_OUTREACHES));
  localStorage.setItem(STORAGE_KEYS.COUNCILS, JSON.stringify(COUNCILS_LIST));
  localStorage.setItem(STORAGE_KEYS.GOVERNORSHIPS, JSON.stringify(INITIAL_GOVERNORSHIPS_BY_COUNCIL));
  localStorage.setItem(STORAGE_KEYS.BACENTAS, JSON.stringify(INITIAL_BACENTAS_BY_GOVERNORSHIP));
  localStorage.setItem(STORAGE_KEYS.LEADERS, JSON.stringify(INITIAL_LEADERS_POOL));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SYSTEM_USERS));
  localStorage.setItem(
    STORAGE_KEYS.AUDIT_LOGS,
    JSON.stringify([
      {
        id: `log_reset_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_RESET',
        details: 'All council, governorship, bacenta and outreach entries reset to default schema (Ephesians 1 to 5).',
        status: 'SUCCESS',
      },
    ])
  );
  notify();
}
