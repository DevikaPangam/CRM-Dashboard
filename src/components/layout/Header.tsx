import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase, Search, ChevronDown, PlusCircle, Building, TrendingUp, Users,
  PhoneCall, FileText, GitPullRequest, UserPlus, Layers, ShieldPlus, Shield, RotateCcw
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    currency,
    toggleCurrency,
    searchQuery,
    setSearchQuery,
    openModal,
    setCurrentTab,
    resetToFactoryData
  } = useCRM();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="app-header">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Briefcase size={20} />
        </div>
        <div className="brand-title">
          <h1>CorpBD CRM</h1>
          <span>Management &amp; Pipeline Suite</span>
        </div>
      </div>

      {/* Global Instant Search */}
      <div className="header-center-search">
        <Search size={16} className="search-icon-pos" />
        <input
          type="text"
          placeholder="Search clients, opportunities, contacts, BD owners..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* User Switcher / Account info */}
        <div className="user-switcher-container" ref={userMenuRef}>
          <button
            className="user-switcher-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title="Switch User / Account Settings"
          >
            <div className="user-avatar-circle">{getInitials(currentUser.name)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>{currentUser.name}</span>
              <span
                className="user-role-badge-pill"
                style={{
                  background: currentUser.role === 'System Administrator' ? 'linear-gradient(135deg, #10b981, #059669)' : '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700
                }}
              >
                {currentUser.role.toUpperCase()}
              </span>
            </div>
            <ChevronDown size={14} style={{ opacity: 0.8 }} />
          </button>

          {userMenuOpen && (
            <div className="user-switcher-dropdown">
              <div className="user-dropdown-header">Switch Active User (RBAC Demo)</div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {users.map(u => (
                  <div
                    key={u.id}
                    className={`user-select-item ${u.id === currentUser.id ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentUser(u);
                      setUserMenuOpen(false);
                    }}
                  >
                    <div className="user-avatar-circle" style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                      {getInitials(u.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{u.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.role}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 12px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  className="btn btn-secondary btn-xs"
                  style={{ width: '100%', marginBottom: '6px' }}
                  onClick={() => {
                    setCurrentTab('tab-users');
                    setUserMenuOpen(false);
                  }}
                >
                  <Shield size={12} /> Manage Users &amp; Permissions
                </button>
                <button
                  className="btn btn-secondary btn-xs"
                  style={{ width: '100%' }}
                  onClick={() => {
                    resetToFactoryData();
                    setUserMenuOpen(false);
                  }}
                >
                  <RotateCcw size={12} /> Reset Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Currency Toggle */}
        <button className="currency-toggle-btn" onClick={toggleCurrency} title="Toggle Currency (₹ INR / $ USD)">
          <span>{currency === 'INR' ? '₹ INR (L/Cr)' : '$ USD (K/M)'}</span>
        </button>

        {/* Quick Add Menu */}
        <div className="dropdown-quick-add" ref={quickAddRef}>
          <button className="quick-add-btn" onClick={() => setQuickAddOpen(!quickAddOpen)}>
            <PlusCircle size={16} />
            <span>+ Quick Action</span>
            <ChevronDown size={14} />
          </button>

          {quickAddOpen && (
            <div className="dropdown-menu-list">
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addClient');
                  setQuickAddOpen(false);
                }}
              >
                <Building size={15} style={{ color: '#0284c7' }} />
                <span>+ Add New Client</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addOpportunity');
                  setQuickAddOpen(false);
                }}
              >
                <TrendingUp size={15} style={{ color: '#16a34a' }} />
                <span>+ Add New Opportunity</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addActivity', { type: 'Physical Meeting' });
                  setQuickAddOpen(false);
                }}
              >
                <Users size={15} style={{ color: '#2563eb' }} />
                <span>+ Log Meeting</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addActivity', { type: 'Phone Call' });
                  setQuickAddOpen(false);
                }}
              >
                <PhoneCall size={15} style={{ color: '#0284c7' }} />
                <span>+ Log Phone Call</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addActivity', { type: 'Proposal Discussion' });
                  setQuickAddOpen(false);
                }}
              >
                <FileText size={15} style={{ color: '#8b5cf6' }} />
                <span>+ Log Proposal / Commercial</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addInternal');
                  setQuickAddOpen(false);
                }}
              >
                <GitPullRequest size={15} style={{ color: '#d97706' }} />
                <span>+ Log Internal Task</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addTeam');
                  setQuickAddOpen(false);
                }}
              >
                <UserPlus size={15} style={{ color: '#0284c7' }} />
                <span>+ Add BD Team Member</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addSegment');
                  setQuickAddOpen(false);
                }}
              >
                <Layers size={15} style={{ color: '#10b981' }} />
                <span>+ Add Business Segment</span>
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => {
                  openModal('addUser');
                  setQuickAddOpen(false);
                }}
              >
                <ShieldPlus size={15} style={{ color: '#dc2626' }} />
                <span>+ Add User &amp; Permissions</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
