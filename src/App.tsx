import React from 'react';
import { useCRM } from './context/CRMContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { DashboardTab } from './components/tabs/DashboardTab';
import { ClientsTab } from './components/tabs/ClientsTab';
import { TeamTab } from './components/tabs/TeamTab';
import { SegmentsTab } from './components/tabs/SegmentsTab';
import { OpportunitiesTab } from './components/tabs/OpportunitiesTab';
import { ActivitiesTab } from './components/tabs/ActivitiesTab';
import { FollowupsTab } from './components/tabs/FollowupsTab';
import { InternalTab } from './components/tabs/InternalTab';
import { DocumentsTab } from './components/tabs/DocumentsTab';
import { ReviewTab } from './components/tabs/ReviewTab';
import { UsersTab } from './components/tabs/UsersTab';
import { GlobalModals } from './components/modals/GlobalModals';

export const App: React.FC = () => {
  const { currentTab } = useCRM();

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'tab-dashboard':
        return <DashboardTab />;
      case 'tab-clients':
        return <ClientsTab />;
      case 'tab-team':
        return <TeamTab />;
      case 'tab-segments':
        return <SegmentsTab />;
      case 'tab-opportunities':
        return <OpportunitiesTab />;
      case 'tab-activities':
        return <ActivitiesTab />;
      case 'tab-followups':
        return <FollowupsTab />;
      case 'tab-internal':
        return <InternalTab />;
      case 'tab-documents':
        return <DocumentsTab />;
      case 'tab-review':
        return <ReviewTab />;
      case 'tab-users':
        return <UsersTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />
      <Navigation />
      <main className="app-container">{renderActiveTab()}</main>
      <GlobalModals />
    </div>
  );
};
