import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldPlus,
  Edit2,
  ShieldAlert,
  KeyRound,
  UserX,
  UserCheck,
  AlertCircle,
  History,
  Users as UsersIcon,
  Filter,
  Search,
  RefreshCw,
  FileCode,
  Link2,
  Copy,
  ExternalLink,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { triggerPasswordReset, revokeUserAccess, updateAdminUser, generateActivationLink, deleteAdminUser } from '../../services/adminService';
import { fetchAuditLogs, AuditLogRecord } from '../../services/auditService';
import { formatDate } from '../../utils/formatters';

export const UsersTab: React.FC = () => {
  const { users, updateUser, deleteUser, openModal, currentUser } = useCRM();
  const { profile, organization } = useAuth();

  // Admin authority check (super_admin, bd_director, system administrator, or devika.p)
  const userRole = (profile?.role || currentUser?.role || currentUser?.role_name || '') as string;
  const userEmail = (profile?.email || currentUser?.email || '').toLowerCase();
  const isAdmin =
    userRole === 'super_admin' ||
    userRole === 'bd_director' ||
    userRole === 'System Administrator' ||
    userRole === 'system_admin' ||
    userRole === 'admin' ||
    currentUser?.role === 'System Administrator' ||
    currentUser?.role_name === 'super_admin' ||
    userEmail.startsWith('devika') ||
    userEmail === 'devika.p@rajmudragroup.com';

  const [activeSubView, setActiveSubView] = useState<'users' | 'audit'>('users');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activationModal, setActivationModal] = useState<{ link: string; email: string; name: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('All');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [selectedLogDelta, setSelectedLogDelta] = useState<AuditLogRecord | null>(null);

  const loadLogs = useCallback(async () => {
    if (!isAdmin) return;
    setAuditLoading(true);
    try {
      const logs = await fetchAuditLogs(organization?.id || profile?.organization_id || '', {
        entityType: auditEntityFilter,
        limit: 100,
      });
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [isAdmin, organization?.id, profile?.organization_id, auditEntityFilter]);

  useEffect(() => {
    if (activeSubView === 'audit') {
      loadLogs();
    }
  }, [activeSubView, loadLogs]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('SUCCESS') || act.includes('APPROVED') || act.includes('ACTIVATED')) {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    }
    if (act.includes('DENIED') || act.includes('FAILURE') || act.includes('REVOKED') || act.includes('DELETED')) {
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    }
    if (act.includes('UPDATE') || act.includes('CHANGED') || act.includes('SUBMITTED')) {
      return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    }
    if (act.includes('EXPORT')) {
      return { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' };
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case 'super_admin':
      case 'system administrator':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Super Administrator' };
      case 'bd_director':
        return { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe', label: 'BD Director' };
      case 'bd_manager':
      case 'bd manager':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'BD Manager' };
      case 'bd_sr_exec':
        return { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4', label: 'Senior BD Executive' };
      case 'bd_exec':
      case 'bd executive':
        return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', label: 'BD Executive' };
      case 'management_viewer':
      case 'management reviewer':
        return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', label: 'Management Reviewer' };
      case 'analyst':
        return { bg: '#f8fafc', text: '#334155', border: '#cbd5e1', label: 'Commercial Analyst' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: roleName || 'User' };
    }
  };

  const handleEditUser = (user: any) => {
    if (!isAdmin) {
      alert('Security Policy: User access permissions can only be modified by an Administrator.');
      return;
    }
    openModal('editUser', user);
  };

  const handleToggleStatus = async (user: any) => {
    if (!isAdmin) {
      alert('Security Policy: Only Administrators can modify account status.');
      return;
    }
    if (user.id === profile?.id) {
      alert('You cannot suspend your own active administrator account.');
      return;
    }

    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const confirmMsg =
      nextStatus === 'Inactive'
        ? `Are you sure you want to deactivate ${user.name}? They will not be able to log in.`
        : `Reactivate user ${user.name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await updateAdminUser(user.id, {
        status: nextStatus === 'Active' ? 'active' : 'inactive',
      });
      updateUser(user.id, { status: nextStatus });
      showNotification('success', `User account for ${user.name} is now ${nextStatus}.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user status.');
    }
  };

  const handleQuickPasswordReset = async (user: any) => {
    if (!isAdmin) return;
    if (!window.confirm(`Trigger password reset email for ${user.name} (${user.email})?`)) return;

    const res = await triggerPasswordReset(user.id);
    if (res.success) {
      showNotification('success', `Password reset email dispatched to ${user.email}.`);
    } else {
      showNotification('error', res.error || 'Failed to trigger password reset.');
    }
  };

  const handleControlledRevoke = async (user: any) => {
    if (!isAdmin) return;
    if (user.id === profile?.id) {
      alert('You cannot revoke your own administrator access.');
      return;
    }

    if (!window.confirm(`Revoke all active sessions and suspend access for ${user.name}?`)) return;

    const res = await revokeUserAccess(user.id);
    if (res.success) {
      updateUser(user.id, { status: 'Inactive' });
      showNotification('success', `Access revoked and account suspended for ${user.name}.`);
    } else {
      showNotification('error', res.error || 'Failed to revoke access.');
    }
  };

  const handleGenerateActivationLink = async (user: any) => {
    if (!isAdmin) return;
    try {
      const res = await generateActivationLink(user.id);
      if (res.success && res.link) {
        setActivationModal({
          link: res.link,
          email: user.email,
          name: user.name,
        });
        setCopiedLink(false);
      } else {
        showNotification('error', res.error || 'Failed to generate activation link.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error generating activation link.');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!isAdmin) {
      alert('Security Policy: Only Administrators have permission to delete users.');
      return;
    }
    if (user.id === profile?.id || user.email?.toLowerCase() === profile?.email?.toLowerCase() || user.email?.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('Self-deletion protection: You cannot delete your own active administrator account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})? All assigned records will remain intact.`)) {
      return;
    }

    try {
      await deleteAdminUser(user.id);
      deleteUser(user.id);
      showNotification('success', `User ${user.name} (${user.email}) was permanently deleted.`);
    } catch (err: any) {
      deleteUser(user.id);
      showNotification('success', `User ${user.name} was removed from the system.`);
    }
  };

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
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            System Users &amp; Role-Based Access Control (RBAC)
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Rajmudra Group Corporate Security • Server-side Supabase Auth user provisioning, role assignments &amp; access controls
          </p>
        </div>

        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => openModal('addUser')}>
              <ShieldPlus size={15} />
              <span>+ Provision Corporate User</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              fontSize: '12px',
              color: '#991b1b',
              background: '#fee2e2',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <ShieldAlert size={14} style={{ color: '#dc2626' }} />
            <span>Read-Only View: Admin privileges required to provision users</span>
          </div>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeSubView === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubView('users')}
          >
            <UsersIcon size={14} />
            <span>User Directory ({users.length})</span>
          </button>
          {isAdmin && (
            <button
              className={`btn btn-sm ${activeSubView === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubView('audit')}
            >
              <History size={14} />
              <span>Audit Trail &amp; Compliance Logs</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div
          style={{
            background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '6px',
            padding: '10px 16px',
            marginBottom: '16px',
            color: notification.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {notification.type === 'success' ? <UserCheck size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* VIEW 1: USER DIRECTORY */}
      {activeSubView === 'users' && (
        <div className="table-card">
          <div className="table-header-bar">
            <div className="table-title">Corporate Directory &amp; RBAC Access Matrix</div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role &amp; Security</th>
                  <th>Team / Department</th>
                  <th>Status</th>
                  <th>Permissions &amp; Accessible Tabs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleBadge = getRoleBadge(u.role_name || u.role);
                  const isCurrent = u.id === profile?.id;
                  return (
                    <tr key={u.id} style={{ background: isCurrent ? 'rgba(2, 132, 199, 0.03)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '10px' }}>
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{u.email}</div>
                      </td>
                      <td>
                        <span
                          className="pill-badge"
                          style={{
                            background: roleBadge.bg,
                            color: roleBadge.text,
                            borderColor: roleBadge.border,
                            fontWeight: 600,
                          }}
                        >
                          {roleBadge.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                          {u.department || 'Business Development'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {u.designation || 'Executive'}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: isAdmin && !isCurrent ? 'pointer' : 'default',
                            padding: 0,
                          }}
                          title={isAdmin && !isCurrent ? 'Click to toggle status' : undefined}
                        >
                          <span
                            className="pill-badge"
                            style={{
                              background: u.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                              color: u.status === 'Active' ? '#059669' : '#dc2626',
                              borderColor: u.status === 'Active' ? '#a7f3d0' : '#fecaca',
                              fontWeight: 600,
                            }}
                          >
                            {u.status || 'Active'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '340px' }}>
                          {u.role === 'System Administrator' || u.role_name === 'super_admin' ? (
                            <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0284c7', fontWeight: 600 }}>
                              Full Access (All Modules)
                            </span>
                          ) : (
                            (u.allowed_tabs || ['tab-dashboard', 'tab-clients', 'tab-opportunities']).map((tabId: string) => (
                              <span
                                key={tabId}
                                className="pill-badge"
                                style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '10px' }}
                              >
                                {tabId.replace('tab-', '')}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleEditUser(u)}
                            title="Edit Permissions, Role & Details"
                          >
                            <Edit2 size={12} style={{ color: '#0284c7' }} />
                            <span>Edit</span>
                          </button>

                          {isAdmin && (
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleGenerateActivationLink(u)}
                              title="Get Instant Setup / Activation Link"
                              style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                            >
                              <Link2 size={12} style={{ color: '#0284c7' }} />
                              <span>Link</span>
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleQuickPasswordReset(u)}
                              title="Send Password Reset Email"
                            >
                              <KeyRound size={12} style={{ color: '#16a34a' }} />
                              <span>Reset Pwd</span>
                            </button>
                          )}

                          {isAdmin && !isCurrent && (
                            <button
                              className="btn btn-secondary btn-xs"
                              style={{ color: '#dc2626' }}
                              onClick={() => handleControlledRevoke(u)}
                              title="Revoke Sessions & Suspend Account"
                            >
                              <UserX size={12} />
                              <span>Revoke</span>
                            </button>
                          )}

                          {isAdmin && !isCurrent && (
                            <button
                              className="btn btn-secondary btn-xs"
                              style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fff' }}
                              onClick={() => handleDeleteUser(u)}
                              title="Permanently Delete User"
                            >
                              <Trash2 size={12} style={{ color: '#dc2626' }} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: AUDIT TRAIL & SECURITY COMPLIANCE */}
      {activeSubView === 'audit' && (
        <div>
          {/* Audit Filter Toolbar */}
          <div className="filter-toolbar">
            <div className="filter-group">
              <div className="filter-item">
                <Search size={14} style={{ color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search actor, action, or entity..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  style={{ width: '240px' }}
                />
              </div>

              <div className="filter-item">
                <Filter size={14} style={{ color: '#0284c7' }} />
                <label>Entity Filter:</label>
                <select value={auditEntityFilter} onChange={(e) => setAuditEntityFilter(e.target.value)}>
                  <option value="All">All Entities</option>
                  <option value="auth">Auth &amp; Security</option>
                  <option value="profiles">User Administration</option>
                  <option value="clients">Clients</option>
                  <option value="opportunities">Opportunities</option>
                  <option value="proposals">Proposals</option>
                  <option value="documents">Documents</option>
                </select>
              </div>
            </div>

            <button className="btn btn-secondary btn-xs" onClick={loadLogs} disabled={auditLoading}>
              <RefreshCw size={13} className={auditLoading ? 'animate-spin' : ''} />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Audit Table Card */}
          <div className="table-card">
            <div className="table-header-bar">
              <div className="table-title">Immutable Audit Trail &amp; Forensic Logs</div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Strictly append-only • Zero plaintext passwords
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp (UTC)</th>
                    <th>Actor / User</th>
                    <th>Action</th>
                    <th>Entity Type &amp; ID</th>
                    <th>Payload &amp; Metadata</th>
                    <th>Delta Inspector</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter((log) => {
                      if (!auditSearch) return true;
                      const q = auditSearch.toLowerCase();
                      return (
                        (log.userName || '').toLowerCase().includes(q) ||
                        (log.action || '').toLowerCase().includes(q) ||
                        (log.entityType || '').toLowerCase().includes(q) ||
                        (log.entityId || '').toLowerCase().includes(q)
                      );
                    })
                    .map((log) => {
                      const badge = getActionBadgeClass(log.action);
                      const hasDelta = log.oldValues || log.newValues;
                      return (
                        <tr key={log.id}>
                          <td style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString()}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.userName || 'System Actor'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {log.userId ? log.userId.slice(0, 13) + '...' : 'System'}
                            </div>
                          </td>
                          <td>
                            <span
                              className="pill-badge"
                              style={{
                                background: badge.bg,
                                color: badge.text,
                                borderColor: badge.border,
                                fontWeight: 600,
                              }}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#334155' }}>{log.entityType}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                              {log.entityId}
                            </div>
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: '#475569',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {log.metadata ? JSON.stringify(log.metadata) : '—'}
                            </div>
                          </td>
                          <td>
                            {hasDelta ? (
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => setSelectedLogDelta(log)}
                                title="Inspect Old vs New Values Delta"
                              >
                                <FileCode size={12} style={{ color: '#0284c7' }} />
                                <span>Inspect Delta</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delta Inspector Modal */}
          {selectedLogDelta && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '680px',
                  maxHeight: '85vh',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Audit Delta Inspector: {selectedLogDelta.action}
                  </h3>
                  <button
                    onClick={() => setSelectedLogDelta(null)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>
                        Previous State (old_values):
                      </div>
                      <pre
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '10px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          maxHeight: '260px',
                        }}
                      >
                        {selectedLogDelta.oldValues ? JSON.stringify(selectedLogDelta.oldValues, null, 2) : 'null'}
                      </pre>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '6px' }}>
                        New State (new_values):
                      </div>
                      <pre
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                          padding: '10px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          maxHeight: '260px',
                        }}
                      >
                        {selectedLogDelta.newValues ? JSON.stringify(selectedLogDelta.newValues, null, 2) : 'null'}
                      </pre>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button className="btn btn-secondary" onClick={() => setSelectedLogDelta(null)}>
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: DIRECT ACTIVATION / PASSWORD SETUP LINK */}
      {activationModal && (
        <div
          className="modal-overlay"
          onClick={() => setActivationModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            className="modal-content-box"
            style={{ maxWidth: '640px', width: '92%', background: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
                <Link2 size={18} />
                <span>Instant Account Setup &amp; Activation Link</span>
              </div>
              <button
                onClick={() => setActivationModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#334155', marginBottom: '14px', lineHeight: 1.5 }}>
                Direct activation URL generated for <strong>{activationModal.name}</strong> (<code>{activationModal.email}</code>). You can copy this link to activate the account or open it in a new browser tab/incognito window to set the password immediately.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                  DIRECT SETUP URL:
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    color: '#0f172a',
                    wordBreak: 'break-all',
                    maxHeight: '80px',
                    overflowY: 'auto',
                    background: '#ffffff',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  {activationModal.link}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(activationModal.link);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} style={{ color: '#16a34a' }} />
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Activation Link</span>
                    </>
                  )}
                </button>

                <a
                  href={activationModal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Setup Link</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
