import React, { useState, useEffect } from 'react';
import { X, History, Clock, Target, Award, Calendar, CheckCircle2, User } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { fetchAuditLogs, AuditLogRecord } from '../../services/auditService';
import { EmployeeKRA, User as CRMUser } from '../../types/crm';
import { formatDate } from '../../utils/formatters';

export const KRAHistoryModal: React.FC = () => {
  const { closeModal, activeModal } = useCRM();
  const targetEmployee: CRMUser | undefined = activeModal.data?.employee;
  const kras: EmployeeKRA[] = activeModal.data?.kras || [];

  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (targetEmployee) {
      const orgId = targetEmployee.organization_id || '00000000-0000-0000-0000-000000000001';
      fetchAuditLogs(orgId, {
        limit: 50,
      }).then((logs) => {
        if (isMounted) {
          const kraLogs = logs.filter(
            (l) =>
              l.action.includes('KPI') ||
              l.action.includes('KRA') ||
              l.entityType === 'employee_kpis' ||
              l.entityType === 'employee_kras' ||
              (l.metadata && (l.metadata.employee_id === targetEmployee.id || l.metadata.user_id === targetEmployee.id))
          );
          setAuditLogs(kraLogs);
          setLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [targetEmployee]);

  if (!targetEmployee) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <History size={18} style={{ color: '#0284c7' }} />
            <span>KRA &amp; KPI Revision &amp; Appraisal History ({targetEmployee.name})</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-section" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Employee Badge */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{targetEmployee.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {targetEmployee.designation || targetEmployee.role} • {targetEmployee.department || 'Business Development'}
              </div>
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Active Scorecards: {kras.length} KRAs
            </span>
          </div>

          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
            Historical Modifications &amp; Manager Review Audits
          </h4>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              Loading revision logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                color: '#0369a1',
                fontSize: '13px',
              }}
            >
              <CheckCircle2 size={24} style={{ margin: '0 auto 8px auto', color: '#0284c7' }} />
              <div>No manual revisions logged yet for this evaluation cycle.</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                All future KPI score adjustments, target revisions, and managerial feedback comments will be recorded here with an immutable audit timestamp.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#1e293b', marginTop: '4px' }}>
                    {log.metadata?.kpi_name ? (
                      <span><strong>Metric:</strong> {log.metadata.kpi_name}</span>
                    ) : (
                      <span><strong>Entity:</strong> {log.entityType} ({log.entityId.slice(0, 8)})</span>
                    )}
                  </div>

                  {log.newValues && (
                    <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', marginTop: '4px' }}>
                      {log.newValues.actual_value !== undefined && (
                        <span>Actual: <strong>{log.newValues.actual_value}</strong> • </span>
                      )}
                      {log.newValues.achievement_pct !== undefined && (
                        <span>Attainment: <strong>{log.newValues.achievement_pct}%</strong> • </span>
                      )}
                      {log.newValues.status && <span>Status: <strong>{log.newValues.status}</strong></span>}
                      {log.newValues.manager_comment && (
                        <div style={{ color: '#0369a1', marginTop: '3px' }}>
                          Comment: "{log.newValues.manager_comment}"
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Logged by: {log.userName || 'System Administrator'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer-section">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
