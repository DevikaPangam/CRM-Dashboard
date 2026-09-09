import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase, Search, ChevronDown, PlusCircle, Building, TrendingUp, Users,
  PhoneCall, FileText, GitPullRequest, UserPlus, Layers, ShieldPlus, Shield, RotateCcw, LogOut
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';

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

  const {
    profile,
    authUser,
    organization,
    signOut,
    isCloudConnected
  } = useAuth();

  const displayName =
    (profile?.full_name && profile.full_name !== 'System Administrator')
      ? profile.full_name
      : (currentUser?.name && currentUser.name !== 'System Administrator')
      ? currentUser.name
      : (authUser?.email ? authUser.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Devika Pangam');

  const displayRole =
    (profile?.role === 'super_admin' || currentUser?.role === 'System Administrator' || currentUser?.role_name === 'super_admin')
      ? 'Super Admin'
      : (profile?.role || currentUser?.role || 'Super Admin');

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

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to log out of CorpBD CRM?')) {
      setUserMenuOpen(false);
      await signOut();
    }
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
            title="User Profile & Account Settings"
          >
            <div className="user-avatar-circle">{getInitials(displayName)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>{displayName}</span>
              <span
                className="user-role-badge-pill"
                style={{
                  background: displayRole.includes('Admin') || displayRole.includes('super_admin') 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700
                }}
              >
                {displayRole.toUpperCase()}
              </span>
            </div>
            <ChevronDown size={14} style={{ opacity: 0.8 }} />
          </button>

          {userMenuOpen && (
            <div className="user-switcher-dropdown">
              <div className="user-dropdown-header">
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{organization?.name || 'Rajmudra Group'}</div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                  {profile?.email || authUser?.email || currentUser.email}
                </div>
              </div>

              {!isCloudConnected && (
                <>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f8fafc' }}>
                    Switch Active User (Offline Demo)
                  </div>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
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
                </>
              )}

              <div style={{ padding: '8px 12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  className="btn btn-secondary btn-xs"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setCurrentTab('tab-users');
                    setUserMenuOpen(false);
                  }}
                >
                  <Shield size={12} /> Users &amp; Permissions
                </button>
                <button
                  className="btn btn-danger btn-xs"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handleSignOut}
                >
                  <LogOut size={13} /> Log Out (Sign Out)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Visible Log Out Button */}
        <button
          className="header-logout-btn"
          onClick={handleSignOut}
          title="Log Out of CorpBD CRM"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'rgba(239, 68, 68, 0.18)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <LogOut size={14} style={{ color: '#ef4444' }} />
          <span>Log Out</span>
        </button>

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
