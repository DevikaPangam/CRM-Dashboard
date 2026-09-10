import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, ShieldPlus, Search, Filter, RefreshCw,
  Building2, MapPin, Briefcase, Calendar, Clock, Crown,
  TrendingUp, Target, Award, ChevronRight, LayoutGrid, List,
  Sparkles, CheckCircle, AlertCircle, Phone, Mail, UserX,
  Layers, Compass, ArrowUpRight, ShieldCheck, UserPlus, Eye
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { formatCurrency, formatDate, calculateTenure, getPerformanceStatus } from '../../utils/formatters';
import { User } from '../../types/crm';

export const EmployeeMasterTab: React.FC = () => {
  const { users, opportunities, openModal, viewEmployeeProfile, currentUser, isLoadingData, refreshCRMData } = useCRM();
  const { profile } = useAuth();

  // Active Main Sub-View Tab
  const [activeSubView, setActiveSubView] = useState<'all' | 'bd_team' | 'regional_owners' | 'dept_hierarchy'>('all');

  // Display Mode (Grid vs Table) for All Employees Directory
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('table');

  // Directory Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [managerFilter, setManagerFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('All');

  const { isOrgAdmin } = useRBAC();
  const isAdmin = isOrgAdmin;

  // Helper to test if a department is Business Development
  const isBD = (dept?: string) => {
    if (!dept) return false;
    const d = dept.trim().toLowerCase();
    const nonBD = ['operations', 'ops', 'centralised operations', 'cop', 'maintenance', 'mnt', 'finance', 'fin', 'legal', 'leg', 'human resources', 'administration', 'it', 'technology'];
    if (nonBD.includes(d)) return false;
    return d.includes('business development') || d === 'bd';
  };

  // 1. All Filtered Employees
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status Filter
      if (statusFilter !== 'All') {
        const uStatus = u.status || 'Active';
        if (statusFilter === 'Active' && uStatus !== 'Active') return false;
        if (statusFilter !== 'Active' && uStatus !== statusFilter) return false;
      }

      // Department Filter
      if (deptFilter !== 'All') {
        const uDept = (u.department || '').trim().toLowerCase();
        const targetDept = deptFilter.trim().toLowerCase();
        if (!uDept.includes(targetDept) && targetDept !== uDept) return false;
      }

      // Team Filter
      if (teamFilter !== 'All' && u.team_name !== teamFilter && u.team_id !== teamFilter) {
        return false;
      }

      // Region Filter
      if (regionFilter !== 'All' && u.region !== regionFilter) {
        return false;
      }

      // Manager Filter
      if (managerFilter !== 'All' && u.manager_name !== managerFilter && u.manager_id !== managerFilter) {
        return false;
      }

      // Employment Type Filter
      if (employmentTypeFilter !== 'All' && u.employment_type !== employmentTypeFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchEmpId = u.employee_id?.toLowerCase().includes(q);
        const matchDesig = u.designation?.toLowerCase().includes(q);
        const matchDept = u.department?.toLowerCase().includes(q);
        const matchTeam = u.team_name?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchEmpId && !matchDesig && !matchDept && !matchTeam) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, deptFilter, teamFilter, regionFilter, managerFilter, statusFilter, employmentTypeFilter]);

  // 2. Business Development Team (Pure BD Active Employees)
  const bdEmployees = useMemo(() => {
    return users.filter((u) => isBD(u.department) && (u.status === 'Active' || !u.status));
  }, [users]);

  // 3. Regional Owners (Pure BD Regional Owners)
  const regionalOwners = useMemo(() => {
    return users.filter((u) => isBD(u.department) && u.is_regional_owner && (u.status === 'Active' || !u.status));
  }, [users]);

  // 4. Distinct Filter Options
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set).sort();
  }, [users]);

  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.team_name) set.add(u.team_name);
    });
    return Array.from(set).sort();
  }, [users]);

  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.region) set.add(u.region);
    });
    return Array.from(set).sort();
  }, [users]);

  const uniqueManagers = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.manager_name) set.add(u.manager_name);
    });
    return Array.from(set).sort();
  }, [users]);

  // Metrics Summary
  const totalEmployees = users.length;
  const activeCount = users.filter((u) => u.status === 'Active' || !u.status).length;
  const bdCount = bdEmployees.length;
  const regOwnersCount = regionalOwners.length;
  const onLeaveCount = users.filter((u) => u.status === 'On Leave').length;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Active' };
      case 'Invited':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'Invited' };
      case 'On Leave':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'On Leave' };
      case 'Inactive':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Inactive' };
      case 'Exited':
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'Exited' };
      default:
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Active' };
    }
  };

  const getDepartmentBadge = (dept?: string) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('business development') || d === 'bd') {
      return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    }
    if (d.includes('centralised operations') || d === 'cop') {
      return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
    }
    if (d.includes('operations') || d === 'ops') {
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
    }
    if (d.includes('maintenance') || d === 'mnt') {
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
    if (d.includes('finance') || d === 'fin') {
      return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
    }
    if (d.includes('legal') || d === 'leg') {
      return { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' };
    }
    return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Banner */}
      <div className="section-header-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Users size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Employee Master &amp; Organizational Directory
                </h1>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Rajmudra Group Unified Employee Architecture • Dynamic Profiles, BD Hierarchy, Regional Networks &amp; Department Roster
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={refreshCRMData}
              disabled={isLoadingData}
              title="Refresh employee data from database"
            >
              <RefreshCw size={13} className={isLoadingData ? 'animate-spin' : ''} />
              <span>Sync Cloud</span>
            </button>

            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => openModal('addUser')}>
                <UserPlus size={14} />
                <span>+ Provision Employee</span>
              </button>
            )}
          </div>
        </div>

        {/* Top KPI Metrics Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginTop: '18px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Workforce</span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{totalEmployees}</div>
            <span style={{ fontSize: '11px', color: '#0284c7' }}>Master Employee DB</span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Active Roster</span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{activeCount}</div>
            <span style={{ fontSize: '11px', color: '#16a34a' }}>On-Duty Staff</span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Business Development</span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>{bdCount}</div>
            <span style={{ fontSize: '11px', color: '#3b82f6' }}>Field Sales &amp; Growth</span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Regional Owners</span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>{regOwnersCount}</div>
            <span style={{ fontSize: '11px', color: '#8b5cf6' }}>Territory Leaders</span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Departments</span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>6 Active</div>
            <span style={{ fontSize: '11px', color: '#d97706' }}>Org Structure</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-View Switcher Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeSubView === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubView('all')}
          >
            <Users size={14} />
            <span>All Employees Directory ({filteredUsers.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeSubView === 'bd_team' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubView('bd_team')}
          >
            <UserCheck size={14} style={{ color: '#0284c7' }} />
            <span>Business Development Team ({bdEmployees.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeSubView === 'regional_owners' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubView('regional_owners')}
          >
            <Crown size={14} style={{ color: '#f59e0b' }} />
            <span>Regional Owners &amp; Territory Network ({regionalOwners.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeSubView === 'dept_hierarchy' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubView('dept_hierarchy')}
          >
            <Layers size={14} style={{ color: '#10b981' }} />
            <span>Departments &amp; Hierarchy</span>
          </button>
        </div>

        {activeSubView === 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
            <button
              onClick={() => setViewLayout('table')}
              className={`btn btn-xs ${viewLayout === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 8px' }}
              title="Table View"
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`btn btn-xs ${viewLayout === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 8px' }}
              title="Card Grid View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SUB-VIEW 1: ALL EMPLOYEES DIRECTORY                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeSubView === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Multi-Dimensional Filter Toolbar */}
          <div className="filter-toolbar" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search employee name, ID, email, designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 30px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            >
              <option value="All">All Departments</option>
              <option value="Business Development">Business Development</option>
              <option value="Operations">Operations</option>
              <option value="Centralised Operations">Centralised Operations</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            >
              <option value="All">All Regions</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            >
              <option value="All">All Teams</option>
              {uniqueTeams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Invited">Invited</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
              <option value="Exited">Exited</option>
            </select>

            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            >
              <option value="All">All Employment Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
              <option value="Probation">Probation</option>
              <option value="Part-time">Part-time</option>
            </select>

            {(searchQuery || deptFilter !== 'All' || regionFilter !== 'All' || teamFilter !== 'All' || statusFilter !== 'Active' || employmentTypeFilter !== 'All') && (
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  setSearchQuery('');
                  setDeptFilter('All');
                  setRegionFilter('All');
                  setTeamFilter('All');
                  setStatusFilter('All');
                  setEmploymentTypeFilter('All');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* TABLE VIEW */}
          {viewLayout === 'table' ? (
            <div className="table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee Profile</th>
                      <th>Department &amp; Designation</th>
                      <th>Region &amp; Team</th>
                      <th>Reporting Manager</th>
                      <th>Joining &amp; Tenure</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          <Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                          <p style={{ margin: 0, fontWeight: 600 }}>No employees found matching the specified filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const statusBadge = getStatusBadge(u.status);
                        const deptBadge = getDepartmentBadge(u.department);
                        const isBDUser = isBD(u.department);

                        return (
                          <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => viewEmployeeProfile(u.id)}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: u.avatar_bg || '#0284c7',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {u.name ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>{u.name}</span>
                                    {isBDUser && u.is_regional_owner && (
                                      <span className="pill-badge" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a', fontSize: '10px' }} title="Regional Territory Owner">
                                        👑 Regional Owner
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px' }}>
                                    <span>{u.employee_id || 'EMP-N/A'}</span>
                                    <span>•</span>
                                    <span>{u.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span
                                className="pill-badge"
                                style={{
                                  background: deptBadge.bg,
                                  color: deptBadge.text,
                                  borderColor: deptBadge.border,
                                  fontWeight: 600,
                                  fontSize: '11px',
                                  marginBottom: '3px',
                                  display: 'inline-block',
                                }}
                              >
                                {u.department || 'Business Development'}
                              </span>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                {u.designation || 'Executive'}
                              </div>
                            </td>

                            <td>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={12} style={{ color: '#0284c7' }} />
                                <span>{u.region || 'West Region'}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {u.team_name || 'General Team'}
                              </div>
                            </td>

                            <td>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                {u.manager_name || 'Devika Pangam'}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Reporting Lead</div>
                            </td>

                            <td>
                              <div style={{ fontSize: '12px', color: '#334155' }}>
                                {u.joining_date ? formatDate(u.joining_date) : '01 Apr 2024'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                                {calculateTenure(u.joining_date || '2024-04-01')}
                              </div>
                            </td>

                            <td>
                              <span
                                className="pill-badge"
                                style={{
                                  background: statusBadge.bg,
                                  color: statusBadge.text,
                                  borderColor: statusBadge.border,
                                  fontWeight: 600,
                                  fontSize: '11px',
                                }}
                              >
                                {statusBadge.label}
                              </span>
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                {u.employment_type || 'Full-time'}
                              </div>
                            </td>

                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={() => viewEmployeeProfile(u.id)}
                                  title="Open Full 10-Tab Employee Dossier"
                                >
                                  <Sparkles size={11} />
                                  <span>Dossier</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    className="btn btn-secondary btn-xs"
                                    onClick={() => openModal('editUser', u)}
                                    title="Edit Employee Information & Permissions"
                                  >
                                    <span>Edit</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARD GRID VIEW */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {filteredUsers.map((u) => {
                const statusBadge = getStatusBadge(u.status);
                const deptBadge = getDepartmentBadge(u.department);
                const isBDUser = isBD(u.department);

                return (
                  <div
                    key={u.id}
                    className="employee-card"
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onClick={() => viewEmployeeProfile(u.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: u.avatar_bg || '#0284c7',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                            }}
                          >
                            {u.name ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{u.name}</h4>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{u.employee_id || 'EMP-N/A'}</span>
                          </div>
                        </div>

                        <span
                          className="pill-badge"
                          style={{
                            background: statusBadge.bg,
                            color: statusBadge.text,
                            borderColor: statusBadge.border,
                            fontWeight: 600,
                            fontSize: '10.5px',
                          }}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        <span
                          className="pill-badge"
                          style={{
                            background: deptBadge.bg,
                            color: deptBadge.text,
                            borderColor: deptBadge.border,
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {u.department || 'Business Development'}
                        </span>
                        {isBDUser && u.is_regional_owner && (
                          <span className="pill-badge" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a', fontSize: '11px' }}>
                            👑 Regional Owner
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                        {u.designation || 'Executive'}
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={12} style={{ color: '#0284c7' }} />
                          <span>{u.region || 'West Region'} • {u.team_name || 'General Team'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={12} style={{ color: '#8b5cf6' }} />
                          <span>Manager: {u.manager_name || 'Devika Pangam'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} style={{ color: '#10b981' }} />
                          <span>Tenure: {calculateTenure(u.joining_date || '2024-04-01')}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{u.email}</span>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewEmployeeProfile(u.id);
                        }}
                      >
                        <Eye size={11} />
                        <span>View Dossier</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SUB-VIEW 2: BUSINESS DEVELOPMENT TEAM                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeSubView === 'bd_team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e3a8a' }}>
                Corporate Business Development Sales Roster
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#3b82f6' }}>
                Active commercial executives, territory managers &amp; revenue targets across Rajmudra corporate fleet segments
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Active BD Team</span>
                <strong style={{ fontSize: '14px', color: '#1d4ed8' }}>{bdEmployees.length} Members</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {bdEmployees.map((u) => {
              const oppsCount = u.active_opps_count || opportunities.filter((o) => o.owner === u.name || o.owner === u.email).length;
              const quotaTarget = u.annual_target_inr || 50000000;
              const wonINR = u.achieved_inr || 0;
              const pct = quotaTarget > 0 ? Math.round((wonINR / quotaTarget) * 100) : 0;
              const perf = getPerformanceStatus(wonINR, quotaTarget);

              return (
                <div
                  key={u.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                  }}
                  onClick={() => viewEmployeeProfile(u.id)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: u.avatar_bg || '#0284c7',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                        >
                          {u.name ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'BD'}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>{u.name}</h4>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{u.employee_id} • {u.designation || 'BD Executive'}</span>
                        </div>
                      </div>

                      {u.is_regional_owner && (
                        <span className="pill-badge" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a', fontSize: '10.5px' }}>
                          👑 Regional Head
                        </span>
                      )}
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                        <span>Annual Quota Attainment</span>
                        <strong style={{ color: '#0f172a' }}>{pct}% ({formatCurrency(wonINR, 'INR')})</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                        <span>Target: {formatCurrency(quotaTarget, 'INR')}</span>
                        <span style={{ color: perf.badgeText, fontWeight: 600 }}>{perf.status}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px', fontSize: '11.5px', color: '#475569' }}>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '10.5px' }}>Territory</span>
                        <strong>{u.region || 'West Region'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '10.5px' }}>Active Deals</span>
                        <strong style={{ color: '#0284c7' }}>{oppsCount} Opportunities</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Tenure: {calculateTenure(u.joining_date || '2024-04-01')}</span>
                    <button className="btn btn-secondary btn-xs" onClick={(e) => { e.stopPropagation(); viewEmployeeProfile(u.id); }}>
                      <Sparkles size={11} style={{ color: '#8b5cf6' }} />
                      <span>Profile &amp; Deals</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SUB-VIEW 3: REGIONAL OWNERS & TERRITORY NETWORK                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeSubView === 'regional_owners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#6b21a8' }}>
                Rajmudra Regional Ownership &amp; Territory Command
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#9333ea' }}>
                Designated Regional Owners responsible for corporate business development, fleet capacity &amp; client retention per corridor
              </p>
            </div>
            <span className="pill-badge" style={{ background: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe', fontWeight: 700 }}>
              👑 {regionalOwners.length} Designated Territory Heads
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {regionalOwners.map((ro) => {
              const teamMembersCount = users.filter((u) => u.region === ro.region || u.manager_id === ro.id).length;
              return (
                <div
                  key={ro.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                  }}
                  onClick={() => viewEmployeeProfile(ro.id)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '15px',
                          }}
                        >
                          {ro.name ? ro.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'RO'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{ro.name}</h4>
                            <Crown size={14} style={{ color: '#f59e0b' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{ro.designation || 'Regional Head'}</span>
                        </div>
                      </div>

                      <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', fontWeight: 700 }}>
                        {ro.region || 'West Region'}
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Assigned Team</span>
                        <strong>{ro.team_name || 'Enterprise Regional Team'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Regional Workforce</span>
                        <strong style={{ color: '#0284c7' }}>{teamMembersCount} Staff &amp; Execs</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Territory Quota</span>
                        <strong>{formatCurrency(ro.annual_target_inr || 50000000, 'INR')}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Reporting To</span>
                        <strong>{ro.manager_name || 'Devika Pangam'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{ro.email}</span>
                    <button className="btn btn-primary btn-xs" onClick={(e) => { e.stopPropagation(); viewEmployeeProfile(ro.id); }}>
                      <Eye size={11} />
                      <span>Territory Dossier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SUB-VIEW 4: DEPARTMENTS & TEAMS BREAKDOWN                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeSubView === 'dept_hierarchy' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {[
            {
              name: 'Business Development',
              code: 'BD',
              desc: 'Client Acquisition, Corporate RFP Commercials, Pipeline & Revenue Growth',
              icon: <UserCheck size={18} style={{ color: '#2563eb' }} />,
              color: '#eff6ff',
              border: '#bfdbfe',
              textColor: '#1e40af',
            },
            {
              name: 'Operations',
              code: 'OPS',
              desc: 'Fleet Logistics, Driver Rosters, Daily Trip Dispatch & On-Time Arrival SLAs',
              icon: <Briefcase size={18} style={{ color: '#059669' }} />,
              color: '#ecfdf5',
              border: '#a7f3d0',
              textColor: '#065f46',
            },
            {
              name: 'Centralised Operations',
              code: 'COP',
              desc: '24/7 Control Tower, GPS Telemetry, Emergency SOS Panic Response & Fuel Tracking',
              icon: <Compass size={18} style={{ color: '#0284c7' }} />,
              color: '#e0f2fe',
              border: '#bae6fd',
              textColor: '#075985',
            },
            {
              name: 'Maintenance',
              code: 'MNT',
              desc: 'Fleet Workshop Engineering, Scheduled Preventive Servicing, Spare Parts & Repairs',
              icon: <Building2 size={18} style={{ color: '#d97706' }} />,
              color: '#fef3c7',
              border: '#fde68a',
              textColor: '#92400e',
            },
            {
              name: 'Finance',
              code: 'FIN',
              desc: 'Corporate Client Invoicing, Margin Modeling, Fuel Price Indexing & Tax Compliance',
              icon: <TrendingUp size={18} style={{ color: '#16a34a' }} />,
              color: '#f0fdf4',
              border: '#bbf7d0',
              textColor: '#166534',
            },
            {
              name: 'Legal',
              code: 'LEG',
              desc: 'Master Service Agreements, Tripartite Contract Compliance, Motor Permits & NDA Governance',
              icon: <ShieldCheck size={18} style={{ color: '#db2777' }} />,
              color: '#fdf2f8',
              border: '#fbcfe8',
              textColor: '#9d174d',
            },
          ].map((dept) => {
            const deptMembers = users.filter((u) => {
              const uDept = (u.department || '').toLowerCase();
              const target = dept.name.toLowerCase();
              return uDept === target || uDept.includes(target) || (target.includes('business development') && isBD(u.department));
            });

            return (
              <div
                key={dept.code}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: dept.color, border: `1px solid ${dept.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {dept.icon}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{dept.name}</h4>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Code: {dept.code}</span>
                      </div>
                    </div>
                    <span className="pill-badge" style={{ background: dept.color, color: dept.textColor, borderColor: dept.border, fontWeight: 700 }}>
                      {deptMembers.length} Staff
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '4px 0 10px 0' }}>{dept.desc}</p>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Department Roster ({deptMembers.length})
                    </span>
                    {deptMembers.length === 0 ? (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>No employees currently assigned.</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                        {deptMembers.map((m) => (
                          <div
                            key={m.id}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
                            onClick={() => viewEmployeeProfile(m.id)}
                          >
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                            <span style={{ color: '#64748b', fontSize: '10.5px' }}>{m.designation || 'Staff'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => {
                      setDeptFilter(dept.name);
                      setActiveSubView('all');
                    }}
                  >
                    <span>Filter Directory</span>
                    <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
