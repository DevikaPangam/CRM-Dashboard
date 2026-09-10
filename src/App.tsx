import React from 'react';
import { useCRM } from './context/CRMContext';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
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
import { ProposalCalculatorTab } from './components/tabs/ProposalCalculatorTab';
import { EmployeeProfileTab } from './components/tabs/EmployeeProfileTab';
import { EmployeeMasterTab } from './components/tabs/EmployeeMasterTab';
import { GlobalModals } from './components/modals/GlobalModals';
import { RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { currentTab } = useCRM();
  const { authState, isLoading, isCloudConnected } = useAuth();

  // 1. Initial Session Loading Screen
  if (isLoading) {
    return (
      <div className="login-screen-wrapper">
        <div style={{ textAlign: 'center', color: '#0284c7' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
            Initializing Secure CRM Session...
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated / Access Guard Screen
  if (
    authState === 'UNAUTHENTICATED' ||
    authState === 'PROFILE_NOT_FOUND' ||
    authState === 'ACCOUNT_SUSPENDED'
  ) {
    return <LoginPage />;
  }

  // 3. Authenticated CRM Application
  const renderActiveTab = () => {
    switch (currentTab) {
      case 'tab-dashboard':
        return <DashboardTab />;
      case 'tab-clients':
        return <ClientsTab />;
      case 'tab-employee-master':
        return <EmployeeMasterTab />;
      case 'tab-team':
        return <TeamTab />;
      case 'tab-segments':
        return <SegmentsTab />;
      case 'tab-opportunities':
        return <OpportunitiesTab />;
      case 'tab-calculator':
        return <ProposalCalculatorTab />;
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
      case 'tab-employee-profile':
        return <EmployeeProfileTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />
      <div className="app-layout-wrapper">
        <Navigation />
        <main className="app-container">{renderActiveTab()}</main>
      </div>
      <GlobalModals />
    </div>
  );
};

