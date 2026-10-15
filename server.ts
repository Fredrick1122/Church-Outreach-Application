import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// In-memory persistent data store with initial seed
interface ConvertRecord {
  id: string;
  fullName: string;
  phone: string;
  gender: string;
  ageGroup: string;
  decision: string;
  needsFollowUp: boolean;
  followUpStatus: string;
  addressOrArea?: string;
  bacentaAssigned?: string;
  notes?: string;
  createdAt: string;
}

interface LeaderAttendance {
  id: string;
  name: string;
  role: string;
  council: string;
  isPresent: boolean;
  soulsWitnessed?: number;
}

interface AttachmentInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string;
}

interface OutreachEntry {
  id: string;
  date: string;
  councilName: string;
  governorshipName?: string;
  bacentaName?: string;
  outreachLevel: string;
  outreachType: string;
  otherTypeDetail?: string;
  leadersPresentCount: number;
  soulsWonCount: number;
  locationArea?: string;
  notes?: string;
  converts?: ConvertRecord[];
  leadersList?: LeaderAttendance[];
  attachments?: AttachmentInfo[];
  submittedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
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

interface FieldObjective {
  id: string;
  title: string;
  targetCouncil: string;
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

interface LiveNotification {
  id: string;
  type: 'objective_created' | 'outreach_approved' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole?: string;
  targetCouncil?: string;
  targetUserId?: string;
  metadata?: Record<string, any>;
}

// STRICTLY 5 COUNCILS (Ephesians 1 to 5)
let councils: string[] = [
  'Ephesians 1',
  'Ephesians 2',
  'Ephesians 3',
  'Ephesians 4',
  'Ephesians 5',
];

let leadersPool: LeaderAttendance[] = [
  { id: 'lead_1', name: 'Fredrick Dogbatsey', role: 'Operations Admin', council: 'All Councils', isPresent: false, soulsWitnessed: 0 },
];

let outreaches: OutreachEntry[] = [];

let fieldObjectives: FieldObjective[] = [
  {
    id: 'obj_great_harvest_5000',
    title: 'Operation Great Harvest: 5,000 Souls Blitz',
    targetCouncil: 'All Councils',
    targetSouls: 5000,
    targetLeaders: 50,
    priority: 'urgent',
    deadline: '2026-12-31',
    instructions: 'Kingdom mobilization across all councils: Personal evangelism, street invasions, and convert discipleship follow-up to achieve the 5,000 souls harvest goal.',
    createdBy: {
      id: 'user_admin_1',
      name: 'Fredrick Dogbatsey',
      role: 'admin',
    },
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

let liveNotifications: LiveNotification[] = [];

// ========================
// REAL-TIME WEBSOCKET REGISTRY
// ========================
interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
  role?: string;
  council?: string;
}

const connectedClients = new Set<ConnectedClient>();

function shouldDeliverNotification(notif: LiveNotification, client: ConnectedClient): boolean {
  if (notif.targetUserId) {
    if (client.userId === notif.targetUserId) return true;
    if (client.role === 'admin') return true;
    return false;
  }
  if (notif.targetCouncil && notif.targetCouncil !== 'All Councils') {
    if (client.role === 'admin') return true;
    if (client.council && client.council === notif.targetCouncil) return true;
    return false;
  }
  return true;
}

function broadcastNotification(notif: LiveNotification) {
  liveNotifications.unshift(notif);
  if (liveNotifications.length > 100) liveNotifications.pop();

  const msg = JSON.stringify({
    type: 'notification',
    notification: notif,
  });

  connectedClients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN && shouldDeliverNotification(notif, client)) {
      client.ws.send(msg);
    }
  });
}

function broadcastEvent(payload: any) {
  const msg = JSON.stringify(payload);
  connectedClients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  });
}

function broadcastPresence() {
  broadcastEvent({
    type: 'presence',
    connectedCount: connectedClients.size,
  });
}

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const userId = url.searchParams.get('userId') || undefined;
  const role = url.searchParams.get('role') || undefined;
  const council = url.searchParams.get('council') || undefined;

  const client: ConnectedClient = { ws, userId, role, council };
  connectedClients.add(client);

  ws.send(
    JSON.stringify({
      type: 'init',
      objectives: fieldObjectives,
      notifications: liveNotifications.filter((n) => shouldDeliverNotification(n, client)),
      connectedCount: connectedClients.size,
    })
  );

  broadcastPresence();

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'auth') {
        client.userId = data.userId;
        client.role = data.role;
        client.council = data.council;
      }
    } catch {
      // ignore
    }
  });

  ws.on('close', () => {
    connectedClients.delete(client);
    broadcastPresence();
  });
});

interface AuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLOUD_SYNC' | 'OFFLINE_CACHE';
  details: string;
  status: 'SUCCESS' | 'FAILED';
}

let auditLogs: AuditLog[] = [
  {
    id: 'log_init',
    timestamp: new Date().toISOString(),
    action: 'CLOUD_SYNC',
    details: 'Backend API service initialized. Connected to Ephesians Outreach database.',
    status: 'SUCCESS',
  },
];

let systemUsers: any[] = [
  {
    id: 'user_admin_1',
    name: 'Fredrick Dogbatsey',
    email: 'dogbatseyfredrick@gmail.com',
    passwordHash: '$2b$10$LeNqWAljFJZP4P2DLib/KeGwFGuj1C2NKM3EMSeelg44JXFr4iI8y',
    role: 'admin',
    roleTitle: 'Lead Admin',
    council: 'All Councils',
    avatarInitials: 'FD',
    avatarColor: 'bg-teal-600',
    phone: '+233 24 412 8990',
  },
];

let governorshipsByCouncil: Record<string, string[]> = {
  'Ephesians 1': [],
  'Ephesians 2': [],
  'Ephesians 3': [],
  'Ephesians 4': [],
  'Ephesians 5': [],
};

let bacentasByGovernorship: Record<string, string[]> = {};

// ========================
// API ENDPOINTS
// ========================

// Secure Authentication Endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const clean = email.trim().toLowerCase();

  // Direct check for Lead Admin
  if (
    (clean === 'dogbatseyfredrick@gmail.com' || clean === 'dogbatseyfredrick.com') &&
    password === 'Godfred_1'
  ) {
    const user = systemUsers.find(
      (u) =>
        u.email?.trim().toLowerCase() === 'dogbatseyfredrick@gmail.com' ||
        u.email?.trim().toLowerCase() === 'dogbatseyfredrick.com' ||
        u.id === 'user_admin_1'
    ) || systemUsers[0];
    const { passwordHash: _, ...safeUser } = user;
    safeUser.email = 'dogbatseyfredrick@gmail.com';
    res.json({ success: true, user: safeUser });
    return;
  }

  const user = systemUsers.find((u) => {
    const uEmail = u.email.trim().toLowerCase();
    if (
      (clean === 'dogbatseyfredrick@gmail.com' || clean === 'dogbatseyfredrick.com') &&
      (uEmail === 'dogbatseyfredrick@gmail.com' || uEmail === 'dogbatseyfredrick.com')
    ) {
      return true;
    }
    return uEmail === clean;
  });

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Users management (Admin/Overseer Registration)
app.get('/api/users', (req: Request, res: Response) => {
  const safeUsers = systemUsers.map(({ passwordHash, ...u }) => u);
  res.json({ users: safeUsers });
});

app.post('/api/users', (req: Request, res: Response) => {
  const { name, email, password, role, roleTitle, council, bacenta, phone } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Name, email, and role are required' });
    return;
  }

  const existing = systemUsers.find(
    (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
  );
  if (existing) {
    res.status(409).json({ error: 'User with this email is already registered.' });
    return;
  }

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const colorOptions = [
    'bg-emerald-600',
    'bg-blue-600',
    'bg-purple-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-teal-600',
  ];
  const avatarColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];

  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password || 'password123', 10),
    role,
    roleTitle:
      roleTitle ||
      (role === 'admin'
        ? 'Admin'
        : role === 'general_overseer'
        ? 'General Overseer'
        : role === 'council_overseer' || role === 'overseer'
        ? `${council || 'Ephesians 1'} Council Overseer`
        : role === 'governor'
        ? `${council || 'Governorship'} Pastor`
        : 'Field Leader'),
    council: council || 'Ephesians 1',
    bacenta: bacenta || undefined,
    avatarInitials: initials,
    avatarColor,
    phone: phone || '',
    createdAt: new Date().toISOString(),
  };

  systemUsers.push(newUser);

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CREATE',
    details: `Admin registered new user: ${newUser.name} as ${newUser.role.toUpperCase()} for ${newUser.council}`,
    status: 'SUCCESS',
  });

  res.status(201).json({ success: true, user: newUser });
});

// Update Leadership Hierarchy Level (Promote / Demote / Reassign)
app.patch('/api/users/:id/hierarchy', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, roleTitle, council, governorship, bacenta } = req.body;
  const user = systemUsers.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const oldRole = user.role;
  const oldTitle = user.roleTitle;
  if (role) user.role = role;
  if (roleTitle) user.roleTitle = roleTitle;
  if (council) user.council = council;
  if (governorship !== undefined) user.governorship = governorship;
  if (bacenta !== undefined) user.bacenta = bacenta;

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'UPDATE',
    details: `Admin changed leadership hierarchy for ${user.name}: moved from ${oldRole.toUpperCase()} (${oldTitle}) to ${user.role.toUpperCase()} (${user.roleTitle}).`,
    status: 'SUCCESS',
  });

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Governorships by Council (Ephesians 1 to 5)
app.get('/api/governorships', (req: Request, res: Response) => {
  const council = req.query.council as string | undefined;
  if (council && governorshipsByCouncil[council]) {
    res.json({ council, governorships: governorshipsByCouncil[council] });
    return;
  }
  res.json({ governorships: governorshipsByCouncil });
});

app.post('/api/governorships', (req: Request, res: Response) => {
  const { council, name } = req.body;
  if (!council || !name) {
    res.status(400).json({ error: 'Council and governorship name are required' });
    return;
  }
  if (!governorshipsByCouncil[council]) {
    governorshipsByCouncil[council] = [];
  }
  const clean = name.trim();
  if (!governorshipsByCouncil[council].includes(clean)) {
    governorshipsByCouncil[council].push(clean);
    if (!bacentasByGovernorship[clean]) {
      bacentasByGovernorship[clean] = [];
    }
    broadcastEvent({ type: 'data:updated' });
  }
  res.json({ success: true, council, governorships: governorshipsByCouncil[council] });
});

// Bacentas by Governorship and Council
app.get('/api/bacentas', (req: Request, res: Response) => {
  const governorship = req.query.governorship as string | undefined;
  if (governorship && bacentasByGovernorship[governorship]) {
    res.json({ governorship, bacentas: bacentasByGovernorship[governorship] });
    return;
  }
  res.json({ bacentas: bacentasByGovernorship });
});

app.post('/api/bacentas', (req: Request, res: Response) => {
  const { governorship, council, name, bacentaName } = req.body;
  const targetName = (name || bacentaName || '').trim();
  const targetGov = (governorship || (council ? (governorshipsByCouncil[council]?.[0] || `${council} Governorship`) : '')).trim();

  if (!targetGov || !targetName) {
    res.status(400).json({ error: 'Governorship and bacenta name are required' });
    return;
  }
  if (!bacentasByGovernorship[targetGov]) {
    bacentasByGovernorship[targetGov] = [];
  }
  if (!bacentasByGovernorship[targetGov].includes(targetName)) {
    bacentasByGovernorship[targetGov].push(targetName);
    broadcastEvent({ type: 'data:updated' });
  }
  res.json({ success: true, governorship: targetGov, bacentas: bacentasByGovernorship[targetGov] });
});

// 1. Health check & system info
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Ephesians Outreach Cloud API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    recordsCount: outreaches.length,
    councilsCount: councils.length,
  });
});

// 2. Councils list
app.get('/api/councils', (req: Request, res: Response) => {
  res.json({ councils });
});

app.post('/api/councils', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Council name is required' });
    return;
  }
  const cleanName = name.trim();
  if (!councils.includes(cleanName)) {
    councils.push(cleanName);
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'CREATE',
      details: `New council added: ${cleanName}`,
      status: 'SUCCESS',
    });
  }
  res.json({ success: true, councils });
});

// 3. Leaders pool
app.get('/api/leaders', (req: Request, res: Response) => {
  res.json({ leaders: leadersPool });
});

app.post('/api/leaders', (req: Request, res: Response) => {
  const { name, role, council } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Leader name is required' });
    return;
  }
  const newLeader: LeaderAttendance = {
    id: `lead_${Date.now()}`,
    name,
    role: role || 'Field Member',
    council: council || 'Ephesians 1',
    isPresent: true,
    soulsWitnessed: 0,
  };
  leadersPool.push(newLeader);
  res.json({ success: true, leader: newLeader });
});

// 4. Outreaches CRUD
app.get('/api/outreaches', (req: Request, res: Response) => {
  const { council, level, type } = req.query;
  let result = [...outreaches];

  if (council && council !== 'all') {
    result = result.filter((o) => o.councilName === council);
  }
  if (level && level !== 'all') {
    result = result.filter((o) => o.outreachLevel === level);
  }
  if (type && type !== 'all') {
    result = result.filter((o) => o.outreachType === type);
  }

  // Sort by date descending
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json({ outreaches: result, total: result.length });
});

app.post('/api/outreaches', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.date || !body.councilName || !body.outreachLevel || !body.outreachType) {
    res.status(400).json({ error: 'Missing required outreach fields (date, councilName, outreachLevel, outreachType)' });
    return;
  }

  const isSubmittedByAdmin = body.submittedBy?.role === 'admin';
  const newEntry: OutreachEntry = {
    id: body.id || `outreach_${Date.now()}`,
    date: body.date,
    councilName: body.councilName,
    governorshipName: body.governorshipName || undefined,
    bacentaName: body.bacentaName || undefined,
    outreachLevel: body.outreachLevel,
    outreachType: body.outreachType,
    otherTypeDetail: body.otherTypeDetail,
    leadersPresentCount: Number(body.leadersPresentCount) || 0,
    soulsWonCount: Number(body.soulsWonCount) || 0,
    locationArea: body.locationArea || '',
    notes: body.notes || '',
    converts: body.converts || [],
    leadersList: body.leadersList || [],
    attachments: body.attachments || [],
    submittedBy: body.submittedBy || {
      id: 'user_admin_1',
      name: 'Fredrick Dogbatsey',
      email: 'dogbatseyfredrick@gmail.com',
      role: 'admin',
    },
    approvalStatus: isSubmittedByAdmin ? 'approved' : body.approvalStatus || 'pending',
    approvedBy: isSubmittedByAdmin
      ? {
          id: 'user_admin_1',
          name: 'Fredrick Dogbatsey',
          approvedAt: new Date().toISOString(),
        }
      : undefined,
    syncStatus: 'synced',
    syncedAt: new Date().toISOString(),
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  outreaches.unshift(newEntry);

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CREATE',
    details: `Outreach submitted for ${newEntry.councilName}: ${newEntry.soulsWonCount} souls won by ${newEntry.submittedBy.name} (${newEntry.approvalStatus})`,
    status: 'SUCCESS',
  });

  broadcastEvent({ type: 'outreach:created', outreach: newEntry });

  res.status(201).json({ success: true, outreach: newEntry });
});

// Approve Outreach (Admin Action that triggers Real-Time Notification to Submitting Leader)
app.post('/api/outreaches/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminId, adminName, comment } = req.body;
  const index = outreaches.findIndex((o) => o.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Outreach entry not found' });
    return;
  }

  const outreach = outreaches[index];
  const reviewerName = adminName || 'Fredrick Dogbatsey';
  const reviewerId = adminId || 'user_admin_1';

  outreach.approvalStatus = 'approved';
  outreach.approvedBy = {
    id: reviewerId,
    name: reviewerName,
    approvedAt: new Date().toISOString(),
    comment: comment || 'Verified and approved by administration.',
  };
  outreach.updatedAt = new Date().toISOString();

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'UPDATE',
    details: `Outreach record ${id} (${outreach.councilName}, ${outreach.soulsWonCount} souls) approved by Overseer ${reviewerName}.`,
    status: 'SUCCESS',
  });

  // REAL-TIME BROADCAST: Target the field leader who submitted this operation!
  const approvalNotif: LiveNotification = {
    id: `notif_appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'outreach_approved',
    title: 'Field Outreach Approved! 🎉',
    message: `Your outreach for ${outreach.councilName} (${outreach.date}, ${outreach.soulsWonCount} souls won) was officially approved by Overseer ${reviewerName}!`,
    timestamp: new Date().toISOString(),
    read: false,
    targetUserId: outreach.submittedBy.id,
    targetCouncil: outreach.councilName,
    metadata: {
      outreachId: outreach.id,
      councilName: outreach.councilName,
      soulsWonCount: outreach.soulsWonCount,
      approvedBy: reviewerName,
    },
  };

  broadcastNotification(approvalNotif);
  broadcastEvent({ type: 'outreach:updated', outreach });

  res.json({ success: true, outreach, notification: approvalNotif });
});

// Update outreach (e.g. update convert follow up status or notes)
app.put('/api/outreaches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = outreaches.findIndex((o) => o.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Outreach entry not found' });
    return;
  }

  outreaches[index] = {
    ...outreaches[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'UPDATE',
    details: `Updated record ${id} (${outreaches[index].councilName})`,
    status: 'SUCCESS',
  });

  res.json({ success: true, outreach: outreaches[index] });
});

// Delete outreach (Admin role check)
app.delete('/api/outreaches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role'];

  if (userRole && userRole !== 'admin') {
    res.status(403).json({ error: 'RBAC Restriction: Only Admin accounts can delete operation records.' });
    return;
  }

  const initialLength = outreaches.length;
  outreaches = outreaches.filter((o) => o.id !== id);

  if (outreaches.length === initialLength) {
    res.status(404).json({ error: 'Outreach record not found' });
    return;
  }

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'DELETE',
    details: `Deleted outreach record ${id}`,
    status: 'SUCCESS',
  });

  res.json({ success: true, message: 'Record successfully deleted' });
});

// 5. Batch Offline Sync Endpoint
app.post('/api/sync', (req: Request, res: Response) => {
  const { queue } = req.body;
  if (!Array.isArray(queue)) {
    res.status(400).json({ error: 'Queue must be an array of outreach entries' });
    return;
  }

  let syncedCount = 0;
  for (const item of queue) {
    const existingIndex = outreaches.findIndex((o) => o.id === item.id);
    const syncedItem: OutreachEntry = {
      ...item,
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      outreaches[existingIndex] = syncedItem;
    } else {
      outreaches.unshift(syncedItem);
    }
    syncedCount++;
  }

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CLOUD_SYNC',
    details: `Batch synchronization completed: ${syncedCount} field operations pushed to cloud database.`,
    status: 'SUCCESS',
  });

  res.json({
    success: true,
    syncedCount,
    syncedAt: new Date().toISOString(),
  });
});

// 6. Analytics Overview (Admin Only)
app.get('/api/analytics', (req: Request, res: Response) => {
  const userRole = req.headers['x-user-role'];
  if (userRole && userRole !== 'admin') {
    res.status(403).json({ error: 'RBAC Restriction: Only Admin can access dashboard analytics.' });
    return;
  }

  const totalSouls = outreaches.reduce((acc, curr) => acc + curr.soulsWonCount, 0);
  const totalLeaders = outreaches.reduce((acc, curr) => acc + curr.leadersPresentCount, 0);
  const totalEvents = outreaches.length;

  const councilStats: Record<string, { events: number; souls: number; leaders: number }> = {};
  councils.forEach((c) => {
    councilStats[c] = { events: 0, souls: 0, leaders: 0 };
  });

  outreaches.forEach((o) => {
    if (!councilStats[o.councilName]) {
      councilStats[o.councilName] = { events: 0, souls: 0, leaders: 0 };
    }
    councilStats[o.councilName].events += 1;
    councilStats[o.councilName].souls += o.soulsWonCount;
    councilStats[o.councilName].leaders += o.leadersPresentCount;
  });

  const allConverts = outreaches.flatMap((o) => o.converts || []);

  res.json({
    totalSouls,
    totalLeaders,
    totalEvents,
    totalConverts: allConverts.length,
    councilStats,
    recentAlerts: [],
  });
});

// 7. Audit Trail & Storage Space (Admin Only)
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const userRole = req.headers['x-user-role'];
  if (userRole && userRole !== 'admin') {
    res.status(403).json({ error: 'RBAC Restriction: Only Admin can access system storage and audit space.' });
    return;
  }
  res.json({ logs: auditLogs });
});

// 8. Field Objectives Endpoints (Real-Time Mandates for Field Leaders)
app.get('/api/objectives', (req: Request, res: Response) => {
  res.json({ objectives: fieldObjectives });
});

app.post('/api/objectives', (req: Request, res: Response) => {
  const { title, targetCouncil, targetSouls, targetLeaders, priority, deadline, instructions, createdBy } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Objective title is required' });
    return;
  }

  const newObj: FieldObjective = {
    id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    targetCouncil: targetCouncil || 'All Councils',
    targetSouls: Number(targetSouls) || 50,
    targetLeaders: Number(targetLeaders) || 10,
    priority: priority || 'high',
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    instructions: instructions || '',
    createdBy: createdBy || {
      id: 'user_admin_1',
      name: 'Fredrick Dogbatsey',
      role: 'admin',
    },
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  fieldObjectives.unshift(newObj);

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CREATE',
    details: `New field objective established: "${newObj.title}" for ${newObj.targetCouncil} (${newObj.targetSouls} souls target) by ${newObj.createdBy.name}.`,
    status: 'SUCCESS',
  });

  // REAL-TIME BROADCAST: Alert all connected field leaders!
  const objectiveNotif: LiveNotification = {
    id: `notif_obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'objective_created',
    title: `New Field Objective: ${newObj.title}`,
    message: `Overseer ${newObj.createdBy.name} set a goal of ${newObj.targetSouls} souls in ${newObj.targetCouncil}. Deadline: ${newObj.deadline}.`,
    timestamp: new Date().toISOString(),
    read: false,
    targetRole: 'all',
    targetCouncil: newObj.targetCouncil,
    metadata: {
      objectiveId: newObj.id,
      councilName: newObj.targetCouncil,
      targetSouls: newObj.targetSouls,
      deadline: newObj.deadline,
    },
  };

  broadcastNotification(objectiveNotif);
  broadcastEvent({ type: 'objective:created', objective: newObj });

  res.status(201).json({ success: true, objective: newObj, notification: objectiveNotif });
});

// 9. Notifications Endpoints
app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const council = req.query.council as string | undefined;
  const role = req.query.role as string | undefined;

  const clientMock: ConnectedClient = { ws: null as any, userId, council, role };
  const filtered = liveNotifications.filter((n) => shouldDeliverNotification(n, clientMock));
  res.json({ notifications: filtered });
});

app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
  const { notificationId, all } = req.body;
  if (all) {
    liveNotifications.forEach((n) => (n.read = true));
  } else if (notificationId) {
    const found = liveNotifications.find((n) => n.id === notificationId);
    if (found) found.read = true;
  }
  res.json({ success: true });
});

// 10. Presence Endpoint
app.get('/api/presence', (req: Request, res: Response) => {
  res.json({
    connectedCount: connectedClients.size,
    onlineWorkers: Array.from(connectedClients).map((c) => ({
      role: c.role,
      council: c.council,
      userId: c.userId,
    })),
  });
});

// 11. AI Scripture Motivation (Evangelism, Soul Winning, Shepherding)
app.post('/api/ai-motivation', async (req: Request, res: Response) => {
  const { category, customTopic } = req.body;
  const fallbackScriptures = [
    {
      category: 'soul_winning',
      reference: 'Proverbs 11:30',
      text: 'The fruit of the righteous is a tree of life; and he that winneth souls is wise.',
      theme: 'Soul Winning & Heavenly Wisdom',
      exhortation: 'Every soul you witness to is an eternal triumph over darkness. Winning souls into the kingdom of light is the highest calling and truest wisdom. Step out today with divine authority for the 5,000 Souls Great Harvest!',
      prayer: 'Lord, give me heavenly wisdom, compassionate boldness, and utterance to win precious souls today.',
    },
    {
      category: 'evangelism',
      reference: 'Matthew 28:19-20',
      text: 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.',
      theme: 'The Apostolic Great Commission',
      exhortation: 'You never walk the outreach fields alone. The King of Kings goes before you with all authority in heaven and earth. Speak Christ with bold faith!',
      prayer: 'Lord Jesus, empower every field worker across all councils to proclaim Your word without fear.',
    },
    {
      category: 'shepherding',
      reference: 'John 10:11, 14',
      text: 'I am the good shepherd: the good shepherd giveth his life for the sheep... I know my sheep, and am known of mine.',
      theme: 'Apostolic Shepherding & Bacenta Care',
      exhortation: 'Winning souls is the beginning; shepherding them with patient love and discipleship establishes the kingdom. Follow up with tenderness and spiritual vigilance.',
      prayer: 'Holy Spirit, give our governors and bacenta leaders the heart of the Good Shepherd to nurse and establish every new convert.',
    },
    {
      category: 'soul_winning',
      reference: 'Daniel 12:3',
      text: 'And they that be wise shall shine as the brightness of the firmament; and they that turn many to righteousness as the stars for ever and ever.',
      theme: 'Eternal Reward of Soul Winners',
      exhortation: 'Earthly rewards fade away, but those who turn many to righteousness will shine as luminous stars across eternity. Your labor in the harvest field is never in vain!',
      prayer: 'Father, ignite an unquenchable fire in our spirits to turn multitudes unto righteousness.',
    },
    {
      category: 'evangelism',
      reference: 'Acts 1:8',
      text: 'But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.',
      theme: 'Supernatural Power for the Streets',
      exhortation: 'You do not minister by human wisdom, but with the divine power of the Holy Ghost. Go into every neighborhood expecting miracles, convictions, and changed lives!',
      prayer: 'Almighty God, release Pentecostal boldness and demonstration of the Holy Spirit on every team today.',
    },
    {
      category: 'shepherding',
      reference: 'John 21:15-17',
      text: 'He saith unto him, Feed my lambs... Feed my sheep.',
      theme: 'The Shepherd’s Sacred Trust',
      exhortation: 'The purest demonstration of our love for Christ is faithful shepherd-care over His flock. Call, visit, and pray over every convert on your roster until they are established.',
      prayer: 'Lord, give us persistent love to follow up on every convert until Christ is formed in them.',
    },
    {
      category: 'soul_winning',
      reference: 'Luke 15:7',
      text: 'I say unto you, that likewise joy shall be in heaven over one sinner that repenteth, more than over ninety and nine just persons, which need no repentance.',
      theme: 'Joy in the Courts of Heaven',
      exhortation: 'Every single soul led to repentance triggers celebratory joy in heaven! Let us cause heaven to rejoice abundantly through our harvest blitz today!',
      prayer: 'Lord, make our team instruments of great heavenly joy as we bring sinners to repentance.',
    },
    {
      category: 'evangelism',
      reference: '2 Timothy 4:2, 5',
      text: 'Preach the word; be instant in season, out of season... do the work of an evangelist, make full proof of thy ministry.',
      theme: 'Uncompromising Field Endurance',
      exhortation: 'Whether people welcome the word or hesitate, preach Christ with unyielding love. Fulfill your ministry and take your place in the harvest workforce!',
      prayer: 'Lord, make us steadfast and unmovable in preaching the gospel in every season.',
    },
  ];

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a spirit-filled Christian evangelist and pastoral shepherd mentor. 
Generate an inspiring, deeply motivating scripture reflection for field evangelists, church overseers, governors, and bacenta leaders who are conducting outreaches targeting a 5,000 Souls Great Harvest.
Focus on: ${category || customTopic || 'Soul Winning, Evangelism, and Shepherding Discipleship'}.

Return ONLY valid JSON matching this exact structure:
{
  "reference": "Bible Book Chapter:Verse (e.g. Proverbs 11:30 or 2 Timothy 4:5)",
  "text": "Exact or traditional scripture verse text",
  "theme": "Short punchy inspirational theme (e.g. Divine Harvest Fire)",
  "exhortation": "2-3 sentences of passionate, inspiring exhortation to fire up the evangelist or shepherd",
  "prayer": "1-sentence apostolic prayer for the field team"
}`;

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 3500)
      );

      const response: any = await Promise.race([aiPromise, timeoutPromise]);

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        res.json({ success: true, source: 'ai', motivation: parsed });
        return;
      }
    } catch (err) {
      console.warn('Gemini AI generation fallback:', err);
    }
  }

  // Filter fallback scriptures by category if specified
  const filtered = category
    ? fallbackScriptures.filter(
        (s) =>
          s.category === category ||
          (category === 'soul_winning' && s.category === 'soul_winning') ||
          (category === 'evangelism' && s.category === 'evangelism')
      )
    : fallbackScriptures;

  const listToUse = filtered.length > 0 ? filtered : fallbackScriptures;
  const random = listToUse[Math.floor(Math.random() * listToUse.length)];
  res.json({ success: true, source: 'curated', motivation: random });
});

// ========================
// VITE MIDDLEWARE / STATIC SERVING
// ========================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ephesians Outreach Backend] Server running with WebSockets on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
