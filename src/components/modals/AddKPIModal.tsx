import React, { useState } from 'react';
import { X, Target, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { EmployeeKRA, EmployeeKPI, User } from '../../types/crm';
import { KPIType } from '../../utils/kpiCalculationEngine';
import { addEmployeeKPI } from '../../services/kraKpiService';

export const AddKPIModal: React.FC = () => {
  const { closeModal, activeModal, currentUser } = useCRM();
  const targetEmployee: User | undefined = activeModal.data?.employee;
  const targetKRA: EmployeeKRA | undefined = activeModal.data?.kra;
  const availableKRAs: EmployeeKRA[] = activeModal.data?.availableKRAs || (targetKRA ? [targetKRA] : []);
  const onCreated: ((kpi: EmployeeKPI) => void) | undefined = activeModal.data?.onCreated;

  const [selectedKraId, setSelectedKraId] = useState<string>(targetKRA?.id || (availableKRAs.length > 0 ? availableKRAs[0].id : ''));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kpiType, setKpiType] = useState<KPIType>('higher_is_better');
  const [unit, setUnit] = useState('%');
  const [targetValue, setTargetValue] = useState<number>(100);
  const [actualValue, setActualValue] = useState<number>(0);
  const [weightagePct, setWeightagePct] = useState<number>(15);
  const [managerComment, setManagerComment] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!targetEmployee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('KPI Name is required.');
      return;
    }
    if (!selectedKraId) {
      setErrorMessage('Please select a parent KRA for this KPI.');
      return;
    }

    setLoading(true);

    try {
      const res = await addEmployeeKPI(
        {
          employee_id: targetEmployee.id,
          employee_kra_id: selectedKraId,
          organization_id: targetEmployee.organization_id,
          name: name.trim(),
          description: description.trim() || undefined,
          kpi_type: kpiType,
          unit: unit.trim(),
          target_value: Number(targetValue),
          actual_value: Number(actualValue),
          weightage_pct: Number(weightagePct),
          manager_comment: managerComment.trim() || undefined,
        },
        currentUser
      );

      setLoading(false);

      if (res.success && res.newKPI) {
        setSuccessMessage('New KPI created and calculated successfully.');
        if (onCreated) {
          onCreated(res.newKPI);
        }
        setTimeout(() => {
          closeModal();
        }, 700);
      } else {
        setErrorMessage(res.error || 'Failed to add KPI.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Target size={18} style={{ color: '#0284c7' }} />
            <span>Add Key Performance Indicator (KPI)</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
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

            {/* Parent KRA Select */}
            <div className="form-group">
              <label>Parent Key Result Area (KRA) *</label>
              <select
                className="form-control"
                required
                value={selectedKraId}
                onChange={(e) => setSelectedKraId(e.target.value)}
              >
                {availableKRAs.map((kra) => (
                  <option key={kra.id} value={kra.id}>
                    {kra.name} ({kra.category}) — {kra.weightage_pct}% Weight
                  </option>
                ))}
              </select>
            </div>

            {/* KPI Title */}
            <div className="form-group">
              <label>KPI Metric Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. On-Time Shift Trip Arrival Rate"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* KPI Type & Unit */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Metric Behavior / Evaluation Type *</label>
                <select
                  className="form-control"
                  value={kpiType}
                  onChange={(e) => {
                    const newType = e.target.value as KPIType;
                    setKpiType(newType);
                    if (newType === 'percentage') setUnit('%');
                    else if (newType === 'currency') setUnit('INR');
                    else if (newType === 'boolean_completion') setUnit('Boolean');
                    else if (newType === 'lower_is_better') setUnit('Days');
                  }}
                >
                  <option value="higher_is_better">▲ Higher is Better (Standard Achievement)</option>
                  <option value="lower_is_better">▼ Lower is Better (Breakdowns, Turnaround, Delays)</option>
                  <option value="target_range">⇄ Target Range (Bounds Tolerance)</option>
                  <option value="percentage">% Percentage Rate (0 - 100%)</option>
                  <option value="currency">₹ Currency Amount (INR Revenue / Cost)</option>
                  <option value="numeric"># Continuous Numeric Ratio</option>
                  <option value="count">Count (Discrete Incidents / Milestones)</option>
                  <option value="boolean_completion">✓ Binary Milestone (100% or 0%)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Unit of Measurement *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. %, Days, Hours, INR, Count"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>

            {/* Target, Actual & Weightage */}
            <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label>Target Value *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="form-control"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Initial Actual Value</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={actualValue}
                  onChange={(e) => setActualValue(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Weightage %</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  className="form-control"
                  value={weightagePct}
                  onChange={(e) => setWeightagePct(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>KPI Definition &amp; Formula Description</label>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Explain the source data, calculation methodology, and operational trigger..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Manager Remarks */}
            <div className="form-group">
              <label>Manager Context &amp; Objective Guidance</label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional expectation notes for the employee..."
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Plus size={15} />
              <span>{loading ? 'Creating...' : 'Create KPI Metric'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
