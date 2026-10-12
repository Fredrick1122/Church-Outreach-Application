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
} from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getOutreachesForUser,
  getPendingSyncCount,
  subscribeToStore,
  refreshAllFromServer,
} from './services/storage';
import {
  initRealtime,
  subscribeToRealtimeNotifications,
  subscribeToPresence,
  getLiveNotifications,
} from './services/realtime';
import { Navbar, NavTab } from './components/Navbar';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { FieldEntryForm } from './components/FieldEntryForm';
import { AdminDashboard } from './components/AdminDashboard';
import { OverseerDashboard } from './components/OverseerDashboard';
import { GovernorDashboard } from './components/GovernorDashboard';
import { OperationsTable } from './components/OperationsTable';
import { ConvertsDirectory } from './components/ConvertsDirectory';
import { AuditTrailView } from './components/AuditTrailView';
import { LoginAccountSpaceModal } from './components/LoginAccountSpaceModal';
import { RegisterUserModal } from './components/RegisterUserModal';
import { PrintableReportModal } from './components/PrintableReportModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { LiveNotificationToasts } from './components/LiveNotificationToasts';
import { NotificationCenterModal } from './components/NotificationCenterModal';

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
    // Route user to their oversight dashboard automatically
    if (isGeneralOverseer(user.role) || isCouncilOverseer(user.role) || isGovernor(user.role)) {
      setActiveTab('dashboard');
    }
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
  const isOverseerRole = currentUser ? (isGeneralOverseer(currentUser.role) || isCouncilOverseerUser) : false;
  const hasDashboardAccess = Boolean(currentUser && (isOverseerRole || isGov));
  const hasLedgerAccess = Boolean(currentUser && (isOverseerRole || isGov));

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Real-time Floating Notification Push Toasts */}
      <LiveNotificationToasts onNavigateToTab={(tab) => handleSelectTab(tab)} />

      {/* Network & Offline Status Banner */}
      <OfflineStatusBar onSyncComplete={() => setOutreaches(getOutreachesForUser(currentUser))} />

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
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'form' && (
          <FieldEntryForm
            currentUser={currentUser}
            onSwitchAccount={() => setIsAccountModalOpen(true)}
            onEntrySaved={() => {
              setOutreaches(getOutreachesForUser(currentUser));
            }}
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
                currentUser={currentUser}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
                onNavigateToForm={() => setActiveTab('form')}
              />
            ) : isCouncilOverseerUser ? (
              /* COUNCIL OVERSEER DASHBOARD: ACCESS TO THEIR COUNCIL SOLELY */
              <OverseerDashboard
                outreaches={outreaches}
                currentUser={currentUser}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onNavigateToForm={() => setActiveTab('form')}
              />
            ) : isGeneralOverseerUser ? (
              /* GENERAL OVERSEER DASHBOARD: ACCESS ACROSS BOARD TO ALL 5 COUNCILS (BISHOP ISAAC NAKOJA) */
              <OverseerDashboard
                outreaches={outreaches}
                currentUser={currentUser}
                onOpenReportPrint={() => setIsPrintModalOpen(true)}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onNavigateToForm={() => setActiveTab('form')}
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

                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700/80 transition-colors"
                  >
                    + Register Overseer / Governor
                  </button>
                </div>

                {adminViewMode === 'overseer' ? (
                  <OverseerDashboard
                    outreaches={outreaches}
                    currentUser={currentUser}
                    onOpenReportPrint={() => setIsPrintModalOpen(true)}
                    onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                    onNavigateToForm={() => setActiveTab('form')}
                  />
                ) : (
                  <AdminDashboard
                    outreaches={outreaches}
                    currentUser={currentUser}
                    onOpenReportPrint={() => setIsPrintModalOpen(true)}
                    onNavigateToConverts={() => setActiveTab('converts')}
                    onNavigateToLog={() => setActiveTab('operations')}
                    onNavigateToForm={() => setActiveTab('form')}
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
                currentUser={currentUser}
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
                currentUser={currentUser}
              />
            )}
          </>
        )}

        {/* STORAGE & AUDIT TAB */}
        {activeTab === 'audit' && (
          <>
            {!isOverseerRole ? (
              <AccessRestrictedView
                currentUser={currentUser}
                onSwitchAccount={() => setIsAccountModalOpen(true)}
                onGoToForm={() => setActiveTab('form')}
                attemptedSection="Storage & Audit Logs"
              />
            ) : (
              <AuditTrailView currentUser={currentUser} />
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
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
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
    </div>
  );
}
