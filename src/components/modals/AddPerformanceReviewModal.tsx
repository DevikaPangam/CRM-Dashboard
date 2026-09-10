import React, { useState } from 'react';
import { X, Award, Star, CheckCircle2, User, Building2, Calendar, Target, TrendingUp } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { User as CRMUser, EmployeePerformanceReview } from '../../types/crm';
import { createPerformanceReview } from '../../services/performanceReviewService';

export const AddPerformanceReviewModal: React.FC = () => {
  const { closeModal, activeModal } = useCRM();
  const { profile, authUser } = useAuth();
  const targetEmployee: CRMUser | undefined = activeModal.data?.employee;
  const onSaved: ((review: EmployeePerformanceReview) => void) | undefined = activeModal.data?.onSaved;

  const defaultFY = activeModal.data?.defaultFY || 'FY2026-27';
  const defaultReviewPeriod = activeModal.data?.defaultReviewPeriod || 'Q1 (Apr - Jun)';
  const defaultKraPct = activeModal.data?.kraScore || 90;
  const defaultKpiPct = activeModal.data?.kpiScore || 88;

  const [financialYear, setFinancialYear] = useState<string>(defaultFY);
  const [reviewPeriod, setReviewPeriod] = useState<string>(defaultReviewPeriod);
  const [kraAchievementPct, setKraAchievementPct] = useState<number>(defaultKraPct);
  const [kpiAchievementPct, setKpiAchievementPct] = useState<number>(defaultKpiPct);
  const [overallScore, setOverallScore] = useState<number>(Math.round((defaultKraPct + defaultKpiPct) / 2));
  const [managerRating, setManagerRating] = useState<number>(4.5);
  const [performanceStatus, setPerformanceStatus] = useState<'Exceeding Targets' | 'On Track' | 'Needs Improvement' | 'At Risk'>('On Track');
  const [keyStrengths, setKeyStrengths] = useState<string>('');
  const [areasOfImprovement, setAreasOfImprovement] = useState<string>('');
  const [goalsForNextPeriod, setGoalsForNextPeriod] = useState<string>('');
  const [managerRemarks, setManagerRemarks] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  if (!targetEmployee) return null;

  const handleScoreRecalc = (kra: number, kpi: number) => {
    const computed = Math.round(kra * 0.6 + kpi * 0.4);
    setOverallScore(computed);
    if (computed >= 95) {
      setPerformanceStatus('Exceeding Targets');
      setManagerRating(4.9);
    } else if (computed >= 75) {
      setPerformanceStatus('On Track');
      setManagerRating(4.5);
    } else if (computed >= 60) {
      setPerformanceStatus('Needs Improvement');
      setManagerRating(3.5);
    } else {
      setPerformanceStatus('At Risk');
      setManagerRating(2.5);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const reviewerName = profile?.full_name || authUser?.email || 'Devika Pangam';
      const reviewerRole = profile?.role === 'super_admin' ? 'System Administrator' : 'Head of Business Development';

      const saved = await createPerformanceReview({
        employee_id: targetEmployee.id,
        organization_id: targetEmployee.organization_id || '00000000-0000-0000-0000-000000000001',
        financial_year: financialYear,
        review_period: reviewPeriod,
        department: targetEmployee.department || 'Business Development',
        designation: targetEmployee.designation || 'Executive',
        overall_score: overallScore,
        kra_achievement_pct: kraAchievementPct,
        kpi_achievement_pct: kpiAchievementPct,
        manager_rating: managerRating,
        performance_status: performanceStatus,
        reviewer_name: reviewerName,
        reviewer_role: reviewerRole,
        key_strengths: keyStrengths || 'High dedication, client relationship management, reliable task execution.',
        areas_of_improvement: areasOfImprovement || 'Continue developing cross-functional communication and proactive SLA updates.',
        goals_for_next_period: goalsForNextPeriod || 'Meet or exceed assigned operational milestones for next quarter.',
        manager_remarks: managerRemarks || 'Appraisal evaluation conducted in accordance with department KPI framework.',
        status: 'Finalized',
        review_date: new Date().toISOString().split('T')[0]
      });

      if (onSaved) onSaved(saved);
      closeModal();
    } catch (err) {
      console.error('Error creating appraisal review:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Award size={18} style={{ color: '#0284c7' }} />
            <span>Conduct Performance Appraisal ({targetEmployee.name})</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-section" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Employee Banner */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{targetEmployee.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {targetEmployee.designation || 'Specialist'} • <strong>{targetEmployee.department || 'Business Development'}</strong>
                </div>
              </div>
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}
              >
                {targetEmployee.team_name || 'Enterprise Squad'}
              </span>
            </div>

            {/* Appraisal Cycle Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Financial Year <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  required
                >
                  <option value="FY2026-27">FY 2026-27 (Current)</option>
                  <option value="FY2025-26">FY 2025-26 (Past Year)</option>
                  <option value="FY2024-25">FY 2024-25</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Review Period <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={reviewPeriod}
                  onChange={(e) => setReviewPeriod(e.target.value)}
                  required
                >
                  <option value="Annual Appraisal">Annual Appraisal</option>
                  <option value="Q1 (Apr - Jun)">Q1 (Apr - Jun)</option>
                  <option value="Q2 (Jul - Sep)">Q2 (Jul - Sep)</option>
                  <option value="Q3 (Oct - Dec)">Q3 (Oct - Dec)</option>
                  <option value="Q4 (Jan - Mar)">Q4 (Jan - Mar)</option>
                  <option value="H1 (First Half)">H1 (First Half)</option>
                  <option value="H2 (Second Half)">H2 (Second Half)</option>
                </select>
              </div>
            </div>

            {/* KRA, KPI & Overall Score Integrator */}
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '10px' }}>
                KRA &amp; KPI Mathematical Score Integration
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, color: '#0369a1' }}>
                    KRA Score %
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={kraAchievementPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setKraAchievementPct(val);
                      handleScoreRecalc(val, kpiAchievementPct);
                    }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, color: '#0369a1' }}>
                    KPI Score %
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={kpiAchievementPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setKpiAchievementPct(val);
                      handleScoreRecalc(kraAchievementPct, val);
                    }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                    Overall Score (/100)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={overallScore}
                    onChange={(e) => setOverallScore(Number(e.target.value))}
                    style={{ fontWeight: 800, color: '#0284c7' }}
                  />
                </div>
              </div>
            </div>

            {/* Manager Rating & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Manager Rating (1.0 to 5.0 ⭐)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={managerRating}
                    onChange={(e) => setManagerRating(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', minWidth: '45px' }}>
                    ⭐ {managerRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Performance Status <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={performanceStatus}
                  onChange={(e) => setPerformanceStatus(e.target.value as any)}
                >
                  <option value="Exceeding Targets">Exceeding Targets (Outstanding)</option>
                  <option value="On Track">On Track (Target Met)</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="At Risk">At Risk (Critical Underperformance)</option>
                </select>
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                Key Strengths &amp; Achievements
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Highlight specific milestone successes, SLA compliance, or commercial leadership..."
                value={keyStrengths}
                onChange={(e) => setKeyStrengths(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                Areas of Improvement
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Detail tactical skills, documentation discipline, or operational speed to enhance..."
                value={areasOfImprovement}
                onChange={(e) => setAreasOfImprovement(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                Goals for Next Review Period
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Target metrics, major contracts, certifications, or fleet KPIs for the upcoming cycle..."
                value={goalsForNextPeriod}
                onChange={(e) => setGoalsForNextPeriod(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                Executive / Reviewer Concluding Remarks
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Final summary notes from review committee..."
                value={managerRemarks}
                onChange={(e) => setManagerRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Finalizing Appraisal...' : 'Finalize & Record Appraisal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
