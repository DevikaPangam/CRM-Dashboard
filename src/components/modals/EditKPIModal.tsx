import React, { useState, useEffect } from 'react';
import { X, Target, Save, MessageSquare, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { EmployeeKPI } from '../../types/crm';
import { updateEmployeeKPI } from '../../services/kraKpiService';
import { calculateKPIAchievement, formatKPIValue } from '../../utils/kpiCalculationEngine';

export const EditKPIModal: React.FC = () => {
  const { closeModal, activeModal, currentUser } = useCRM();
  const { profile } = useAuth();
  const targetKPI: EmployeeKPI | undefined = activeModal.data?.kpi;
  const onSaved: ((kpi: EmployeeKPI) => void) | undefined = activeModal.data?.onSaved;

  const isManagerOrAdmin =
    profile?.role === 'super_admin' ||
    profile?.role === 'bd_director' ||
    profile?.role === 'bd_manager' ||
    currentUser?.role === 'System Administrator' ||
    currentUser?.role_name === 'super_admin' ||
    currentUser?.role_name === 'bd_manager';

  const [actualValue, setActualValue] = useState<number>(targetKPI?.actual_value ?? 0);
  const [targetValue, setTargetValue] = useState<number>(targetKPI?.target_value ?? 100);
  const [managerComment, setManagerComment] = useState<string>(targetKPI?.manager_comment ?? '');
  const [employeeComment, setEmployeeComment] = useState<string>(targetKPI?.employee_comment ?? '');
  const [status, setStatus] = useState<'Exceeded' | 'On Track' | 'Needs Improvement' | 'At Risk'>(
    targetKPI?.status ?? 'On Track'
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (targetKPI) {
      setActualValue(targetKPI.actual_value);
      setTargetValue(targetKPI.target_value);
      setManagerComment(targetKPI.manager_comment ?? '');
      setEmployeeComment(targetKPI.employee_comment ?? '');
      setStatus(targetKPI.status);
    }
  }, [targetKPI]);

  if (!targetKPI) return null;

  // Real-time calculation preview
  const preview = calculateKPIAchievement({
    kpiType: targetKPI.kpi_type,
    targetValue,
    actualValue,
    weightagePct: targetKPI.weightage_pct,
    targetRangeMin: targetKPI.target_range_min,
    targetRangeMax: targetKPI.target_range_max,
    unit: targetKPI.unit,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await updateEmployeeKPI(
        targetKPI.id,
        {
          actual_value: Number(actualValue),
          target_value: Number(targetValue),
          status,
          manager_comment: managerComment.trim() || undefined,
          employee_comment: employeeComment.trim() || undefined,
        },
        currentUser
      );

      setLoading(false);

      if (res.success && res.updatedKPI) {
        setSuccessMessage('KPI record updated and audited successfully.');
        if (onSaved) {
          onSaved(res.updatedKPI);
        }
        setTimeout(() => {
          closeModal();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Failed to update KPI record.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred while saving.');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Target size={18} style={{ color: '#0284c7' }} />
            <span>Update Key Performance Indicator</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  color: '#166534',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* KPI Header & Metadata */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Type: {targetKPI.kpi_type.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>Weight: {targetKPI.weightage_pct}%</span>
              </div>
              <h4 style={{ margin: '4px 0', fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                {targetKPI.name}
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>{targetKPI.description}</p>
            </div>

            {/* Live Calculation Preview Banner */}
            <div
              style={{
                background: preview.statusBg,
                border: `1px solid ${preview.statusBorder}`,
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: preview.statusColor }}>
                  CALCULATION ENGINE PREVIEW
                </div>
                <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '2px' }}>{preview.explanation}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: preview.statusColor }}>
                  {preview.achievementPct}%
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: preview.statusColor }}>
                  ● {preview.status} (Score: {preview.score} pts)
                </div>
              </div>
            </div>

            {/* Target & Actual Inputs */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Target Value ({targetKPI.unit}) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  disabled={!isManagerOrAdmin}
                  className="form-control"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Formatted: {formatKPIValue(targetValue, targetKPI.unit, targetKPI.kpi_type)}
                </span>
              </div>

              <div className="form-group">
                <label>Actual Achieved Value ({targetKPI.unit}) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="form-control"
                  value={actualValue}
                  onChange={(e) => setActualValue(parseFloat(e.target.value) || 0)}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Formatted: {formatKPIValue(actualValue, targetKPI.unit, targetKPI.kpi_type)}
                </span>
              </div>
            </div>

            {/* Status Override */}
            <div className="form-group">
              <label>Appraisal Status Evaluation</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="Exceeded">Exceeded (Outstanding Performance &gt;=95%)</option>
                <option value="On Track">On Track (Meets Expected Target 75%-94%)</option>
                <option value="Needs Improvement">Needs Improvement (Below Target 50%-74%)</option>
                <option value="At Risk">At Risk (Severe Underperformance &lt;50%)</option>
              </select>
            </div>

            {/* Manager Feedback Comment */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} style={{ color: '#0284c7' }} />
                <span>Manager Reviewer Comments</span>
              </label>
              <textarea
                rows={3}
                className="form-control"
                disabled={!isManagerOrAdmin}
                placeholder={
                  isManagerOrAdmin
                    ? 'Enter manager appraisal observations, quarterly deliverables, and corrective recommendations...'
                    : 'Manager feedback is managed by reporting authority.'
                }
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
              />
            </div>

            {/* Employee Self-Appraisal Comment */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} style={{ color: '#16a34a' }} />
                <span>Employee Self-Appraisal Remarks</span>
              </label>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Share your personal contributions, external bottlenecks encountered, or process improvements..."
                value={employeeComment}
                onChange={(e) => setEmployeeComment(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={15} />
              <span>{loading ? 'Saving...' : 'Save & Calculate Score'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
