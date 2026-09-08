import React, { useState } from 'react';
import {
  UserCheck, UserPlus, Target, TrendingUp, Phone, Mail, MapPin, Award,
  Edit3, Trash2, UserX, ShieldAlert, CheckCircle, PowerOff
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';
import { TeamMember } from '../../types/crm';

export const TeamTab: React.FC = () => {
  const { teamMembers, opportunities, currency, openModal, updateTeamMember, deleteTeamMember } = useCRM();
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Disabled'>('All');
  const [regionFilter, setRegionFilter] = useState('All');

  const filteredMembers = teamMembers.filter((m) => {
    const memberStatus = m.status || 'Active';
    if (statusFilter !== 'All' && memberStatus !== statusFilter) return false;
    if (regionFilter !== 'All' && !m.region.toLowerCase().includes(regionFilter.toLowerCase())) return false;
    return true;
  });

  const activeCount = teamMembers.filter((m) => (m.status || 'Active') === 'Active').length;
  const inactiveCount = teamMembers.filter((m) => m.status === 'Inactive').length;
  const disabledCount = teamMembers.filter((m) => m.status === 'Disabled').length;

  const handleQuickStatusChange = (member: TeamMember, newStatus: TeamMember['status']) => {
    updateTeamMember(member.id, { status: newStatus });
  };

  const handleDelete = (member: TeamMember) => {
    if (window.confirm(`Are you sure you want to delete ${member.name}? This cannot be undone.`)) {
      deleteTeamMember(member.id);
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
            Business Development Team &amp; Regional Owners
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Individual target achievement, active pipeline volumes, regional ownership, and user status governance
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => openModal('addTeam')}>
          <UserPlus size={15} />
          <span>+ Add BD Team Member</span>
        </button>
      </div>

      {/* Filter and Status Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '20px' }}>
        <div className="filter-group">
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All Members ({teamMembers.length})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              🟢 Active ({activeCount})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              ⚪ Inactive ({inactiveCount})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Disabled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Disabled')}
            >
              🔴 User Disabled ({disabledCount})
            </button>
          </div>

          <div className="filter-item" style={{ marginLeft: '12px' }}>
            <label>Region:</label>
            <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="All">All Regions</option>
              <option value="North">North</option>
              <option value="West">West</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="Central">Central</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
          Showing {filteredMembers.length} of {teamMembers.length} Executives
        </span>
      </div>

      {/* Team Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {filteredMembers.map((member) => {
          const memberStatus = member.status || 'Active';
          const memberOpps = opportunities.filter((o) => o.owner === member.name);
          const activePipelineVal = memberOpps
            .filter((o) => o.status !== 'Won' && o.status !== 'Lost')
            .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
          const wonVal = memberOpps
            .filter((o) => o.status === 'Won')
            .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);

          const achievePct = member.annualTargetINR > 0 ? Math.round((wonVal / member.annualTargetINR) * 100) : 0;

          return (
            <div
              key={member.id}
              style={{
                background: '#ffffff',
                border: memberStatus === 'Disabled' ? '1px solid #fecaca' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: memberStatus === 'Disabled' ? 0.78 : memberStatus === 'Inactive' ? 0.88 : 1,
                position: 'relative',
              }}
            >
              <div>
                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: memberStatus === 'Disabled' ? '#94a3b8' : member.avatarBg || '#3b82f6',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '15px',
                      }}
                    >
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{member.name}</h3>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{member.title}</div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className="pill-badge"
                    style={{
                      background:
                        memberStatus === 'Active'
                          ? '#dcfce7'
                          : memberStatus === 'Disabled'
                          ? '#fee2e2'
                          : '#f1f5f9',
                      color:
                        memberStatus === 'Active'
                          ? '#15803d'
                          : memberStatus === 'Disabled'
                          ? '#b91c1c'
                          : '#475569',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    {memberStatus === 'Active' && '🟢 Active'}
                    {memberStatus === 'Inactive' && '⚪ Inactive'}
                    {memberStatus === 'Disabled' && '🔴 User Disabled'}
                  </span>
                </div>

                {/* Target vs Achieved Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '14px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Annual Target:</span>
                    <strong style={{ color: '#0f172a' }}>{formatCurrency(member.annualTargetINR, currency)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Won YTD:</span>
                    <strong style={{ color: '#16a34a' }}>{formatCurrency(wonVal, currency)}</strong>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(achievePct, 100)}%`,
                        height: '100%',
                        background: achievePct >= 70 ? '#10b981' : achievePct >= 40 ? '#3b82f6' : '#f59e0b',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px' }}>
                    <span style={{ color: '#64748b' }}>Target Progress</span>
                    <strong style={{ color: '#0284c7' }}>{achievePct}% Achieved</strong>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#15803d' }}>Active Pipeline</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                      {formatCurrency(activePipelineVal, currency)}
                    </div>
                  </div>
                  <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#1e40af' }}>Active Deals</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
                      {memberOpps.length} Opportunities
                    </div>
                  </div>
                </div>

                {/* Contact information */}
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} style={{ color: '#0284c7' }} />
                    <span>{member.region}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={12} style={{ color: '#0284c7' }} />
                    <span>{member.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={12} style={{ color: '#0284c7' }} />
                    <span>{member.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar: Edit, Delete, Status Toggle */}
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
                {/* Quick status dropdown / buttons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {memberStatus !== 'Active' && (
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                      onClick={() => handleQuickStatusChange(member, 'Active')}
                      title="Set to Active"
                    >
                      <CheckCircle size={11} />
                      <span>Set Active</span>
                    </button>
                  )}
                  {memberStatus !== 'Inactive' && memberStatus !== 'Disabled' && (
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleQuickStatusChange(member, 'Inactive')}
                      title="Set to Inactive"
                    >
                      <span>Inactive</span>
                    </button>
                  )}
                  {memberStatus !== 'Disabled' && (
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                      onClick={() => handleQuickStatusChange(member, 'Disabled')}
                      title="Disable User Access"
                    >
                      <PowerOff size={11} />
                      <span>Disable User</span>
                    </button>
                  )}
                </div>

                {/* Edit & Delete */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => openModal('editTeam', member)}
                    title="Edit Team Member Profile & Targets"
                  >
                    <Edit3 size={11} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleDelete(member)}
                    title="Delete Team Member"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
