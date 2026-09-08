import React, { useState } from 'react';
import {
  Calendar, Plus, Search, MapPin, Trash2, Clock, Users, Building
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatDate } from '../../utils/formatters';

export const ActivitiesTab: React.FC = () => {
  const { activities, deleteActivity, openModal, teamMembers, clients, opportunities } = useCRM();

  const [clientTypeFilter, setClientTypeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [repFilter, setRepFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const filteredActivities = activities.filter((act) => {
    // Resolve client type from activity or from client master
    const matchedClient = clients.find((c) => c.id === act.clientId || c.name === act.clientName);
    const resolvedClientType = act.clientType || matchedClient?.clientType || 'Existing Client';

    if (clientTypeFilter !== 'All' && resolvedClientType !== clientTypeFilter) return false;
    if (typeFilter !== 'All' && act.type !== typeFilter) return false;
    if (repFilter !== 'All' && act.conductedBy !== repFilter) return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      const matchClient = act.clientName.toLowerCase().includes(q);
      const matchDiscussion = act.keyDiscussion.toLowerCase().includes(q);
      const matchContact = act.contactPerson.toLowerCase().includes(q);
      return matchClient || matchDiscussion || matchContact;
    }
    return true;
  });

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
            Client Engagement &amp; Interaction History
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Chronological audit of meetings, calls, and commercial proposals with direct delegation matrix handoff
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => openModal('addActivity')}>
          <Plus size={15} />
          <span>+ Log New Activity &amp; Delegation</span>
        </button>
      </div>

      {/* Filter Toolbar with Client Type Filter */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <div className="filter-item">
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search discussions, client, contact..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: '230px' }}
            />
          </div>

          <div className="filter-item">
            <label>Client Type:</label>
            <select value={clientTypeFilter} onChange={(e) => setClientTypeFilter(e.target.value)}>
              <option value="All">All Client Types</option>
              <option value="New Client">New Client Interactions</option>
              <option value="Existing Client">Existing Client Interactions</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Interaction Type:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Physical Meeting">Physical Meeting</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Proposal Discussion">Proposal Discussion</option>
              <option value="Commercial Negotiation">Commercial Negotiation</option>
              <option value="Site Visit">Site Visit</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Conducted By:</label>
            <select value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
              <option value="All">All Team Members</option>
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.name}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          {filteredActivities.length} Logged Interactions
        </span>
      </div>

      {/* Timeline Cards Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {filteredActivities.map((act) => {
          const matchedClient = clients.find((c) => c.id === act.clientId || c.name === act.clientName);
          const matchedOpp = opportunities.find((o) => o.id === act.opportunityId || o.clientId === act.clientId);
          const resolvedClientType = act.clientType || matchedClient?.clientType || 'Existing Client';
          const isNew = resolvedClientType === 'New Client';

          return (
            <div
              key={act.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      className="pill-badge"
                      style={{
                        background:
                          act.type === 'Physical Meeting'
                            ? '#eff6ff'
                            : act.type === 'Commercial Negotiation'
                            ? '#fef3c7'
                            : '#f1f5f9',
                        color:
                          act.type === 'Physical Meeting'
                            ? '#2563eb'
                            : act.type === 'Commercial Negotiation'
                            ? '#d97706'
                            : '#475569',
                        fontWeight: 700,
                      }}
                    >
                      {act.type}
                    </span>

                    {/* New Client vs Existing Client badge */}
                    <span
                      className="pill-badge"
                      style={{
                        background: isNew ? '#e0f2fe' : '#ecfdf5',
                        color: isNew ? '#0369a1' : '#047857',
                        border: `1px solid ${isNew ? '#bae6fd' : '#a7f3d0'}`,
                        fontWeight: 700,
                        fontSize: '10.5px',
                      }}
                    >
                      {isNew ? '★ New Client' : '✓ Existing Client'}
                    </span>

                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{act.clientName}</strong>
                    {act.opportunityTitle && (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>• {act.opportunityTitle}</span>
                    )}
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    Contact Person: <strong style={{ color: '#0f172a' }}>{act.contactPerson}</strong> • Logged by{' '}
                    <strong style={{ color: '#0284c7' }}>{act.conductedBy}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {formatDate(act.date)} {act.time ? `at ${act.time}` : ''}
                  </span>
                  {matchedOpp && (
                    <button
                      className="btn btn-secondary btn-xs"
                      title="View all activities & timeline from date of inception"
                      onClick={() => openModal('dealInception', matchedOpp)}
                    >
                      <Clock size={11} style={{ color: '#0284c7' }} />
                      <span>Inception Timeline</span>
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ color: '#dc2626' }}
                    onClick={() => deleteActivity(act.id)}
                    title="Delete Activity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Discussion body */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '10px',
                  fontSize: '13px',
                  color: '#334155',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Key Discussion:</strong>
                {act.keyDiscussion}
              </div>

              {/* Outcome & Action Items */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                {act.outcome && (
                  <div>
                    <span style={{ color: '#64748b' }}>Outcome: </span>
                    <strong style={{ color: '#16a34a' }}>{act.outcome}</strong>
                  </div>
                )}
                {act.actionItems && (
                  <div>
                    <span style={{ color: '#64748b' }}>Action Items: </span>
                    <strong style={{ color: '#0284c7' }}>{act.actionItems}</strong>
                  </div>
                )}
              </div>

              {act.nextFollowupDate && (
                <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} style={{ color: '#d97706' }} />
                  <span>Next Follow-up Due: <strong>{formatDate(act.nextFollowupDate)}</strong></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
