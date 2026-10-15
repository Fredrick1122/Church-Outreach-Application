/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  OutreachEntry,
  LiveNotification,
  isGeneralOverseer,
  isCouncilOverseer,
  isGovernor,
  isOverseer,
  isLeader,
} from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getOutreachesForUser,
  getPendingSyncCount,
  subscribeToStore,
  refreshAllFromServer,
  getUsers,
} from './services/storage';
import { Users } from 'lucide-react';
import { RegisteredPeopleView } from './components/RegisteredPeopleView';
import {
  initRealtime,
  subscribeToRealtimeNotifications,
  subscribeToPresence,
  getLiveNotifications,
} from './services/realtime';
import { Navbar, NavTab } from './components/Navbar';
import { FieldEntryForm } from './components/FieldEntryForm';
import { AdminDashboard } from './components/AdminDashboard';
import { OverseerDashboard } from './components/OverseerDashboard';
import { CouncilOverseerDashboard } from './components/CouncilOverseerDashboard';
import { GovernorDashboard } from './components/GovernorDashboard';
import { LeaderDashboard } from './components/LeaderDashboard';
import { OperationsTable } from './components/OperationsTable';
import { ConvertsDirectory } from './components/ConvertsDirectory';
import { AuditTrailView } from './components/AuditTrailView';
import { LoginAccountSpaceModal } from './components/LoginAccountSpaceModal';
import { RegisterUserModal } from './components/RegisterUserModal';
import { PrintableReportModal } from './components/PrintableReportModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { LiveNotificationToasts } from './components/LiveNotificationToasts';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AiScriptureMotivationModal } from './components/AiScriptureMotivationModal';

export default function App() {
  const [currentUser, setUserState] = useState<UserProfile | null>(getCurrentUser);
  const [outreaches, setOutreaches] = useState<OutreachEntry[]>(() =>
    getOutreachesForUser(currentUser)
  );
  const [activeTab, setActiveTab] = useState<NavTab>('form');
  const [adminViewMode, setAdminViewMode] = useState<'overseer' | 'analytics'>('overseer');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(getPendingSyncCount);

  // Real-time Notifications & Presence
  const [notifications, setNotifications] = useState<LiveNotification[]>(getLiveNotifications);
  const [presenceCount, setPresenceCount] = useState<number>(1);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isScriptureModalOpen, setIsScriptureModalOpen] = useState(false);
  const [scriptureInitialTab, setScriptureInitialTab] = useState<'soul_winning' | 'evangelism' | 'shepherding' | 'all'>('soul_winning');

  // Theme State: White (Light) or Dark Mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('ephesians_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ephesians_theme', next);
      return next;
    });
  };

  const handleOpenScriptures = (tab: 'soul_winning' | 'evangelism' | 'shepherding' | 'all' = 'soul_winning') => {
    setScriptureInitialTab(tab);
    setIsScriptureModalOpen(true);
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
  }, [theme]);

  // Initialize and keep Real-Time WebSocket in sync with active user
  useEffect(() => {
    refreshAllFromServer();
  }, []);

  useEffect(() => {
    if (currentUser) {
      initRealtime(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubNotif = subscribeToRealtimeNotifications((notifs) => {
      setNotifications(notifs);
    });
    const unsubPresence = subscribeToPresence((count) => {
      setPresenceCount(count);
    });
    return () => {
      unsubNotif();
      unsubPresence();
    };
  }, []);

  // Subscribe to storage updates
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      const user = getCurrentUser();
      setUserState(user);
      setOutreaches(getOutreachesForUser(user));
      setPendingSyncCount(getPendingSyncCount());
    });
    return unsubscribe;
  }, []);

  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setUserState(user);
    setOutreaches(getOutreachesForUser(user));
    initRealtime(user);
    // When any leader's account is clicked, open directly to their leader account or dashboard!
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserState(null);
    setOutreaches([]);
    setActiveTab('form');
  };

  const handleSelectTab = (tab: NavTab) => {
    // If user is not logged in as any position, they cannot access anywhere outside the upload form
    if (!currentUser && tab !== 'form') {
      setIsAccountModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isGeneralOverseerUser = currentUser?.role === 'general_overseer';
  const isCouncilOverseerUser = currentUser ? isCouncilOverseer(currentUser.role) : false;
  const isGov = currentUser ? isGovernor(currentUser.role) : false;
  const isLeaderUser = currentUser ? isLeader(currentUser.role) : false;
  const isOverseerRole = currentUser ? (isAdmin || isGeneralOverseer(currentUser.role) || isCouncilOverseerUser) : false;
  const hasDashboardAccess = Boolean(currentUser);
  const hasLedgerAccess = Boolean(currentUser && (isAdmin || isOverseerRole || isGov || isLeaderUser));
  const hasAuditAccess = Boolean(currentUser && (isAdmin || isOverseerRole));
  const hasPeopleAccess = Boolean(currentUser && isAdmin);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Real-time Floating Notification Push Toasts */}
      <LiveNotificationToasts onNavigateToTab={(tab) => handleSelectTab(tab)} />

      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        onOpenAccountSwitcher={() => setIsAccountModalOpen(true)}
        onLogout={handleLogout}
        pendingSyncCount={pendingSyncCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenScriptureMotivation={handleOpenScriptures}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {/* Active Leader Session Switcher Banner */}
        {currentUser && currentUser.id !== 'user_admin_1' && currentUser.email?.toLowerCase() !== 'dogbatseyfredrick@gmail.com' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-emerald-200 truncate">
                Active Leader Space: <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle} · {currentUser.council})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const leadAdmin = getUsers().find((u) => u.id === 'user_admin_1' || u.email?.toLowerCase() === 'dogbatseyfredrick@gmail.com');
                  if (leadAdmin) handleSelectUser(leadAdmin);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                ← Return to Lead Admin
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leader')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Leaders Directory
              </button>
            </div>
          </div>
        )}

        {activeTab === 'form' && (
          <FieldEntryForm
            currentUser={currentUser}
            onSwitchAccount={() => setIsAccountModalOpen(true)}
            onEntrySaved={() => {
              setOutreaches(getOutreachesForUser(currentUser));
            }}
            onOpenScriptureMotivation={handleOpenScriptures}
          />
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            {!hasDashboardAccess ? (
              <AccessRestrictedView
                currentUser={currentUser}
                onSwitchAccount={() => setIsAccountModalOpen(true)}
                onGoToForm={() => setActiveTab('form')}
                attemptedSection="Ministry Dashboards"
              />
            ) : isGov ? (
              /* GOVERNORSHIP DASHBOARD: ACCESS TO ALL BACENTAS UNDER THEIR GOVERNORSHIP ONLY */
              <GovernorDashboard
                outreaches={outreaches}
                currentUser={currentUser!}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
                onNavigateToForm={() => setActiveTab('form')}
                theme={theme}
              />
            ) : isCouncilOverseerUser ? (
              /* COUNCIL OVERSEER DASHBOARD: ACCESS TO THEIR COUNCIL SOLELY */
              <CouncilOverseerDashboard
                outreaches={outreaches}
                currentUser={currentUser!}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
                onNavigateToForm={() => setActiveTab('form')}
              />
            ) : isGeneralOverseerUser ? (
              /* GENERAL OVERSEER DASHBOARD: ACCESS ACROSS BOARD TO ALL COUNCILS */
              <OverseerDashboard
                outreaches={outreaches}
                currentUser={currentUser!}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onNavigateToForm={() => setActiveTab('form')}
                theme={theme}
              />
            ) : isLeaderUser ? (
              /* BACENTA LEADER / FIELD EVANGELIST DASHBOARD */
              <LeaderDashboard
                outreaches={outreaches}
                currentUser={currentUser!}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
                onNavigateToForm={() => setActiveTab('form')}
                onNavigateToLeaders={() => setActiveTab('leader')}
                onNavigateToConverts={() => setActiveTab('converts')}
                theme={theme}
              />
            ) : (
              /* ADMIN: FULL ACCESS WITH SWITCHER BETWEEN BACENTA HIERARCHY & ANALYTICS CHARTS */
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">
                      Admin Command View:
                    </span>
                    <button
                      onClick={() => setAdminViewMode('overseer')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        adminViewMode === 'overseer'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Apostolic Bacenta Hierarchy & Database
                    </button>
                    <button
                      onClick={() => setAdminViewMode('analytics')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        adminViewMode === 'analytics'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Analytics Charts & Thresholds
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('leader')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Registered Leaders ({getUsers().length})</span>
                    </button>
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700/80 transition-colors cursor-pointer"
                    >
                      + Register Leadership Account
                    </button>
                  </div>
                </div>

                {adminViewMode === 'overseer' ? (
                  <OverseerDashboard
                    outreaches={outreaches}
                    currentUser={currentUser!}
                    onOpenReportPrint={() => setIsPrintModalOpen(true)}
                    onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                    onNavigateToForm={() => setActiveTab('form')}
                    theme={theme}
                  />
                ) : (
                  <AdminDashboard
                    outreaches={outreaches}
                    currentUser={currentUser!}
                    onOpenReportPrint={() => setIsPrintModalOpen(true)}
                    onNavigateToConverts={() => setActiveTab('converts')}
                    onNavigateToLog={() => setActiveTab('operations')}
                    onNavigateToForm={() => setActiveTab('form')}
                    onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                    theme={theme}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* OPERATIONS LOG TAB */}
        {activeTab === 'operations' && (
          <>
            {!hasLedgerAccess ? (
              <AccessRestrictedView
                currentUser={currentUser}
                onSwitchAccount={() => setIsAccountModalOpen(true)}
                onGoToForm={() => setActiveTab('form')}
                attemptedSection="Operations Master Ledger"
              />
            ) : (
              <OperationsTable
                outreaches={outreaches}
                currentUser={currentUser!}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
              />
            )}
          </>
        )}

        {/* CONVERTS CRM TAB */}
        {activeTab === 'converts' && (
          <>
            {!hasLedgerAccess ? (
              <AccessRestrictedView
                currentUser={currentUser}
                onSwitchAccount={() => setIsAccountModalOpen(true)}
                onGoToForm={() => setActiveTab('form')}
                attemptedSection="Converts CRM Directory"
              />
            ) : (
              <ConvertsDirectory
                outreaches={outreaches}
                currentUser={currentUser!}
              />
            )}
          </>
        )}

        {/* STORAGE & AUDIT TAB */}
        {activeTab === 'audit' && (
          <>
            {!hasAuditAccess ? (
              <AccessRestrictedView
                currentUser={currentUser}
                onSwitchAccount={() => setIsAccountModalOpen(true)}
                onGoToForm={() => setActiveTab('form')}
                attemptedSection="Storage & Audit Logs"
              />
            ) : (
              <AuditTrailView currentUser={currentUser!} />
            )}
          </>
        )}

        {/* REGISTERED LEADERS & LEADERSHIP DIRECTORY */}
        {(activeTab === 'people' || activeTab === 'leader') && (
          <>
            {!hasPeopleAccess ? (
              <AccessRestrictedView
                currentUser={currentUser}
                onSwitchAccount={() => setIsAccountModalOpen(true)}
                onGoToForm={() => setActiveTab('form')}
                attemptedSection="Registered Leaders & Leadership Directory"
              />
            ) : (
              <RegisteredPeopleView
                currentUser={currentUser!}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                theme={theme}
                onSelectUser={handleSelectUser}
              />
            )}
          </>
        )}
      </main>

      {/* Real-time Notification Center Modal Drawer */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        currentUser={currentUser}
        presenceCount={presenceCount}
        onNavigateToTab={(tab) => {
          setIsNotificationModalOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Ministry Login & Account Space Modal */}
      <LoginAccountSpaceModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
      />

      {/* Admin User Registration Modal (Register Overseer / Governor) */}
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        currentUser={currentUser}
        onUserRegistered={(newUser) => {
          handleSelectUser(newUser);
        }}
      />

      {/* Official Printable Ministry Report */}
      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        outreaches={outreaches}
        currentUser={currentUser}
      />

      {/* AI Pop-up Scripture Motivation (Evangelism, Soul Winning, Shepherding) */}
      <AiScriptureMotivationModal
        isOpen={isScriptureModalOpen}
        onClose={() => setIsScriptureModalOpen(false)}
        initialTab={scriptureInitialTab}
        totalSoulsHarvested={outreaches.reduce((sum, o) => sum + (o.soulsWonCount || 0), 0)}
      />
    </div>
  );
}
