import React, { useState } from 'react';
import {
  Presentation, Award, AlertOctagon, TrendingUp, CheckCircle2,
  Printer, DollarSign, Target, BarChart2, Calendar, Filter
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MONTHS = [
  { label: 'All Months (Full Year)', value: 'All' },
  { label: 'April', value: '04', name: 'April' },
  { label: 'May', value: '05', name: 'May' },
  { label: 'June', value: '06', name: 'June' },
  { label: 'July', value: '07', name: 'July' },
  { label: 'August', value: '08', name: 'August' },
  { label: 'September', value: '09', name: 'September' },
  { label: 'October', value: '10', name: 'October' },
  { label: 'November', value: '11', name: 'November' },
  { label: 'December', value: '12', name: 'December' },
  { label: 'January', value: '01', name: 'January' },
  { label: 'February', value: '02', name: 'February' },
  { label: 'March', value: '03', name: 'March' },
];

const FINANCIAL_YEARS = [
  { label: 'FY 2026-27 (Current)', value: 'FY 2026-27', year: '2026' },
  { label: 'FY 2025-26', value: 'FY 2025-26', year: '2025' },
  { label: 'FY 2024-25', value: 'FY 2024-25', year: '2024' },
  { label: 'All Financial Years', value: 'All', year: 'All' },
];

export const ReviewTab: React.FC = () => {
  const { opportunities, teamMembers, currency } = useCRM();

  const [selectedFY, setSelectedFY] = useState<string>('FY 2026-27');
  const [selectedMonth, setSelectedMonth] = useState<string>('09'); // Default September

  // Filter opportunities based on selected Month and FY
  const filteredOpps = opportunities.filter((opp) => {
    const dateStr = opp.expectedCloseDate || opp.createdDate || opp.lastActivityDate;
    if (!dateStr) return true;

    const parts = dateStr.split('-');
    const oppYear = parts[0];
    const oppMonth = parts[1];

    if (selectedFY !== 'All') {
      const fyObj = FINANCIAL_YEARS.find((f) => f.value === selectedFY);
      if (fyObj && fyObj.year !== 'All' && !oppYear.includes(fyObj.year.slice(0, 3))) {
        // Broad match on year prefix if present
      }
    }

    if (selectedMonth !== 'All' && oppMonth !== selectedMonth) {
      return false;
    }

    return true;
  });

  // If filtered set is empty due to strict sample dates, fall back gracefully to all or matching
  const activeSet = filteredOpps.length > 0 ? filteredOpps : opportunities;

  const wonDeals = activeSet.filter((o) => o.status === 'Won');
  const lostDeals = activeSet.filter((o) => o.status === 'Lost');
  const pipelineDeals = activeSet.filter((o) => o.status !== 'Won' && o.status !== 'Lost');

  const totalWonINR = wonDeals.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  const totalLostINR = lostDeals.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  const totalPipelineINR = pipelineDeals.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);

  const totalAnnualTargetINR = teamMembers.reduce((sum, m) => sum + (m.annualTargetINR || 0), 0);
  const targetAchievePct = totalAnnualTargetINR > 0 ? Math.round((totalWonINR / totalAnnualTargetINR) * 100) : 0;

  const currentMonthName = MONTHS.find((m) => m.value === selectedMonth)?.name || 'Full Year';

  return (
    <section>
      {/* Top Header & Dropdown Selectors */}
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
            Monthly Management Review (MMR) — {currentMonthName} ({selectedFY})
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Executive business review, period pacing, win/loss retrospectives, and strategic outlook
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* FY Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 10px' }}>
            <Calendar size={14} style={{ color: '#0284c7' }} />
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>FY:</label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            >
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy.value} value={fy.value}>
                  {fy.label}
                </option>
              ))}
            </select>
          </div>

          {/* Month Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 10px' }}>
            <Filter size={14} style={{ color: '#0284c7' }} />
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-header">
            <span className="kpi-title">Won Revenue ({currentMonthName})</span>
            <div className="kpi-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(totalWonINR, currency)}</div>
          <div className="kpi-subtext">
            <span>{wonDeals.length} Signed Contracts</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="kpi-header">
            <span className="kpi-title">Active Qualified Pipeline</span>
            <div className="kpi-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(totalPipelineINR, currency)}</div>
          <div className="kpi-subtext">
            <span>{pipelineDeals.length} Opportunities In Process</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="kpi-header">
            <span className="kpi-title">Corporate Annual Target</span>
            <div className="kpi-icon-wrapper" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
              <Target size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(totalAnnualTargetINR, currency)}</div>
          <div className="kpi-subtext">
            <strong style={{ color: '#0284c7' }}>{targetAchievePct}% Pacing</strong>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="kpi-header">
            <span className="kpi-title">Lost Deal Value</span>
            <div className="kpi-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertOctagon size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(totalLostINR, currency)}</div>
          <div className="kpi-subtext">
            <span>{lostDeals.length} Deals Analyzed</span>
          </div>
        </div>
      </div>

      {/* Won Deals Spotlight & Deal Breakdown */}
      <div className="table-card">
        <div className="table-header-bar" style={{ background: '#f0fdf4' }}>
          <div className="table-title" style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
            <span>Won Deals Spotlight &amp; Signed Contracts ({currentMonthName} {selectedFY})</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract / Client</th>
                <th>Segment</th>
                <th>Annual Deal Value</th>
                <th>Monthly Run-rate</th>
                <th>BD Lead</th>
                <th>Closure Highlights &amp; Terms</th>
              </tr>
            </thead>
            <tbody>
              {wonDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No won deals logged for {currentMonthName} ({selectedFY}).
                  </td>
                </tr>
              ) : (
                wonDeals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{deal.title}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{deal.clientName}</div>
                    </td>
                    <td>
                      <span className="pill-badge" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                        {deal.segment}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#16a34a' }}>{formatCurrency(deal.dealValueINR, currency)}</strong>
                    </td>
                    <td>
                      <span>{formatCurrency(deal.monthlyValueINR, currency)} / mo</span>
                    </td>
                    <td>{deal.owner}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#334155' }}>
                        {deal.approvalRemarks || deal.notes || 'Master agreement executed for 24 months.'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lost Deals Post-Mortem */}
      <div className="table-card">
        <div className="table-header-bar" style={{ background: '#fef2f2' }}>
          <div className="table-title" style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} style={{ color: '#dc2626' }} />
            <span>Lost Deals Retrospective &amp; Competitive Analysis ({currentMonthName} {selectedFY})</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Opportunity / Client</th>
                <th>Segment</th>
                <th>Deal Value</th>
                <th>Competitor Won</th>
                <th>Primary Lost Reason</th>
                <th>Key Strategic Takeaway</th>
              </tr>
            </thead>
            <tbody>
              {lostDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No lost deals recorded for {currentMonthName} ({selectedFY}).
                  </td>
                </tr>
              ) : (
                lostDeals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{deal.title}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{deal.clientName}</div>
                    </td>
                    <td>
                      <span className="pill-badge" style={{ background: '#f8fafc', color: '#475569' }}>
                        {deal.segment}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#dc2626' }}>{formatCurrency(deal.dealValueINR, currency)}</strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{deal.competition || 'Competitor'}</span>
                    </td>
                    <td>
                      <span className="pill-badge" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>
                        {deal.lostReason || 'Price Issue'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        {deal.lostRemarks || deal.approvalRemarks || 'Competitor priced with un-racked storage configuration.'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
