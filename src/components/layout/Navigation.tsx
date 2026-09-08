import React, { useState } from 'react';
import {
  LayoutDashboard, Building2, UserCheck, Layers, GitBranch, Calendar,
  Clock, Workflow, Paperclip, Presentation, ShieldCheck, RotateCcw, Download,
  Calculator, ChevronLeft, ChevronRight, Sparkles, Database
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

interface NavTabItem {
  id: string;
  label: string;
  fullLabel: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeStyle?: React.CSSProperties;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  tabs: NavTabItem[];
}

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

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const overdueFollowupsCount = followups.filter(f => {
    if (f.status === 'Completed') return false;
    const due = new Date(f.dueDate).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const sections: NavSection[] = [
    {
      title: 'CORE MODULES',
      tabs: [
        {
          id: 'tab-dashboard',
          label: 'Dashboard',
          fullLabel: 'Management Dashboard',
          icon: <LayoutDashboard size={18} />,
        },
        {
          id: 'tab-clients',
          label: 'Client Master',
          fullLabel: 'Corporate Client Master',
          icon: <Building2 size={18} />,
          badge: clients.length,
        },
        {
          id: 'tab-team',
          label: 'BD Team',
          fullLabel: 'BD Team & Owners',
          icon: <UserCheck size={18} style={{ color: '#0284c7' }} />,
          badge: teamMembers.length,
        },
        {
          id: 'tab-segments',
          label: 'Business Segments',
          fullLabel: 'Business Segments',
          icon: <Layers size={18} style={{ color: '#10b981' }} />,
          badge: segments.length,
        },
      ]
    },
    {
      title: 'SALES & PROPOSALS',
      tabs: [
        {
          id: 'tab-opportunities',
          label: 'Opportunities',
          fullLabel: 'Leads & Opportunities',
          icon: <GitBranch size={18} />,
          badge: opportunities.length,
        },
        {
          id: 'tab-calculator',
          label: 'Proposal Calculator',
          fullLabel: 'Proposal Calculator',
          icon: <Calculator size={18} style={{ color: '#f59e0b' }} />,
          badge: 'Formula',
          badgeStyle: { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' },
        },
        {
          id: 'tab-activities',
          label: 'Interactions',
          fullLabel: 'Engagement & Interactions',
          icon: <Calendar size={18} />,
          badge: activities.length,
        },
        {
          id: 'tab-followups',
          label: 'Follow-up Tracker',
          fullLabel: 'Follow-up Tracker',
          icon: <Clock size={18} />,
          badge: overdueFollowupsCount > 0 ? `${overdueFollowupsCount} Due` : `${followups.length}`,
          badgeStyle: overdueFollowupsCount > 0 ? { background: '#fee2e2', color: '#dc2626', fontWeight: 700 } : {},
        },
      ]
    },
    {
      title: 'OPERATIONS & REVIEW',
      tabs: [
        {
          id: 'tab-internal',
          label: 'Internal Tasks',
          fullLabel: 'Internal BD Activities',
          icon: <Workflow size={18} />,
          badge: internalTasks.length,
        },
        {
          id: 'tab-documents',
          label: 'Stage Documents',
          fullLabel: 'Stage Documents',
          icon: <Paperclip size={18} style={{ color: '#ec4899' }} />,
          badge: documents.length,
        },
        {
          id: 'tab-review',
          label: 'MMR Review',
          fullLabel: 'Monthly Management Review',
          icon: <Presentation size={18} style={{ color: '#8b5cf6' }} />,
        },
      ]
    },
    {
      title: 'ADMINISTRATION',
      tabs: [
        {
          id: 'tab-users',
          label: 'Users & Permissions',
          fullLabel: 'Users & Permissions',
          icon: <ShieldCheck size={18} style={{ color: '#dc2626' }} />,
          badge: users.length,
          adminOnly: true,
        },
      ]
    }
  ];

  const filterTab = (tab: NavTabItem) => {
    if (currentUser.role === 'System Administrator') return true;
    if (tab.adminOnly) return false;
    return currentUser.allowed_tabs?.includes(tab.id);
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Collapse Toggle */}
      <div className="sidebar-top-bar">
        {!isCollapsed && (
          <div className="sidebar-brand-sub">
            <span className="sidebar-nav-title">WORKSPACE MODULES</span>
          </div>
        )}
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav-container">
        {sections.map((section, sIdx) => {
          const visibleTabs = section.tabs.filter(filterTab);
          if (visibleTabs.length === 0) return null;

          return (
            <div key={sIdx} className="sidebar-section">
              {!isCollapsed && (
                <div className="sidebar-section-header">
                  <span>{section.title}</span>
                </div>
              )}
              <ul className="sidebar-menu-list">
                {visibleTabs.map(tab => {
                  const isActive = currentTab === tab.id;
                  return (
                    <li
                      key={tab.id}
                      className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                      onClick={() => setCurrentTab(tab.id)}
                      title={tab.fullLabel}
                    >
                      <div className="sidebar-item-icon">{tab.icon}</div>
                      {!isCollapsed && (
                        <>
                          <span className="sidebar-item-label">{tab.fullLabel}</span>
                          {tab.badge !== undefined && (
                            <span className="sidebar-item-badge" style={tab.badgeStyle}>
                              {tab.badge}
                            </span>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Sidebar Bottom Footer Actions */}
      <div className="sidebar-footer">
        {!isCollapsed ? (
          <>
            <div className="sidebar-footer-actions">
              <button
                type="button"
                className="sidebar-footer-btn"
                onClick={resetToFactoryData}
                title="Reset to realistic factory sample data"
              >
                <RotateCcw size={13} />
                <span>Reset Data</span>
              </button>
              <button
                type="button"
                className="sidebar-footer-btn"
                onClick={exportBackup}
                title="Backup full CRM database as JSON"
              >
                <Download size={13} />
                <span>Backup</span>
              </button>
            </div>
            <div className="sidebar-version-badge">
              <span>CorpBD Suite v2.0 • Active</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              className="sidebar-footer-icon-btn"
              onClick={resetToFactoryData}
              title="Reset Data"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              className="sidebar-footer-icon-btn"
              onClick={exportBackup}
              title="Backup Data"
            >
              <Download size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
