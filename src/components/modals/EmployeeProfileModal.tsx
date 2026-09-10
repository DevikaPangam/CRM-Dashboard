import React from 'react';
import {
  X, User, Shield, Building2, MapPin, Users, UserCheck, Calendar, Briefcase,
  Mail, Phone, Target, TrendingUp, Award, Clock, CheckCircle2, AlertCircle, Edit3, Crown, ExternalLink
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate, calculateTenure, getPerformanceStatus } from '../../utils/formatters';
import { User as CRMUser } from '../../types/crm';

export const EmployeeProfileModal: React.FC = () => {
  const { closeModal, activeModal, opportunities, clients, followups, currency, openModal, viewEmployeeProfile } = useCRM();
  const employee: CRMUser | undefined = activeModal.data;

  if (!employee) return null;

  // Filter associated CRM records
  const userOpps = opportunities.filter((o) => o.owner === employee.name);
  const activeOpps = userOpps.filter((o) => o.status !== 'Won' && o.status !== 'Lost');
  const wonOpps = userOpps.filter((o) => o.status === 'Won');

  const activePipelineVal = activeOpps.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  const wonVal = wonOpps.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  const targetVal = employee.annual_target_inr || 50000000;
  const achievePct = targetVal > 0 ? Math.round((wonVal / targetVal) * 100) : 0;
  const perfStatus = getPerformanceStatus(wonVal, targetVal);

  const userClients = clients.filter((c) => c.accountOwner === employee.name);
  const userFollowups = followups.filter((f) => f.assignedTo === employee.name && f.status === 'Pending');

  const tenure = calculateTenure(employee.joining_date);

  const handleEditAccess = () => {
    closeModal();
    setTimeout(() => {
      openModal('editUser', employee);
    }, 150);
  };

  const handleOpenFullPage = () => {
    closeModal();
    viewEmployeeProfile(employee.id);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content-box"
        style={{ maxWidth: '840px', width: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header-section" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: employee.avatar_bg || '#0284c7',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {employee.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
              {employee.is_regional_owner && (
                <span
                  title="Regional Territory Owner"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: '#f59e0b',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <Crown size={11} />
                </span>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {employee.name}
                </h2>
                {employee.employee_id && (
                  <span style={{ fontSize: '11px', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {employee.employee_id}
                  </span>
                )}
                <span
                  className="badge"
                  style={{
                    background: employee.status === 'Active' ? '#dcfce7' : '#fee2e2',
                    color: employee.status === 'Active' ? '#15803d' : '#b91c1c',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                >
                  {employee.status === 'Active' ? '🟢 Active Employee' : '🔴 Inactive / Disabled'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {employee.designation || employee.role} • {employee.department || 'Business Development'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleOpenFullPage} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ExternalLink size={13} />
              <span>Full Profile Page</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleEditAccess}>
              <Edit3 size={13} />
              <span>Edit Access</span>
            </button>
            <button className="modal-close-btn" onClick={closeModal}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body-section" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px' }}>
          {/* Section 1: Organizational Hierarchy Matrix */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0369a1', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} />
              <span>Multi-Tier Organizational Hierarchy</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Organization</span>
                <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Rajmudra Group</strong>
              </div>

              <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Region</span>
                <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{employee.region || 'West Region'}</strong>
              </div>

              <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Assigned Team</span>
                <strong style={{ fontSize: '12.5px', color: '#0369a1' }}>{employee.team_name || 'Enterprise BD West'}</strong>
              </div>

              <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Reporting Manager</span>
                <strong style={{ fontSize: '12.5px', color: '#334155' }}>{employee.manager_name || 'Devika Pangam'}</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Employment & Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} style={{ color: '#0284c7' }} />
                <span>Employment Profile</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Employment Type:</span>
                  <strong style={{ color: '#0f172a' }}>{employee.employment_type || 'Full-time'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Joining Date:</span>
                  <strong style={{ color: '#0f172a' }}>{formatDate(employee.joining_date)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Company Tenure:</span>
                  <strong style={{ color: '#0369a1' }}>{tenure}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Base Location:</span>
                  <strong style={{ color: '#0f172a' }}>{employee.location || 'Corporate HQ - Mumbai'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Regional Ownership:</span>
                  <strong style={{ color: employee.is_regional_owner ? '#d97706' : '#64748b' }}>
                    {employee.is_regional_owner ? '👑 Regional Owner' : 'Team Member'}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: '#0284c7' }} />
                <span>Contact &amp; Credentials</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Corporate Email:</span>
                  <strong style={{ color: '#0284c7' }}>{employee.email}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Contact Phone:</span>
                  <strong style={{ color: '#0f172a' }}>{employee.phone || '+91 98000 00000'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>System Role:</span>
                  <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {employee.role_name || employee.role}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>User Identity (UUID):</span>
                  <code style={{ fontSize: '10.5px', color: '#64748b' }}>{employee.id.slice(0, 13)}...</code>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Quota & Performance Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} style={{ color: '#0284c7' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Annual Revenue Quota &amp; YTD Achievement</span>
              </div>
              <span
                style={{
                  background: perfStatus.badgeBg,
                  color: perfStatus.badgeText,
                  border: `1px solid ${perfStatus.badgeBorder}`,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {perfStatus.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Annual Quota</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {formatCurrency(targetVal, currency)}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#15803d' }}>Won Revenue (YTD)</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                  {formatCurrency(wonVal, currency)}
                </div>
              </div>
              <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#1e40af' }}>Active Pipeline</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                  {formatCurrency(activePipelineVal, currency)}
                </div>
              </div>
            </div>

            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(achievePct, 100)}%`,
                  height: '100%',
                  background: achievePct >= 70 ? '#10b981' : achievePct >= 40 ? '#3b82f6' : '#f59e0b',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11.5px' }}>
              <span style={{ color: '#64748b' }}>Quota Accomplishment</span>
              <strong style={{ color: '#0284c7' }}>{achievePct}% Achieved ({wonOpps.length} Deals Closed Won)</strong>
            </div>
          </div>

          {/* Section 4: Associated CRM Records Tabs / Lists */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Active Opportunities */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Active Opportunities ({activeOpps.length})</strong>
              </div>
              {activeOpps.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                  No active opportunities currently owned.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {activeOpps.map((opp) => (
                    <div
                      key={opp.id}
                      style={{
                        background: '#fff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11.5px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{opp.title}</strong>
                        <span style={{ color: '#64748b' }}>{opp.clientName} • {opp.stage}</span>
                      </div>
                      <strong style={{ color: '#2563eb' }}>{formatCurrency(opp.dealValueINR, currency)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Owned Clients & Accounts */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Managed Client Accounts ({userClients.length})</strong>
              </div>
              {userClients.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                  No primary client accounts assigned.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {userClients.map((client) => (
                    <div
                      key={client.id}
                      style={{
                        background: '#fff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11.5px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{client.name}</strong>
                        <span style={{ color: '#64748b' }}>{client.industry} • {client.city}</span>
                      </div>
                      <span style={{ fontSize: '10.5px', background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {client.tier || 'Enterprise'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-section" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
            Unified Supabase Profiles Master • Updated real-time
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={closeModal}>
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
