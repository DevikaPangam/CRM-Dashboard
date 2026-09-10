import React from 'react';
import { Layers, Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { formatCurrency } from '../../utils/formatters';

export const SegmentsTab: React.FC = () => {
  const { segments, opportunities, clients, currency, openModal, deleteSegment, currentUser } = useCRM();
  const { isOrgAdmin, canEdit } = useRBAC();

  const isAdmin = isOrgAdmin || canEdit('segments');

  const handleDelete = (segmentId: string, segmentName: string) => {
    if (!isAdmin) {
      alert('Security Alert: Only System Administrators have permission to delete business segments.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete business segment "${segmentName}"? All associated metrics will be updated.`)) {
      deleteSegment(segmentId);
    }
  };

  const handleEdit = (segment: any) => {
    if (!isAdmin) {
      alert('Security Alert: Only System Administrators have permission to modify business segments.');
      return;
    }
    openModal('editSegment', segment);
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
            Corporate Business Segments &amp; Service Lines
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Service portfolio division, margin thresholds, practice leads, and revenue contributions
          </p>
        </div>

        {isAdmin ? (
          <button className="btn btn-primary" onClick={() => openModal('addSegment')}>
            <Plus size={15} />
            <span>+ Add Business Segment</span>
          </button>
        ) : (
          <div
            style={{
              fontSize: '11.5px',
              color: '#64748b',
              background: '#f1f5f9',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#0284c7' }} />
            <span>Segment Management: System Admin Mode Only</span>
          </div>
        )}
      </div>

      {/* Segments Cards Grid with Horizontal & Vertical Scroll Protection */}
      <div className="dashboard-scroll-section">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '18px',
            marginBottom: '28px',
            minWidth: '720px',
          }}
        >
          {segments.map((segment) => {
            const segOpps = opportunities.filter((o) => o.segment === segment.name);
            const segClients = clients.filter((c) => c.segment === segment.name);
            const segPipelineVal = segOpps
              .filter((o) => o.status !== 'Won' && o.status !== 'Lost')
              .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
            const segWonVal = segOpps
              .filter((o) => o.status === 'Won')
              .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);

            return (
              <div
                key={segment.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: '#10b981',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {segment.id}
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                        {segment.name}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="pill-badge" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                        {segment.category}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', minHeight: '36px' }}>
                    {segment.description}
                  </p>

                  {/* Metrics Box */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '14px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Active Pipeline:</span>
                      <strong style={{ color: '#0284c7' }}>{formatCurrency(segPipelineVal, currency)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Won YTD:</span>
                      <strong style={{ color: '#16a34a' }}>{formatCurrency(segWonVal, currency)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#64748b' }}>Target Gross Margin:</span>
                      <strong style={{ color: '#d97706' }}>{segment.targetMarginPct}%</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', marginBottom: '14px' }}>
                    <div>
                      Practice Lead: <strong style={{ color: '#0f172a' }}>{segment.leadOwner}</strong>
                    </div>
                    <div>
                      Clients: <strong style={{ color: '#0f172a' }}>{segClients.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Edit and Delete Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ flex: 1 }}
                    onClick={() => handleEdit(segment)}
                    title="Edit Segment"
                  >
                    <Edit2 size={12} style={{ color: '#0284c7' }} />
                    <span>Edit Segment</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleDelete(segment.id, segment.name)}
                    title="Delete Segment"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment Performance Breakdown Table with Edit & Delete Controls */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">Segment Master &amp; Target Comparison Table</div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Segment Code &amp; Name</th>
                <th>Category</th>
                <th>Practice Lead</th>
                <th>Active Pipeline Value</th>
                <th>Won Revenue (YTD)</th>
                <th>Target Margin</th>
                <th>Active Client Accounts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => {
                const segOpps = opportunities.filter((o) => o.segment === seg.name);
                const segClients = clients.filter((c) => c.segment === seg.name);
                const pipelineVal = segOpps
                  .filter((o) => o.status !== 'Won' && o.status !== 'Lost')
                  .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
                const wonVal = segOpps
                  .filter((o) => o.status === 'Won')
                  .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);

                return (
                  <tr key={seg.id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{seg.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{seg.id}</div>
                    </td>
                    <td>
                      <span className="pill-badge" style={{ background: '#f8fafc', color: '#475569' }}>
                        {seg.category}
                      </span>
                    </td>
                    <td>{seg.leadOwner}</td>
                    <td>
                      <strong style={{ color: '#0284c7' }}>{formatCurrency(pipelineVal, currency)}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#16a34a' }}>{formatCurrency(wonVal, currency)}</strong>
                    </td>
                    <td>
                      <span className="pill-badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                        {seg.targetMarginPct}%
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{segClients.length} Clients</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleEdit(seg)}
                          title="Edit Segment"
                        >
                          <Edit2 size={12} style={{ color: '#0284c7' }} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{ color: '#dc2626' }}
                          onClick={() => handleDelete(seg.id, seg.name)}
                          title="Delete Segment"
                        >
                          <Trash2 size={12} />
                        </button>
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
