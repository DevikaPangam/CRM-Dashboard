import React, { useEffect } from 'react';
import { useCRM } from './context/CRMContext';
import { useAuth } from './context/AuthContext';
import { useRBAC } from './context/RBACContext';
import { ProtectedModule } from './components/common/ProtectedModule';
import { TAB_MODULE_ACCESS_MAP, getAuthorizedDefaultTab } from './constants/moduleAccess';
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
  const { currentTab, setCurrentTab } = useCRM();
  const { authState, isLoading } = useAuth();
  const { can } = useRBAC();

  // Automatic Tab Sanitization:
  // If currentTab points to a restricted, unknown, or deprecated tab for the logged in user,
  // automatically transition to the first authorized default tab.
  useEffect(() => {
    if (isLoading || authState !== 'AUTHENTICATED') return;

    const accessReq = TAB_MODULE_ACCESS_MAP[currentTab];
    const isCurrentAuthorized = accessReq ? can(accessReq.module, accessReq.action) : false;

    if (!isCurrentAuthorized) {
      const defaultTab = getAuthorizedDefaultTab(can);
      if (currentTab !== defaultTab) {
        setCurrentTab(defaultTab);
      }
    }
  }, [currentTab, can, isLoading, authState, setCurrentTab]);

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

  // 3. Authenticated & Protected CRM Application Tab Router
  const renderActiveTab = () => {
    switch (currentTab) {
      case 'tab-dashboard':
        return (
          <ProtectedModule moduleKey="dashboard" action="view">
            <DashboardTab />
          </ProtectedModule>
        );
      case 'tab-clients':
        return (
          <ProtectedModule moduleKey="clients" action="view">
            <ClientsTab />
          </ProtectedModule>
        );
      case 'tab-employee-master':
        return (
          <ProtectedModule moduleKey="team" action="view">
            <EmployeeMasterTab />
          </ProtectedModule>
        );
      case 'tab-team':
        return (
          <ProtectedModule moduleKey="team" action="view">
            <TeamTab />
          </ProtectedModule>
        );
      case 'tab-employee-profile':
        return (
          <ProtectedModule moduleKey="team" action="view">
            <EmployeeProfileTab />
          </ProtectedModule>
        );
      case 'tab-segments':
        return (
          <ProtectedModule moduleKey="segments" action="view">
            <SegmentsTab />
          </ProtectedModule>
        );
      case 'tab-opportunities':
        return (
          <ProtectedModule moduleKey="opportunities" action="view">
            <OpportunitiesTab />
          </ProtectedModule>
        );
      case 'tab-calculator':
        return (
          <ProtectedModule moduleKey="calculator" action="view">
            <ProposalCalculatorTab />
          </ProtectedModule>
        );
      case 'tab-activities':
        return (
          <ProtectedModule moduleKey="activities" action="view">
            <ActivitiesTab />
          </ProtectedModule>
        );
      case 'tab-followups':
        return (
          <ProtectedModule moduleKey="followups" action="view">
            <FollowupsTab />
          </ProtectedModule>
        );
      case 'tab-internal':
        return (
          <ProtectedModule moduleKey="internal" action="view">
            <InternalTab />
          </ProtectedModule>
        );
      case 'tab-documents':
        return (
          <ProtectedModule moduleKey="documents" action="view">
            <DocumentsTab />
          </ProtectedModule>
        );
      case 'tab-review':
        return (
          <ProtectedModule moduleKey="review" action="view">
            <ReviewTab />
          </ProtectedModule>
        );
      case 'tab-users':
        return (
          <ProtectedModule moduleKey="users" action="view">
            <UsersTab />
          </ProtectedModule>
        );
      default:
        return (
          <ProtectedModule moduleKey="dashboard" action="view">
            <DashboardTab />
          </ProtectedModule>
        );
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
