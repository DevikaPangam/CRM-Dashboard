import React from 'react';
import { ShieldCheck, ShieldPlus, Trash2, Edit2, ShieldAlert, Key } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const UsersTab: React.FC = () => {
  const { users, deleteUser, updateUser, openModal, currentUser } = useCRM();

  const isAdmin = currentUser.role === 'System Administrator';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'System Administrator':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'BD Manager':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'BD Executive':
        return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
      case 'Management Reviewer':
        return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  const handleEditPermissions = (user: any) => {
    if (!isAdmin) {
      alert('Security Policy: User access permissions can only be modified by a System Administrator.');
      return;
    }
    openModal('editUser', user);
  };

  const handleToggleStatus = (userId: string, currentStatus: 'Active' | 'Inactive') => {
    if (!isAdmin) {
      alert('Security Policy: Only System Administrators can enable or suspend user accounts.');
      return;
    }
    updateUser(userId, { status: currentStatus === 'Active' ? 'Inactive' : 'Active' });
  };

  const handleDeleteUser = (user: any) => {
    if (!isAdmin) {
      alert('Security Policy: Only System Administrators can delete user accounts.');
      return;
    }
    if (user.id === currentUser.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete user account "${user.name}"?`)) {
      deleteUser(user.id);
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
            Enterprise security layer • Permissions, role assignments, and tab access granted by System Administrator only
          </p>
        </div>

        {isAdmin ? (
          <button className="btn btn-primary" onClick={() => openModal('addUser')}>
            <ShieldPlus size={15} />
            <span>+ Add User &amp; Assign Permissions</span>
          </button>
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
            <span>Read-Only View: Admin privileges required to edit permissions</span>
          </div>
        )}
      </div>

      {/* Security notice banner */}
      <div
        style={{
          background: isAdmin ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${isAdmin ? '#bbf7d0' : '#fef08a'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: isAdmin ? '#166534' : '#92400e',
        }}
      >
        {isAdmin ? (
          <ShieldCheck size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
        ) : (
          <ShieldAlert size={20} style={{ color: '#d97706', flexShrink: 0 }} />
        )}
        <div style={{ fontSize: '12.5px' }}>
          <strong>System Administrator Authority:</strong>{' '}
          {isAdmin ? (
            <span>You have full administrative privileges to grant, revoke, and customize module permissions for all system users below.</span>
          ) : (
            <span>
              You are currently logged in as <strong>{currentUser.role}</strong>. User permissions and role assignments can only be created or modified by a <strong>System Administrator</strong>.
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">Registered Corporate Users ({users.length})</div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Full Name &amp; ID</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Permitted Modules / Tabs</th>
                <th>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleStyle = getRoleColor(u.role);
                const isCurrent = u.id === currentUser.id;

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#0284c7',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        >
                          {u.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{u.name}</strong>
                          {isCurrent && (
                            <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 700, marginLeft: '6px' }}>
                              (You)
                            </span>
                          )}
                          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                            {u.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className="pill-badge"
                        style={{ background: roleStyle.bg, color: roleStyle.text, borderColor: roleStyle.border, fontWeight: 700 }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <button
                        style={{
                          background: u.status === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: u.status === 'Active' ? '#16a34a' : '#dc2626',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: isAdmin ? 'pointer' : 'default',
                        }}
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        title={isAdmin ? 'Click to toggle status' : 'Status managed by System Administrator'}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '380px' }}>
                        {u.role === 'System Administrator' ? (
                          <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0284c7', fontWeight: 600 }}>
                            Full Access (All 10 Modules)
                          </span>
                        ) : (
                          u.allowed_tabs.map((tabId) => (
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
                          onClick={() => handleEditPermissions(u)}
                          title="Edit Permissions & Role"
                        >
                          <Key size={12} style={{ color: '#0284c7' }} />
                          <span>Permissions</span>
                        </button>
                        {!isCurrent && (
                          <button
                            className="btn btn-secondary btn-xs"
                            style={{ color: '#dc2626' }}
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                          >
                            <Trash2 size={12} />
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
    </section>
  );
};
