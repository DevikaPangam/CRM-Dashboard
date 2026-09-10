import React, { useState } from 'react';
import { X, Target, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { EmployeeKRA, User } from '../../types/crm';
import { addEmployeeKRA } from '../../services/kraKpiService';

export const AddKRAModal: React.FC = () => {
  const { closeModal, activeModal, currentUser } = useCRM();
  const targetEmployee: User | undefined = activeModal.data?.employee;
  const onCreated: ((kra: EmployeeKRA) => void) | undefined = activeModal.data?.onCreated;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Operational Excellence');
  const [description, setDescription] = useState('');
  const [weightagePct, setWeightagePct] = useState<number>(25);
  const [financialYear, setFinancialYear] = useState('FY2026-27');
  const [reviewPeriod, setReviewPeriod] = useState('Annual FY26-27');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!targetEmployee) return null;

  const department = targetEmployee.department || 'Business Development';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('KRA Name is required.');
      return;
    }

    setLoading(true);

    try {
      const res = await addEmployeeKRA(
        {
          employee_id: targetEmployee.id,
          organization_id: targetEmployee.organization_id,
          department,
          name: name.trim(),
          category: category.trim(),
          description: description.trim() || undefined,
          weightage_pct: Number(weightagePct),
          financial_year: financialYear,
          review_period: reviewPeriod,
        },
        currentUser
      );

      setLoading(false);

      if (res.success && res.newKRA) {
        setSuccessMessage('New KRA added successfully.');
        if (onCreated) {
          onCreated(res.newKRA);
        }
        setTimeout(() => {
          closeModal();
        }, 700);
      } else {
        setErrorMessage(res.error || 'Failed to add KRA.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Target size={18} style={{ color: '#0284c7' }} />
            <span>Add Key Result Area (KRA)</span>
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

            {/* Employee Banner */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{targetEmployee.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {targetEmployee.designation || targetEmployee.role} • {department}
                </div>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {department}
              </span>
            </div>

            <div className="form-group">
              <label>KRA Title / Objective *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Fuel Consumption & Running Cost Efficiency"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Category / Strategic Pillar *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Operational Cost Control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Weightage (% of Total Scorecard) *</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={100}
                  className="form-control"
                  value={weightagePct}
                  onChange={(e) => setWeightagePct(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Financial Year</label>
                <select className="form-control" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                  <option value="FY2026-27">FY 2026-27</option>
                  <option value="FY2025-26">FY 2025-26</option>
                </select>
              </div>

              <div className="form-group">
                <label>Review Period</label>
                <select className="form-control" value={reviewPeriod} onChange={(e) => setReviewPeriod(e.target.value)}>
                  <option value="Annual FY26-27">Annual Appraisal</option>
                  <option value="Q1">Q1 (Apr - Jun)</option>
                  <option value="Q2">Q2 (Jul - Sep)</option>
                  <option value="Q3">Q3 (Oct - Dec)</option>
                  <option value="Q4">Q4 (Jan - Mar)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>KRA Scope &amp; Deliverables Description</label>
              <textarea
                rows={3}
                className="form-control"
                placeholder="Explain the operational boundaries, measurement criteria, and expected standard of performance..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Plus size={15} />
              <span>{loading ? 'Creating...' : 'Create KRA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
