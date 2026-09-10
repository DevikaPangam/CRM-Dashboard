import React, { useState, useMemo } from 'react';
import {
  UserCheck, UserPlus, Target, TrendingUp, Phone, Mail, MapPin, Award,
  Edit3, Trash2, UserX, ShieldAlert, CheckCircle, PowerOff, Building2, Users, Crown,
  Calendar, Search, Filter, RefreshCw, Briefcase, Clock, ShieldCheck, ChevronRight,
  Compass, BarChart3, Activity as ActivityIcon, ArrowUpRight, UserMinus
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, calculateTenure, getPerformanceStatus } from '../../utils/formatters';
import { User } from '../../types/crm';

export const TeamTab: React.FC = () => {
  const { users, opportunities, clients, activities, followups, currency, openModal, updateUser, currentUser } = useCRM();
  const { profile } = useAuth();

  // Active Sub-Tab View Mode: 'team' | 'regional_owners'
  const [activeViewMode, setActiveViewMode] = useState<'team' | 'regional_owners'>('team');

  // Filters State
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'Disabled' | 'All'>('Active');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [designationFilter, setDesignationFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [managerFilter, setManagerFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isSuperAdminOrManager =
    profile?.role === 'super_admin' ||
    profile?.role === 'bd_director' ||
    profile?.role === 'bd_manager' ||
    currentUser?.role === 'System Administrator' ||
    currentUser?.role_name === 'super_admin' ||
    currentUser?.role_name === 'bd_director' ||
    currentUser?.role_name === 'bd_manager';

  // 1. Base Business Development Employees (Single Source of Truth from Unified Users/Profiles)
  const bdEmployees = useMemo(() => {
    return users.filter((u) => {
      const dept = (u.department || '').trim().toLowerCase();
      const role = (u.role_name || u.role || '').toLowerCase();

      // Explicit non-BD departments (Operations, Maintenance, Finance, Legal, HR, etc.) must not appear in BD Team
      const isNonBDDept =
        dept === 'operations' ||
        dept === 'ops' ||
        dept === 'centralised operations' ||
        dept === 'cop' ||
        dept === 'maintenance' ||
        dept === 'mnt' ||
        dept === 'finance' ||
        dept === 'fin' ||
        dept === 'legal' ||
        dept === 'leg' ||
        dept.includes('human resources') ||
        dept.includes('administration') ||
        dept.includes('technology') ||
        dept.includes('it');

      if (isNonBDDept) {
        return false;
      }

      return (
        dept.includes('business development') ||
        dept === 'bd' ||
        dept === '' ||
        role.includes('bd') ||
        role.includes('sales') ||
        role.includes('super_admin')
      );
    });
  }, [users]);

  // 2. Regional Owners (Dynamic from unified users where is_regional_owner === true)
  const regionalOwners = useMemo(() => {
    return users.filter((u) => u.is_regional_owner);
  }, [users]);

  // 3. Dynamic Filter Options derived from actual DB records
  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    bdEmployees.forEach((u) => {
      if (u.region) set.add(u.region);
    });
    return Array.from(set).sort();
  }, [bdEmployees]);

  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    bdEmployees.forEach((u) => {
      if (u.team_name) set.add(u.team_name);
    });
    return Array.from(set).sort();
  }, [bdEmployees]);

  const uniqueDesignations = useMemo(() => {
    const set = new Set<string>();
    bdEmployees.forEach((u) => {
      if (u.designation) set.add(u.designation);
    });
    return Array.from(set).sort();
  }, [bdEmployees]);

  const uniqueRoles = useMemo(() => {
    const set = new Set<string>();
    bdEmployees.forEach((u) => {
      const r = u.role_name || u.role;
      if (r) set.add(r);
    });
    return Array.from(set).sort();
  }, [bdEmployees]);

  const uniqueManagers = useMemo(() => {
    const set = new Set<string>();
    bdEmployees.forEach((u) => {
      if (u.manager_name) set.add(u.manager_name);
    });
    return Array.from(set).sort();
  }, [bdEmployees]);

  // 4. Filtered BD Employees List
  const filteredEmployees = useMemo(() => {
    return bdEmployees.filter((emp) => {
      const empStatus = emp.status || 'Active';
      if (statusFilter !== 'All' && empStatus !== statusFilter) return false;
      if (regionFilter !== 'All' && emp.region !== regionFilter) return false;
      if (teamFilter !== 'All' && emp.team_name !== teamFilter) return false;
      if (designationFilter !== 'All' && emp.designation !== designationFilter) return false;
      if (roleFilter !== 'All' && emp.role_name !== roleFilter && emp.role !== roleFilter) return false;
      if (managerFilter !== 'All' && emp.manager_name !== managerFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesEmpId = emp.employee_id ? emp.employee_id.toLowerCase().includes(q) : false;
        const matchesEmail = emp.email.toLowerCase().includes(q);
        const matchesDesignation = emp.designation ? emp.designation.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesEmpId && !matchesEmail && !matchesDesignation) return false;
      }

      return true;
    });
  }, [bdEmployees, statusFilter, regionFilter, teamFilter, designationFilter, roleFilter, managerFilter, searchQuery]);

  // 5. Filtered Regional Owners List
  const filteredRegionalOwners = useMemo(() => {
    return regionalOwners.filter((owner) => {
      const ownerStatus = owner.status || 'Active';
      if (statusFilter !== 'All' && ownerStatus !== statusFilter) return false;
      if (regionFilter !== 'All' && owner.region !== regionFilter) return false;
      if (managerFilter !== 'All' && owner.manager_name !== managerFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = owner.name.toLowerCase().includes(q);
        const matchesEmpId = owner.employee_id ? owner.employee_id.toLowerCase().includes(q) : false;
        const matchesEmail = owner.email.toLowerCase().includes(q);
        const matchesRegion = owner.region ? owner.region.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesEmpId && !matchesEmail && !matchesRegion) return false;
      }

      return true;
    });
  }, [regionalOwners, statusFilter, regionFilter, managerFilter, searchQuery]);

  // Regional Rollup Metrics across all Regional Owners
  const totalRegionalPipelineINR = useMemo(() => {
    const coveredRegions = new Set(regionalOwners.map((o) => o.region).filter(Boolean));
    return opportunities
      .filter((o) => o.status !== 'Won' && o.status !== 'Lost')
      .filter((o) => {
        const matchOwner = users.find((u) => u.name === o.owner);
        return matchOwner?.region && coveredRegions.has(matchOwner.region);
      })
      .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  }, [regionalOwners, opportunities, users]);

  const totalRegionalWonINR = useMemo(() => {
    const coveredRegions = new Set(regionalOwners.map((o) => o.region).filter(Boolean));
    return opportunities
      .filter((o) => o.status === 'Won')
      .filter((o) => {
        const matchOwner = users.find((u) => u.name === o.owner);
        return matchOwner?.region && coveredRegions.has(matchOwner.region);
      })
      .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  }, [regionalOwners, opportunities, users]);

  // Status counts
  const activeCount = bdEmployees.filter((u) => (u.status || 'Active') === 'Active').length;
  const inactiveCount = bdEmployees.filter((u) => u.status === 'Inactive').length;
  const disabledCount = bdEmployees.filter((u) => u.status === 'Disabled').length;

  const handleQuickStatusChange = (e: React.MouseEvent, employee: User, newStatus: 'Active' | 'Inactive' | 'Disabled') => {
    e.stopPropagation();
    updateUser(employee.id, { status: newStatus });
  };

  const handleToggleRegionalOwner = (e: React.MouseEvent, employee: User) => {
    e.stopPropagation();
    if (!isSuperAdminOrManager) {
      alert('Security Policy: Only authorized administrators or managers can modify Regional Owner responsibility.');
      return;
    }
    const willBeOwner = !employee.is_regional_owner;
    const confirmMsg = willBeOwner
      ? `Designate ${employee.name} as Regional Owner for ${employee.region || 'assigned region'}?`
      : `Remove Regional Owner responsibility from ${employee.name}?`;

    if (window.confirm(confirmMsg)) {
      updateUser(employee.id, { is_regional_owner: willBeOwner });
    }
  };

  const handleOpenProfile = (employee: User) => {
    openModal('employeeProfile', employee);
  };

  const handleEditUser = (e: React.MouseEvent, employee: User) => {
    e.stopPropagation();
    openModal('editUser', employee);
  };

  const resetFilters = () => {
    setStatusFilter('Active');
    setRegionFilter('All');
    setTeamFilter('All');
    setDesignationFilter('All');
    setRoleFilter('All');
    setManagerFilter('All');
    setSearchQuery('');
  };

  const hasActiveFilters =
    statusFilter !== 'Active' ||
    regionFilter !== 'All' ||
    teamFilter !== 'All' ||
    designationFilter !== 'All' ||
    roleFilter !== 'All' ||
    managerFilter !== 'All' ||
    searchQuery.trim() !== '';

  return (
    <section>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Business Development &amp; Regional Command
            </h2>
            <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              Live Supabase Master
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
            Unified employee master, multi-tier organizational hierarchy (Region → Team → Manager), pipeline rollups &amp; territory ownership
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => openModal('addUser')}>
            <UserPlus size={15} />
            <span>+ Provision New Employee</span>
          </button>
        </div>
      </div>

      {/* Segmented View Switcher: BD Team vs Regional Owners */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          background: '#e2e8f0',
          padding: '4px',
          borderRadius: '8px',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setActiveViewMode('team')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: activeViewMode === 'team' ? 700 : 500,
            background: activeViewMode === 'team' ? '#ffffff' : 'transparent',
            color: activeViewMode === 'team' ? '#0f172a' : '#475569',
            boxShadow: activeViewMode === 'team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={15} style={{ color: activeViewMode === 'team' ? '#0284c7' : '#64748b' }} />
          <span>Business Development Team ({bdEmployees.length})</span>
        </button>

        <button
          onClick={() => setActiveViewMode('regional_owners')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: activeViewMode === 'regional_owners' ? 700 : 500,
            background: activeViewMode === 'regional_owners' ? '#ffffff' : 'transparent',
            color: activeViewMode === 'regional_owners' ? '#92400e' : '#475569',
            boxShadow: activeViewMode === 'regional_owners' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Crown size={15} style={{ color: activeViewMode === 'regional_owners' ? '#d97706' : '#64748b' }} />
          <span>Regional Owners &amp; Territory Command ({regionalOwners.length})</span>
        </button>
      </div>

      {/* Regional Owners KPI Summary Banner (Visible in Regional Owners view) */}
      {activeViewMode === 'regional_owners' && (
        <div
          className="kpi-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            marginBottom: '18px',
          }}
        >
          <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="kpi-header">
              <span className="kpi-title">Designated Regional Owners</span>
              <div className="kpi-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Crown size={18} />
              </div>
            </div>
            <div className="kpi-value">{regionalOwners.length} Leaders</div>
            <div className="kpi-subtext">
              <span>{regionalOwners.filter((o) => o.status === 'Active').length} Active Regional Heads</span>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="kpi-header">
              <span className="kpi-title">Regional Pipeline Volume</span>
              <div className="kpi-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(totalRegionalPipelineINR, currency)}</div>
            <div className="kpi-subtext">
              <span>Combined active regional opportunities</span>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="kpi-header">
              <span className="kpi-title">Regional Won Revenue YTD</span>
              <div className="kpi-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <Award size={18} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(totalRegionalWonINR, currency)}</div>
            <div className="kpi-subtext">
              <strong style={{ color: '#16a34a' }}>Executed contracts in covered territories</strong>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="kpi-header">
              <span className="kpi-title">Territory Coverage</span>
              <div className="kpi-icon-wrapper" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                <Compass size={18} />
              </div>
            </div>
            <div className="kpi-value">
              {new Set(regionalOwners.map((o) => o.region).filter(Boolean)).size} / 5 Regions
            </div>
            <div className="kpi-subtext">
              <span>West, North, South, East, Central hubs</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Status Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '16px',
          marginBottom: '18px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Row 1: Status Tabs & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`filter-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              🟢 Active ({activeViewMode === 'team' ? activeCount : regionalOwners.filter((o) => o.status === 'Active').length})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              ⚪ Inactive ({activeViewMode === 'team' ? inactiveCount : regionalOwners.filter((o) => o.status === 'Inactive').length})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Disabled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Disabled')}
            >
              🔴 Suspended ({activeViewMode === 'team' ? disabledCount : regionalOwners.filter((o) => o.status === 'Disabled').length})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All ({activeViewMode === 'team' ? bdEmployees.length : regionalOwners.length})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
            <Search size={15} style={{ position: 'absolute', left: '11px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder={activeViewMode === 'team' ? "Search by name, EMP-ID, or email..." : "Search Regional Owners by name, EMP-ID, or region..."}
              style={{ paddingLeft: '34px', fontSize: '12.5px', height: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '9px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Granular Filters */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '4px' }}>
            <Filter size={13} style={{ color: '#0284c7' }} />
            <span>Filters:</span>
          </div>

          {/* Region Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              className="form-control"
              style={{ fontSize: '12px', height: '32px', padding: '4px 8px' }}
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="All">All Regions</option>
              {uniqueRegions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter (shown in BD Team mode) */}
          {activeViewMode === 'team' && (
            <div style={{ minWidth: '140px' }}>
              <select
                className="form-control"
                style={{ fontSize: '12px', height: '32px', padding: '4px 8px' }}
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="All">All Teams</option>
                {uniqueTeams.map((tm) => (
                  <option key={tm} value={tm}>
                    {tm}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Designation Filter */}
          {activeViewMode === 'team' && (
            <div style={{ minWidth: '150px' }}>
              <select
                className="form-control"
                style={{ fontSize: '12px', height: '32px', padding: '4px 8px' }}
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
              >
                <option value="All">All Designations</option>
                {uniqueDesignations.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manager Filter */}
          <div style={{ minWidth: '140px' }}>
            <select
              className="form-control"
              style={{ fontSize: '12px', height: '32px', padding: '4px 8px' }}
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
            >
              <option value="All">All Managers</option>
              {uniqueManagers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn btn-secondary btn-xs"
              style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', height: '32px' }}
            >
              <RefreshCw size={11} />
              <span>Reset</span>
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Showing {activeViewMode === 'team' ? filteredEmployees.length : filteredRegionalOwners.length} of {activeViewMode === 'team' ? bdEmployees.length : regionalOwners.length} Records
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: BUSINESS DEVELOPMENT TEAM VIEW                              */}
      {/* ========================================================================= */}
      {activeViewMode === 'team' && (
        <>
          {filteredEmployees.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed #cbd5e1',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Search size={22} style={{ color: '#94a3b8' }} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                No Business Development Employees Found
              </h3>
              <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px' }}>
                Try adjusting active filters or search query to find executives.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '18px',
                marginBottom: '28px',
              }}
            >
              {filteredEmployees.map((emp) => {
                const empStatus = emp.status || 'Active';
                const empOpps = opportunities.filter((o) => o.owner === emp.name);
                const activeOpps = empOpps.filter((o) => o.status !== 'Won' && o.status !== 'Lost');
                const wonOpps = empOpps.filter((o) => o.status === 'Won');
                const activePipelineVal = activeOpps.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
                const wonVal = wonOpps.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
                const targetVal = emp.annual_target_inr || 50000000;
                const achievePct = targetVal > 0 ? Math.round((wonVal / targetVal) * 100) : 0;
                const perfStatus = getPerformanceStatus(wonVal, targetVal);
                const empClients = clients.filter((c) => c.accountOwner === emp.name && c.status === 'Active');
                const empFollowups = followups.filter((f) => f.assignedTo === emp.name && f.status === 'Pending');
                const tenure = calculateTenure(emp.joining_date);

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleOpenProfile(emp)}
                    style={{
                      background: '#ffffff',
                      border: empStatus === 'Disabled' ? '1px solid #fecaca' : emp.is_regional_owner ? '1px solid #fed7aa' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px',
                      boxShadow: emp.is_regional_owner ? '0 2px 10px rgba(245, 158, 11, 0.09)' : 'var(--shadow-xs)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: empStatus === 'Disabled' ? 0.78 : empStatus === 'Inactive' ? 0.88 : 1,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.07)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = emp.is_regional_owner ? '0 2px 10px rgba(245, 158, 11, 0.09)' : 'var(--shadow-xs)';
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              background: empStatus === 'Disabled' ? '#94a3b8' : emp.avatar_bg || '#0284c7',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '15px',
                              position: 'relative',
                              flexShrink: 0,
                            }}
                          >
                            {emp.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                            {emp.is_regional_owner && (
                              <span
                                title="Regional Territory Owner"
                                style={{
                                  position: 'absolute',
                                  bottom: '-3px',
                                  right: '-3px',
                                  background: '#f59e0b',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                }}
                              >
                                <Crown size={10} />
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                {emp.name}
                              </h3>
                              {emp.employee_id && (
                                <span style={{ fontSize: '10.5px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  {emp.employee_id}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{emp.designation || emp.role}</span>
                              <span>•</span>
                              <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                {emp.role_name || emp.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Performance Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span
                            className="pill-badge"
                            style={{
                              background:
                                empStatus === 'Active'
                                  ? '#dcfce7'
                                  : empStatus === 'Disabled'
                                  ? '#fee2e2'
                                  : '#f1f5f9',
                              color:
                                empStatus === 'Active'
                                  ? '#15803d'
                                  : empStatus === 'Disabled'
                                  ? '#b91c1c'
                                  : '#475569',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            {empStatus === 'Active' && '🟢 Active'}
                            {empStatus === 'Inactive' && '⚪ Inactive'}
                            {empStatus === 'Disabled' && '🔴 Suspended'}
                          </span>

                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              background: perfStatus.badgeBg,
                              color: perfStatus.badgeText,
                              border: `1px solid ${perfStatus.badgeBorder}`,
                              padding: '1px 6px',
                              borderRadius: '999px',
                            }}
                          >
                            {perfStatus.status}
                          </span>
                        </div>
                      </div>

                      {/* Hierarchy Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          marginBottom: '12px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '11.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} style={{ color: '#0284c7' }} />
                            <span>Region:</span>
                          </span>
                          <strong style={{ color: '#0f172a' }}>{emp.region || 'West Region'}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} style={{ color: '#0284c7' }} />
                            <span>Team:</span>
                          </span>
                          <strong style={{ color: '#0369a1' }}>{emp.team_name || 'Enterprise BD West'}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={12} style={{ color: '#16a34a' }} />
                            <span>Reports To:</span>
                          </span>
                          <strong style={{ color: '#334155' }}>{emp.manager_name || 'Devika Pangam'}</strong>
                        </div>
                      </div>

                      {/* Quota vs Achieved Box */}
                      <div
                        style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '12px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Annual Quota:</span>
                          <strong style={{ color: '#0f172a' }}>{formatCurrency(targetVal, currency)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                          <span style={{ color: '#64748b' }}>Won YTD:</span>
                          <strong style={{ color: '#16a34a' }}>{formatCurrency(wonVal, currency)}</strong>
                        </div>

                        <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(achievePct, 100)}%`,
                              height: '100%',
                              background: achievePct >= 85 ? '#10b981' : achievePct >= 50 ? '#3b82f6' : achievePct >= 25 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px' }}>
                          <span style={{ color: '#64748b' }}>Quota Accomplishment</span>
                          <strong style={{ color: '#0284c7' }}>{achievePct}% Achieved</strong>
                        </div>
                      </div>

                      {/* 3 Metric Chips */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                        <div style={{ background: '#f0fdf4', padding: '7px 6px', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10.5px', color: '#15803d' }}>Active Deals</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#16a34a' }}>
                            {activeOpps.length} ({formatCurrency(activePipelineVal, currency)})
                          </div>
                        </div>

                        <div style={{ background: '#eff6ff', padding: '7px 6px', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10.5px', color: '#1e40af' }}>Active Clients</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#2563eb' }}>
                            {empClients.length} Accounts
                          </div>
                        </div>

                        <div style={{ background: '#fdf4ff', padding: '7px 6px', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10.5px', color: '#86198f' }}>Follow-ups</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#a21caf' }}>
                            {empFollowups.length} Pending
                          </div>
                        </div>
                      </div>

                      {/* Tenure & Email */}
                      <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={12} style={{ color: '#0284c7' }} />
                            <span>Joined: {formatDate(emp.joining_date)}</span>
                          </span>
                          <span style={{ fontWeight: 600, color: '#0369a1' }}>Tenure: {tenure}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={12} style={{ color: '#0284c7' }} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{emp.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div
                      style={{
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Status toggle buttons */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {empStatus !== 'Active' && (
                          <button
                            className="btn btn-secondary btn-xs"
                            style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                            onClick={(e) => handleQuickStatusChange(e, emp, 'Active')}
                            title="Set to Active"
                          >
                            <CheckCircle size={11} />
                            <span>Active</span>
                          </button>
                        )}
                        {empStatus !== 'Inactive' && empStatus !== 'Disabled' && (
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={(e) => handleQuickStatusChange(e, emp, 'Inactive')}
                            title="Set to Inactive"
                          >
                            <span>Inactive</span>
                          </button>
                        )}
                        {empStatus !== 'Disabled' && (
                          <button
                            className="btn btn-secondary btn-xs"
                            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                            onClick={(e) => handleQuickStatusChange(e, emp, 'Disabled')}
                            title="Suspend User Access"
                          >
                            <PowerOff size={11} />
                            <span>Suspend</span>
                          </button>
                        )}
                      </div>

                      {/* Edit & View Profile Button */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={(e) => handleEditUser(e, emp)}
                          title="Edit User Access & Hierarchy"
                        >
                          <Edit3 size={11} />
                          <span>Manage</span>
                        </button>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProfile(emp);
                          }}
                          title="View Full Employee Profile & Trajectory"
                        >
                          <span>Profile</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: REGIONAL OWNERS & TERRITORY COMMAND VIEW                     */}
      {/* ========================================================================= */}
      {activeViewMode === 'regional_owners' && (
        <>
          {filteredRegionalOwners.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed #cbd5e1',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Crown size={24} style={{ color: '#d97706' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                No Regional Owners Matching Criteria
              </h3>
              <p style={{ fontSize: '13px', maxWidth: '460px', margin: '0 auto 18px' }}>
                Regional territory leadership is governed through the employee master. Authorized administrators can assign Regional Owners in User Management.
              </p>
              {isSuperAdminOrManager && (
                <button className="btn btn-primary btn-sm" onClick={() => openModal('addUser')}>
                  <UserPlus size={14} />
                  <span>+ Designate New Regional Owner</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                gap: '20px',
                marginBottom: '28px',
              }}
            >
              {filteredRegionalOwners.map((owner) => {
                const ownerStatus = owner.status || 'Active';
                const ownerRegion = owner.region || 'West Region';

                // Team members stationed in / assigned to this Region
                const regionTeamMembers = users.filter((u) => u.region === ownerRegion);

                // Regional Active Pipeline Rollup (deals owned by any team member in this region)
                const regionOpps = opportunities.filter((o) => {
                  const matchOwner = users.find((u) => u.name === o.owner);
                  return matchOwner?.region === ownerRegion;
                });
                const regionActiveOpps = regionOpps.filter((o) => o.status !== 'Won' && o.status !== 'Lost');
                const regionWonOpps = regionOpps.filter((o) => o.status === 'Won');

                const regionActivePipelineINR = regionActiveOpps.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
                const regionWonINR = regionWonOpps.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
                const regionQuota = owner.annual_target_inr || 50000000;
                const regionAchievePct = regionQuota > 0 ? Math.round((regionWonINR / regionQuota) * 100) : 0;
                const perfStatus = getPerformanceStatus(regionWonINR, regionQuota);

                // Regional Clients Rollup (clients owned by executives in this region)
                const regionClients = clients.filter((c) => {
                  const matchOwner = users.find((u) => u.name === c.accountOwner);
                  return matchOwner?.region === ownerRegion && c.status === 'Active';
                });

                // Regional Activities Logged
                const regionActivities = activities.filter((a) => {
                  const matchUser = users.find((u) => u.name === a.conductedBy);
                  return matchUser?.region === ownerRegion;
                });

                const tenure = calculateTenure(owner.joining_date);

                return (
                  <div
                    key={owner.id}
                    onClick={() => handleOpenProfile(owner)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #fed7aa',
                      borderRadius: 'var(--radius-lg)',
                      padding: '22px',
                      boxShadow: '0 3px 12px rgba(245, 158, 11, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.14)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(245, 158, 11, 0.08)';
                    }}
                  >
                    <div>
                      {/* Header Section */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '50%',
                              background: owner.avatar_bg || '#f59e0b',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '17px',
                              position: 'relative',
                              flexShrink: 0,
                            }}
                          >
                            {owner.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                            <span
                              title="Regional Territory Owner"
                              style={{
                                position: 'absolute',
                                bottom: '-3px',
                                right: '-3px',
                                background: '#d97706',
                                color: '#fff',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                              }}
                            >
                              <Crown size={11} />
                            </span>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                {owner.name}
                              </h3>
                              {owner.employee_id && (
                                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  {owner.employee_id}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                              {owner.designation || owner.role} • <strong>{ownerRegion}</strong> Head
                            </div>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span
                            className="pill-badge"
                            style={{
                              background: ownerStatus === 'Active' ? '#dcfce7' : '#fee2e2',
                              color: ownerStatus === 'Active' ? '#15803d' : '#b91c1c',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            {ownerStatus === 'Active' ? '🟢 Active Owner' : '🔴 Inactive'}
                          </span>

                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              background: perfStatus.badgeBg,
                              color: perfStatus.badgeText,
                              border: `1px solid ${perfStatus.badgeBorder}`,
                              padding: '1px 7px',
                              borderRadius: '999px',
                            }}
                          >
                            {perfStatus.status}
                          </span>
                        </div>
                      </div>

                      {/* Territory & Team Command Matrix */}
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '14px',
                          fontSize: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                            <Compass size={14} style={{ color: '#d97706' }} />
                            <span>Assigned Region:</span>
                          </span>
                          <strong style={{ color: '#78350f', fontSize: '12.5px' }}>{ownerRegion}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                            <Building2 size={14} style={{ color: '#d97706' }} />
                            <span>Assigned Team:</span>
                          </span>
                          <strong style={{ color: '#0f172a' }}>{owner.team_name || 'Enterprise BD West'}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                            <Users size={14} style={{ color: '#d97706' }} />
                            <span>Regional Team Members:</span>
                          </span>
                          <strong style={{ color: '#0369a1' }}>{regionTeamMembers.length} Executives</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                            <UserCheck size={14} style={{ color: '#d97706' }} />
                            <span>Reporting Manager:</span>
                          </span>
                          <strong style={{ color: '#334155' }}>{owner.manager_name || 'Devika Pangam'}</strong>
                        </div>
                      </div>

                      {/* Regional Rollup Metrics Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ background: '#f8fafc', padding: '8px 6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>Active Deals</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                            {regionActiveOpps.length}
                          </div>
                        </div>

                        <div style={{ background: '#eff6ff', padding: '8px 6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                          <div style={{ fontSize: '10.5px', color: '#1e40af' }}>Pipeline Value</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                            {formatCurrency(regionActivePipelineINR, currency)}
                          </div>
                        </div>

                        <div style={{ background: '#f0fdf4', padding: '8px 6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                          <div style={{ fontSize: '10.5px', color: '#15803d' }}>Won YTD</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                            {formatCurrency(regionWonINR, currency)}
                          </div>
                        </div>

                        <div style={{ background: '#fdf4ff', padding: '8px 6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #f5d0fe' }}>
                          <div style={{ fontSize: '10.5px', color: '#86198f' }}>Activities</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#a21caf', marginTop: '2px' }}>
                            {regionActivities.length}
                          </div>
                        </div>
                      </div>

                      {/* Target vs Won Progress Bar */}
                      <div
                        style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '14px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Regional Annual Quota:</span>
                          <strong style={{ color: '#0f172a' }}>{formatCurrency(regionQuota, currency)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                          <span style={{ color: '#64748b' }}>Regional Won YTD:</span>
                          <strong style={{ color: '#16a34a' }}>{formatCurrency(regionWonINR, currency)}</strong>
                        </div>

                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(regionAchievePct, 100)}%`,
                              height: '100%',
                              background: regionAchievePct >= 85 ? '#10b981' : regionAchievePct >= 50 ? '#3b82f6' : regionAchievePct >= 25 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px' }}>
                          <span style={{ color: '#64748b' }}>Regional Target Pacing</span>
                          <strong style={{ color: '#0284c7' }}>{regionAchievePct}% Achieved ({regionWonOpps.length} Contracts Executed)</strong>
                        </div>
                      </div>

                      {/* Contact & Location Footer */}
                      <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Tenure: <strong>{tenure}</strong></span>
                          <span>Base: <strong>{owner.location || 'Corporate HQ'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={12} style={{ color: '#0284c7' }} />
                          <span>{owner.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Regional Owner Action Toolbar */}
                    <div
                      style={{
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Revoke / Reassign Action for Authorized Admins */}
                      {isSuperAdminOrManager && (
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{ color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
                          onClick={(e) => handleToggleRegionalOwner(e, owner)}
                          title="Revoke Regional Owner assignment"
                        >
                          <UserMinus size={11} />
                          <span>Revoke Ownership</span>
                        </button>
                      )}

                      <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={(e) => handleEditUser(e, owner)}
                          title="Edit Regional Assignment & Hierarchy"
                        >
                          <Edit3 size={11} />
                          <span>Edit Hierarchy</span>
                        </button>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProfile(owner);
                          }}
                          title="View Full Profile & Regional Metrics"
                        >
                          <span>Profile</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};

