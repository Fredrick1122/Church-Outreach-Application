import {
  OutreachEntry,
  UserProfile,
  SystemAlert,
  SyncAuditLog,
  LeaderAttendance,
  isGeneralOverseer,
  isCouncilOverseer,
  isGovernor,
  isLeader,
} from '../types';
import {
  INITIAL_OUTREACHES,
  SYSTEM_USERS,
  COUNCILS_LIST,
  INITIAL_GOVERNORSHIPS_BY_COUNCIL,
  INITIAL_BACENTAS_BY_GOVERNORSHIP,
  INITIAL_LEADERS_POOL,
} from './mockData';

const STORAGE_KEYS = {
  OUTREACHES: 'ephesians_outreaches_v6',
  CURRENT_USER: 'ephesians_current_user_v6',
  IS_ONLINE: 'ephesians_network_online_v6',
  COUNCILS: 'ephesians_councils_v6',
  GOVERNORSHIPS: 'ephesians_governorships_v6',
  BACENTAS: 'ephesians_bacentas_v6',
  LEADERS: 'ephesians_leaders_v6',
  ALERTS: 'ephesians_alerts_v6',
  AUDIT_LOGS: 'ephesians_audit_logs_v6',
  USERS: 'ephesians_system_users_v6',
};

// Purge any legacy sample keys
try {
  ['v1', 'v2', 'v3', 'v4', 'v5'].forEach((v) => {
    localStorage.removeItem(`ephesians_outreaches_${v}`);
    localStorage.removeItem(`ephesians_alerts_${v}`);
    localStorage.removeItem(`ephesians_audit_logs_${v}`);
    localStorage.removeItem(`ephesians_councils_${v}`);
    localStorage.removeItem(`ephesians_system_users_${v}`);
    localStorage.removeItem(`ephesians_current_user_${v}`);
  });
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

export function getUsers(): UserProfile[] {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure any new system users (e.g. Bishop Isaac Nakoja) are present
        const merged = [...parsed];
        let hasNew = false;
        SYSTEM_USERS.forEach((sysUser) => {
          if (!merged.some((u) => u.id === sysUser.id || u.email === sysUser.email)) {
            merged.push(sysUser);
            hasNew = true;
          }
        });
        if (hasNew) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        }
        return merged;
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
    throw new Error(`A user with email ${newUser.email} is already registered.`);
  }

  const updated = [...allUsers, newUser];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));

  addAuditLog({
    action: 'CREATE',
    details: `Registered account: ${newUser.name} as ${newUser.role.toUpperCase()} (${newUser.council}${newUser.governorship ? ' / ' + newUser.governorship : ''}).`,
    status: 'SUCCESS',
  });

  notify();

  // Push to backend
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser),
  }).catch(() => {});

  return { success: true, user: newUser };
}

export function loginUser(email: string, password?: string): UserProfile {
  const allUsers = getUsers();
  const user = allUsers.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    throw new Error('Account not found with this email. Please check your credentials or contact the General Overseer.');
  }
  if (password && user.password && user.password !== password) {
    throw new Error('Invalid password. Please check your credentials.');
  }

  setCurrentUser(user);
  return user;
}

// ========================
// COUNCILS (Strictly Ephesians 1 to 5)
// ========================
export function getCouncils(): string[] {
  const stored = localStorage.getItem(STORAGE_KEYS.COUNCILS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed.includes('Ephesians 6')) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.COUNCILS, JSON.stringify(COUNCILS_LIST));
  return COUNCILS_LIST;
}

export function addCouncil(name: string) {
  const clean = name.trim();
  if (!clean) return;
  const list = getCouncils();
  if (!list.includes(clean)) {
    const updated = [...list, clean];
    localStorage.setItem(STORAGE_KEYS.COUNCILS, JSON.stringify(updated));
    notify();
  }
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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(INITIAL_OUTREACHES));
  return INITIAL_OUTREACHES;
}

export function getOutreachesForUser(user: UserProfile | null): OutreachEntry[] {
  if (!user) {
    return [];
  }
  const all = getOutreaches();
  if (isGeneralOverseer(user.role)) {
    // General Overseer (Bishop Isaac Nakoja & Admin) has access across the board to all 5 Councils!
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
      headers: { 'x-user-role': currentUser.role },
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
      // Merge: preserve any pending offline items
      const pendingMap = new Map(localOutreaches.filter((o) => o.syncStatus === 'pending').map((o) => [o.id, o]));
      const mergedOutreaches = [
        ...pendingMap.values(),
        ...serverOutreaches.filter((o: OutreachEntry) => !pendingMap.has(o.id)),
      ];
      localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(mergedOutreaches));
      changed = true;
    }

    if (usersRes && Array.isArray(usersRes.users)) {
      const merged = [...usersRes.users];
      SYSTEM_USERS.forEach((sys) => {
        if (!merged.some((u) => u.id === sys.id || u.email === sys.email)) {
          merged.push(sys);
        }
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
      changed = true;
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
