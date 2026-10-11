/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, OutreachEntry } from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getOutreachesForUser,
  getPendingSyncCount,
  subscribeToStore,
} from './services/storage';
import { Navbar, NavTab } from './components/Navbar';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { FieldEntryForm } from './components/FieldEntryForm';
import { AdminDashboard } from './components/AdminDashboard';
import { OperationsTable } from './components/OperationsTable';
import { ConvertsDirectory } from './components/ConvertsDirectory';
import { AuditTrailView } from './components/AuditTrailView';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import { PrintableReportModal } from './components/PrintableReportModal';

export default function App() {
  const [currentUser, setUserState] = useState<UserProfile>(getCurrentUser);
  const [outreaches, setOutreaches] = useState<OutreachEntry[]>(() =>
    getOutreachesForUser(currentUser)
  );
  const [activeTab, setActiveTab] = useState<NavTab>('form');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(getPendingSyncCount);

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Network & Offline Status Banner */}
      <OfflineStatusBar onSyncComplete={() => setOutreaches(getOutreachesForUser(currentUser))} />

      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenAccountSwitcher={() => setIsAccountModalOpen(true)}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'form' && (
          <FieldEntryForm
            currentUser={currentUser}
            onSwitchAccount={() => setIsAccountModalOpen(true)}
            onEntrySaved={(newEntry) => {
              setOutreaches(getOutreachesForUser(currentUser));
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <AdminDashboard
            outreaches={outreaches}
            currentUser={currentUser}
            onOpenReportPrint={() => setIsPrintModalOpen(true)}
            onNavigateToConverts={() => setActiveTab('converts')}
            onNavigateToLog={() => setActiveTab('operations')}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsTable
            outreaches={outreaches}
            currentUser={currentUser}
            onOpenReportPrint={() => setIsPrintModalOpen(true)}
          />
        )}

        {activeTab === 'converts' && (
          <ConvertsDirectory
            outreaches={outreaches}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView currentUser={currentUser} />
        )}
      </main>

      {/* Account Switcher Modal (Multi-Level Authentication & RBAC) */}
      <AccountSwitcherModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
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
