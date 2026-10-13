import { LiveNotification, FieldObjective, UserProfile, OutreachEntry } from '../types';
import { getCurrentUser, refreshAllFromServer, notify } from './storage';

const STORAGE_KEYS = {
  NOTIFICATIONS: 'ephesians_live_notifications_v1',
  OBJECTIVES: 'ephesians_field_objectives_v1',
};

// Listeners
type NotificationListener = (notifications: LiveNotification[]) => void;
type ToastListener = (notification: LiveNotification) => void;
type ObjectivesListener = (objectives: FieldObjective[]) => void;
type PresenceListener = (count: number) => void;

const notificationListeners = new Set<NotificationListener>();
const toastListeners = new Set<ToastListener>();
const objectivesListeners = new Set<ObjectivesListener>();
const presenceListeners = new Set<PresenceListener>();

let socket: WebSocket | null = null;
let reconnectTimer: any = null;
let isConnected = false;
let onlinePresenceCount = 1;

let cachedNotifications: LiveNotification[] = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

let cachedObjectives: FieldObjective[] = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OBJECTIVES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [
    {
      id: 'obj_great_harvest_5000',
      title: 'Operation Great Harvest: 5,000 Souls Blitz',
      targetCouncil: 'All Councils',
      targetSouls: 5000,
      targetLeaders: 50,
      priority: 'urgent',
      deadline: '2026-12-31',
      instructions:
        'Kingdom mobilization across all councils: Personal evangelism, street invasions, and convert discipleship follow-up to achieve the 5,000 souls harvest goal.',
      createdBy: {
        id: 'user_admin_1',
        name: 'Fredrick Dogbatsey',
        role: 'admin',
      },
      createdAt: new Date().toISOString(),
      status: 'active',
    },
  ];
})();

// ========================
// AUDIO CHIME (Web Audio API Synthesized Bell)
// ========================
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone (D5 ~ 587Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (A5 ~ 880Hz, slightly delayed for melodic chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch {
    // Graceful fallback if audio is not permitted before interaction
  }
}

// ========================
// WEBSOCKET CLIENT MANAGER
// ========================
export function initRealtime(user?: UserProfile | null) {
  if (typeof window === 'undefined') return;

  const effectiveId = user?.id || 'guest_client';
  const effectiveRole = user?.role || 'guest';
  const effectiveCouncil = user?.council || '';

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    // Send updated auth if user switched
    try {
      socket.send(
        JSON.stringify({
          type: 'auth',
          userId: effectiveId,
          role: effectiveRole,
          council: effectiveCouncil,
        })
      );
    } catch {
      // ignore
    }
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws?userId=${encodeURIComponent(effectiveId)}&role=${encodeURIComponent(
    effectiveRole
  )}&council=${encodeURIComponent(effectiveCouncil)}`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      isConnected = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'init') {
          if (Array.isArray(data.objectives)) {
            cachedObjectives = data.objectives;
            localStorage.setItem(STORAGE_KEYS.OBJECTIVES, JSON.stringify(cachedObjectives));
            objectivesListeners.forEach((l) => l(cachedObjectives));
          }
          if (Array.isArray(data.notifications)) {
            // Merge with local avoiding duplicates
            const existingIds = new Set(cachedNotifications.map((n) => n.id));
            const newNotifs = data.notifications.filter((n: LiveNotification) => !existingIds.has(n.id));
            cachedNotifications = [...newNotifs, ...cachedNotifications];
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cachedNotifications));
            notificationListeners.forEach((l) => l(cachedNotifications));
          }
          if (typeof data.connectedCount === 'number') {
            onlinePresenceCount = data.connectedCount;
            presenceListeners.forEach((l) => l(onlinePresenceCount));
          }
        } else if (data.type === 'notification') {
          const newNotif = data.notification as LiveNotification;
          // Guard idempotency
          if (!cachedNotifications.some((n) => n.id === newNotif.id)) {
            cachedNotifications = [newNotif, ...cachedNotifications];
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cachedNotifications));
            notificationListeners.forEach((l) => l(cachedNotifications));

            // Audible ding and visual toast
            playNotificationChime();
            toastListeners.forEach((l) => l(newNotif));
          }
        } else if (data.type === 'objective:created') {
          const newObj = data.objective as FieldObjective;
          if (!cachedObjectives.some((o) => o.id === newObj.id)) {
            cachedObjectives = [newObj, ...cachedObjectives];
            localStorage.setItem(STORAGE_KEYS.OBJECTIVES, JSON.stringify(cachedObjectives));
            objectivesListeners.forEach((l) => l(cachedObjectives));
          }
        } else if (
          data.type === 'outreach:updated' ||
          data.type === 'outreach:created' ||
          data.type === 'data:updated'
        ) {
          refreshAllFromServer().then(() => {
            notify();
            window.dispatchEvent(new Event('storage'));
          });
        } else if (data.type === 'presence') {
          if (typeof data.connectedCount === 'number') {
            onlinePresenceCount = data.connectedCount;
            presenceListeners.forEach((l) => l(onlinePresenceCount));
          }
        }
      } catch (err) {
        console.warn('Realtime parse error:', err);
      }
    };

    socket.onclose = () => {
      isConnected = false;
      socket = null;
      // Schedule auto-reconnect
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          initRealtime(getCurrentUser());
        }, 3000);
      }
    };

    socket.onerror = () => {
      isConnected = false;
    };
  } catch (err) {
    console.warn('WebSocket initiation error:', err);
  }
}

// ========================
// SUBSCRIPTIONS & HOOK HELPERS
// ========================
export function subscribeToRealtimeNotifications(listener: NotificationListener) {
  notificationListeners.add(listener);
  listener(cachedNotifications);
  return () => {
    notificationListeners.delete(listener);
  };
}

export function subscribeToRealtimeToast(listener: ToastListener) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function subscribeToObjectives(listener: ObjectivesListener) {
  objectivesListeners.add(listener);
  listener(cachedObjectives);
  return () => {
    objectivesListeners.delete(listener);
  };
}

export function subscribeToPresence(listener: PresenceListener) {
  presenceListeners.add(listener);
  listener(onlinePresenceCount);
  return () => {
    presenceListeners.delete(listener);
  };
}

export function getLiveNotifications(): LiveNotification[] {
  return cachedNotifications;
}

export function getFieldObjectives(): FieldObjective[] {
  return cachedObjectives;
}

export function markNotificationAsRead(id: string) {
  cachedNotifications = cachedNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cachedNotifications));
  notificationListeners.forEach((l) => l(cachedNotifications));

  // Sync to server
  fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationId: id }),
  }).catch(() => {});
}

export function markAllNotificationsAsRead() {
  cachedNotifications = cachedNotifications.map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cachedNotifications));
  notificationListeners.forEach((l) => l(cachedNotifications));

  fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  }).catch(() => {});
}

export function clearAllNotifications() {
  cachedNotifications = [];
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  notificationListeners.forEach((l) => l(cachedNotifications));
}

// ========================
// API ACTIONS
// ========================

// 1. Admin adds a new field objective -> broadcast to field leaders
export async function createFieldObjective(
  data: {
    title: string;
    targetCouncil: string;
    targetSouls: number;
    targetLeaders?: number;
    priority: 'urgent' | 'high' | 'standard';
    deadline: string;
    instructions: string;
  },
  adminUser: UserProfile
): Promise<FieldObjective> {
  const payload = {
    ...data,
    createdBy: {
      id: adminUser.id,
      name: adminUser.name,
      role: adminUser.role,
    },
  };

  const res = await fetch('/api/objectives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to create field objective');
  }

  const result = await res.json();
  const created = result.objective as FieldObjective;

  // Add locally optimistically if not already broadcasted
  if (!cachedObjectives.some((o) => o.id === created.id)) {
    cachedObjectives = [created, ...cachedObjectives];
    localStorage.setItem(STORAGE_KEYS.OBJECTIVES, JSON.stringify(cachedObjectives));
    objectivesListeners.forEach((l) => l(cachedObjectives));
  }

  return created;
}

// 2. Admin approves an outreach entry -> broadcast to field leader who submitted it
export async function approveOutreach(
  outreachId: string,
  adminUser: UserProfile,
  comment?: string
): Promise<boolean> {
  // Update local storage representation
  try {
    const raw = localStorage.getItem('ephesians_outreaches_v8');
    if (raw) {
      const all: OutreachEntry[] = JSON.parse(raw);
      const idx = all.findIndex((o) => o.id === outreachId);
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          approvalStatus: 'approved',
          approvedBy: {
            id: adminUser.id,
            name: adminUser.name,
            approvedAt: new Date().toISOString(),
            comment: comment || 'Verified and approved by administration.',
          },
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('ephesians_outreaches_v8', JSON.stringify(all));
      }
    }
  } catch (e) {
    console.warn('Local approval cache error:', e);
  }

  // Push to server so server WebSocket broadcasts real-time celebration to leader
  const res = await fetch(`/api/outreaches/${outreachId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminId: adminUser.id,
      adminName: adminUser.name,
      comment,
    }),
  });

  return res.ok;
}
