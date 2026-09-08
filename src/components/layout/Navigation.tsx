import React from 'react';
import {
  LayoutDashboard, Building2, UserCheck, Layers, GitBranch, Calendar,
  Clock, Workflow, Paperclip, Presentation, ShieldCheck, RotateCcw, Download, Calculator
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const Navigation: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    currentUser,
    clients,
    teamMembers,
    segments,
    opportunities,
    activities,
    followups,
    internalTasks,
    documents,
    users,
    resetToFactoryData,
    exportBackup
  } = useCRM();

  const overdueFollowupsCount = followups.filter(f => {
    if (f.status === 'Completed') return false;
    const due = new Date(f.dueDate).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const tabs = [
    {
      id: 'tab-dashboard',
      label: 'Management Dashboard',
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: 'tab-clients',
      label: 'Client Master',
      icon: <Building2 size={16} />,
      badge: clients.length,
    },
    {
      id: 'tab-team',
      label: 'BD Team & Owners',
      icon: <UserCheck size={16} style={{ color: '#0284c7' }} />,
      badge: teamMembers.length,
    },
    {
      id: 'tab-segments',
      label: 'Business Segments',
      icon: <Layers size={16} style={{ color: '#10b981' }} />,
      badge: segments.length,
    },
    {
      id: 'tab-opportunities',
      label: 'Leads & Opportunities',
      icon: <GitBranch size={16} />,
      badge: opportunities.length,
    },
    {
      id: 'tab-calculator',
      label: 'Proposal Calculator',
      icon: <Calculator size={16} style={{ color: '#f59e0b' }} />,
      badge: 'Formula',
      badgeStyle: { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' },
    },
    {
      id: 'tab-activities',
      label: 'Engagement & Interactions',
      icon: <Calendar size={16} />,
      badge: activities.length,
    },
    {
      id: 'tab-followups',
      label: 'Follow-up Tracker',
      icon: <Clock size={16} />,
      badge: overdueFollowupsCount > 0 ? `${overdueFollowupsCount} Overdue` : '0 Overdue',
      badgeStyle: overdueFollowupsCount > 0 ? { background: '#fee2e2', color: '#dc2626' } : {},
    },
    {
      id: 'tab-internal',
      label: 'Internal BD Activities',
      icon: <Workflow size={16} />,
      badge: internalTasks.length,
    },
    {
      id: 'tab-documents',
      label: 'Stage Documents',
      icon: <Paperclip size={16} style={{ color: '#ec4899' }} />,
      badge: documents.length,
    },
    {
      id: 'tab-review',
      label: 'Monthly Management Review',
      icon: <Presentation size={16} style={{ color: '#8b5cf6' }} />,
    },
    {
      id: 'tab-users',
      label: 'Users & Permissions',
      icon: <ShieldCheck size={16} style={{ color: '#dc2626' }} />,
      badge: users.length,
      adminOnly: true,
    },
  ];

  // RBAC filtering
  const visibleTabs = tabs.filter(tab => {
    if (currentUser.role === 'System Administrator') return true;
    if (tab.adminOnly) return false;
    return currentUser.allowed_tabs?.includes(tab.id);
  });

  return (
    <nav className="tabs-navigation-bar">
      <ul className="nav-tabs-list">
        {visibleTabs.map(tab => (
          <li
            key={tab.id}
            className={`nav-tab-item ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="badge-count" style={tab.badgeStyle}>
                {tab.badge}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="tab-bar-controls">
        <button
          className="btn btn-secondary"
          onClick={resetToFactoryData}
          title="Reset to realistic factory sample data"
          style={{ fontSize: '11.5px', padding: '4px 9px' }}
        >
          <RotateCcw size={13} />
          <span>Reset Data</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={exportBackup}
          title="Backup full CRM database"
          style={{ fontSize: '11.5px', padding: '4px 9px' }}
        >
          <Download size={13} />
          <span>Backup</span>
        </button>
      </div>
    </nav>
  );
};
