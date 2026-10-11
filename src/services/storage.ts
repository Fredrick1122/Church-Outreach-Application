import { OutreachEntry, UserProfile, SystemAlert, SyncAuditLog, LeaderAttendance } from '../types';
import { INITIAL_OUTREACHES, SYSTEM_USERS, COUNCILS_LIST, INITIAL_LEADERS_POOL } from './mockData';

const STORAGE_KEYS = {
  OUTREACHES: 'ephesians_outreaches_v2',
  CURRENT_USER: 'ephesians_current_user_v2',
  IS_ONLINE: 'ephesians_network_online_v2',
  COUNCILS: 'ephesians_councils_v2',
  LEADERS: 'ephesians_leaders_v2',
  ALERTS: 'ephesians_alerts_v2',
  AUDIT_LOGS: 'ephesians_audit_logs_v2',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeToStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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
    details: online ? 'Field worker transitioned to Online Mode. Auto-sync triggered.' : 'Field worker entered Offline Mode (Simulated Field Connectivity Loss).',
    status: 'SUCCESS',
  });

  if (online) {
    syncPendingToCloud();
  } else {
    notify();
  }
}

export function getCurrentUser(): UserProfile {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return SYSTEM_USERS[0]; // Default: Fredrick Dogbatsey (Admin)
}

export function setCurrentUser(user: UserProfile) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  addAuditLog({
    action: 'UPDATE',
    details: `Active account switched to ${user.name} (${user.roleTitle}).`,
    status: 'SUCCESS',
  });
  notify();
}

export function getCouncils(): string[] {
  const stored = localStorage.getItem(STORAGE_KEYS.COUNCILS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((c: string) => c.startsWith('Ephesians'))) {
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

export function getOutreaches(): OutreachEntry[] {
  const stored = localStorage.getItem(STORAGE_KEYS.OUTREACHES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  // Initialize with mock
  localStorage.setItem(STORAGE_KEYS.OUTREACHES, JSON.stringify(INITIAL_OUTREACHES));
  return INITIAL_OUTREACHES;
}

export function getOutreachesForUser(user: UserProfile): OutreachEntry[] {
  const all = getOutreaches();
  if (user.role === 'admin') {
    return all;
  }
  if (user.role === 'governor') {
    return all.filter((o) => o.councilName === user.council || o.submittedBy.email === user.email);
  }
  // Leader:
  return all.filter((o) => o.submittedBy.email === user.email || o.councilName === user.council);
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

  addAuditLog({
    action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
    details: `${existingIndex >= 0 ? 'Updated' : 'Logged'} outreach for ${entry.councilName} (${entry.soulsWonCount} souls, ${entry.leadersPresentCount} leaders). ${
      online ? 'Synced with cloud.' : 'Queued in offline local storage.'
    }`,
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

export function syncPendingToCloud(): Promise<{ syncedCount: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getOutreaches();
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
      resolve({ syncedCount: count });
    }, 600);
  });
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

  // Pre-seed contextual alerts
  const initialAlerts: SystemAlert[] = [
    {
      id: 'alt_1',
      severity: 'celebration',
      title: 'Crusade Milestone Exceeded',
      message: 'Dominion Gate Council won 74 souls during the Community 4 open-air crusade!',
      timestamp: '2026-10-08T21:40:00Z',
      actionText: 'View Converts',
      read: false,
      relatedCouncil: 'Dominion Gate Council',
    },
    {
      id: 'alt_2',
      severity: 'warning',
      title: 'Follow-Up Attention Needed',
      message: '4 new converts from this weekend are pending initial phone contact.',
      timestamp: '2026-10-10T14:00:00Z',
      actionText: 'Open Roster',
      read: false,
    },
    {
      id: 'alt_3',
      severity: 'info',
      title: 'Weekly Harvest Target',
      message: 'Ministries are currently at 86% of the monthly 200 Souls Goal.',
      timestamp: '2026-10-11T00:00:00Z',
      read: false,
    },
  ];
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

  // 1. High Souls celebration alert (> 30 souls)
  if (entry.soulsWonCount >= 30) {
    newAlerts.push({
      id: `alt_cel_${Date.now()}`,
      severity: 'celebration',
      title: 'Grand Harvest Recorded!',
      message: `${entry.councilName} logged ${entry.soulsWonCount} souls won in ${entry.outreachType}!`,
      timestamp: new Date().toISOString(),
      actionText: 'View Report',
      read: false,
      relatedCouncil: entry.councilName,
    });
  }

  // 2. Low attendance warning on major outreach
  if (entry.outreachType === 'Crusade' && entry.leadersPresentCount < 5) {
    newAlerts.push({
      id: `alt_warn_${Date.now()}`,
      severity: 'warning',
      title: 'Low Leader Mobilization',
      message: `${entry.councilName} reported only ${entry.leadersPresentCount} leaders present for a Crusade event.`,
      timestamp: new Date().toISOString(),
      actionText: 'Contact Governor',
      read: false,
      relatedCouncil: entry.councilName,
    });
  }

  if (newAlerts.length > 0) {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([...newAlerts, ...alerts]));
  }
}

export function exportOutreachesToCSV(): string {
  const outreaches = getOutreaches();
  const headers = [
    'Date',
    'Council Name',
    'Outreach Level',
    'Outreach Type',
    'Leaders/Members Present',
    'Souls Won',
    'Converts Count',
    'Attachments Count',
    'Submitted By Name',
    'Submitted By Email',
    'Notes',
    'Sync Status',
  ];

  const rows = outreaches.map((o) => [
    `"${o.date}"`,
    `"${o.councilName.replace(/"/g, '""')}"`,
    `"${o.outreachLevel}"`,
    `"${o.outreachType}"`,
    o.leadersPresentCount,
    o.soulsWonCount,
    o.converts?.length || 0,
    o.attachments?.length || 0,
    `"${o.submittedBy.name.replace(/"/g, '""')}"`,
    `"${o.submittedBy.email}"`,
    `"${(o.notes || '').replace(/"/g, '""')}"`,
    `"${o.syncStatus}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function resetAllDataToDefault() {
  localStorage.removeItem(STORAGE_KEYS.OUTREACHES);
  localStorage.removeItem(STORAGE_KEYS.ALERTS);
  localStorage.removeItem(STORAGE_KEYS.COUNCILS);
  localStorage.removeItem(STORAGE_KEYS.LEADERS);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  notify();
}
