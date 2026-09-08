import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Award,
  Clock,
  Target,
  Plus,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate, getStageBadgeClass } from '../../utils/formatters';
import { FunnelChart } from '../charts/FunnelChart';
import { MonthlyTrendChart } from '../charts/MonthlyTrendChart';
import { StageBarChart } from '../charts/StageBarChart';
import { SegmentPieChart } from '../charts/SegmentPieChart';

export const DashboardTab: React.FC = () => {
  const {
    currentUser,
    opportunities,
    activities,
    followups,
    currency,
    filters,
    setFilters,
    openModal,
    exportOpportunities,
    setCurrentTab,
    teamMembers,
    segments,
  } = useCRM();

  // Filter opportunities based on active dashboard filters
  const filteredOpps = opportunities.filter((opp) => {
    if (filters.bdOwner !== 'All' && opp.owner !== filters.bdOwner) return false;
    if (filters.segment !== 'All' && opp.segment !== filters.segment) return false;
    return true;
  });

  const totalPipelineINR = filteredOpps
    .filter((o) => o.status !== 'Won' && o.status !== 'Lost')
    .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);

  const weightedRevenueINR = filteredOpps
    .filter((o) => o.status !== 'Won' && o.status !== 'Lost')
    .reduce((sum, o) => sum + ((o.dealValueINR || 0) * (o.probability || 0)) / 100, 0);

  const wonOpps = filteredOpps.filter((o) => o.status === 'Won');
  const wonRevenueINR = wonOpps.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);

  const closedCount = filteredOpps.filter((o) => o.status === 'Won' || o.status === 'Lost').length;
  const winRatePct = closedCount > 0 ? Math.round((wonOpps.length / closedCount) * 100) : 67;

  const activeDealsCount = filteredOpps.filter((o) => o.status !== 'Won' && o.status !== 'Lost').length;
  const avgDealSizeINR = activeDealsCount > 0 ? totalPipelineINR / activeDealsCount : 0;

  const overdueFollowups = followups.filter((f) => {
    if (f.status === 'Completed') return false;
    const due = new Date(f.dueDate).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    return due < today;
  });

  return (
    <section>
      {/* Top Banner & Quick Controls */}
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
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Welcome back, {currentUser.name}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Corporate Business Development Pipeline &amp; Monthly Review Dashboard • {filters.financialYear}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => openModal('addOpportunity')}>
            <Plus size={15} />
            <span>+ New Opportunity</span>
          </button>
          <button className="btn btn-secondary" onClick={exportOpportunities}>
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Dashboard Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={14} style={{ color: '#0284c7' }} />
            <label>Financial Year:</label>
            <select
              value={filters.financialYear}
              onChange={(e) => setFilters({ ...filters, financialYear: e.target.value })}
            >
              <option value="FY2026-27">FY 2026-27</option>
              <option value="FY2025-26">FY 2025-26</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Period:</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            >
              <option value="All">All Months (YTD)</option>
              <option value="Q1">Q1 (Apr - Jun)</option>
              <option value="Q2">Q2 (Jul - Sep)</option>
              <option value="Sep">September 2026</option>
              <option value="Aug">August 2026</option>
            </select>
          </div>

          <div className="filter-item">
            <label>BD Owner:</label>
            <select
              value={filters.bdOwner}
              onChange={(e) => setFilters({ ...filters, bdOwner: e.target.value })}
            >
              <option value="All">All BD Managers</option>
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.name}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Segment:</label>
            <select
              value={filters.segment}
              onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
            >
              <option value="All">All Business Segments</option>
              {segments.map((seg) => (
                <option key={seg.id} value={seg.name}>
                  {seg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(filters.bdOwner !== 'All' || filters.segment !== 'All') && (
          <button
            className="btn btn-secondary btn-xs"
            onClick={() => setFilters({ ...filters, bdOwner: 'All', segment: 'All' })}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* KPI Stats Grid with Horizontal Scroll Protection */}
      <div className="dashboard-scroll-section">
        <div className="kpi-grid" style={{ minWidth: '850px' }}>
          <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="kpi-header">
              <span className="kpi-title">Active Pipeline Value</span>
              <div className="kpi-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(totalPipelineINR, currency)}</div>
            <div className="kpi-subtext">
              <span>{activeDealsCount} qualified opportunities</span>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="kpi-header">
              <span className="kpi-title">Weighted Expected Value</span>
              <div className="kpi-icon-wrapper" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                <Target size={18} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(weightedRevenueINR, currency)}</div>
            <div className="kpi-subtext">
              <span>Probability-weighted revenue</span>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="kpi-header">
              <span className="kpi-title">Won Contracts (YTD)</span>
              <div className="kpi-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <Award size={18} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(wonRevenueINR, currency)}</div>
            <div className="kpi-subtext">
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{winRatePct}% Win Rate</span>
              <span>• {wonOpps.length} deals closed</span>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="kpi-header">
              <span className="kpi-title">Average Deal Size</span>
              <div className="kpi-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(avgDealSizeINR, currency)}</div>
            <div className="kpi-subtext">
              <span>Per annual corporate contract</span>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="kpi-header">
              <span className="kpi-title">Overdue Follow-ups</span>
              <div className="kpi-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-value" style={{ color: overdueFollowups.length > 0 ? '#dc2626' : '#16a34a' }}>
              {overdueFollowups.length}
            </div>
            <div className="kpi-subtext">
              <span>{overdueFollowups.length > 0 ? 'Requires immediate action' : 'All clear & updated'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Charts Grid with Scroll Protection */}
      <div className="dashboard-scroll-section">
        <div className="charts-grid" style={{ minWidth: '920px' }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">
                <TrendingUp size={16} style={{ color: '#0284c7' }} />
                <span>Deal Conversion Funnel</span>
              </div>
            </div>
            <div className="chart-container-box">
              <FunnelChart />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">
                <Calendar size={16} style={{ color: '#10b981' }} />
                <span>Monthly Pipeline &amp; Won Revenue Trend</span>
              </div>
            </div>
            <div className="chart-container-box">
              <MonthlyTrendChart />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">
                <Target size={16} style={{ color: '#8b5cf6' }} />
                <span>Stage-Wise Value Distribution</span>
              </div>
            </div>
            <div className="chart-container-box">
              <StageBarChart />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">
                <DollarSign size={16} style={{ color: '#f59e0b' }} />
                <span>Segment Revenue Mix</span>
              </div>
            </div>
            <div className="chart-container-box">
              <SegmentPieChart />
            </div>
          </div>
        </div>
      </div>

      {/* High Priority Pipeline Opportunities Table with Scroll Protection */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">Priority Pipeline Deals &amp; Next Action Items</div>
          <button className="btn btn-secondary btn-xs" onClick={() => setCurrentTab('tab-opportunities')}>
            <span>View All Opportunities</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Opportunity / Client</th>
                <th>Segment</th>
                <th>Deal Value</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>BD Owner</th>
                <th>Target Close</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpps.slice(0, 8).map((opp) => {
                const badge = getStageBadgeClass(opp.stage);
                return (
                  <tr key={opp.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{opp.title}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {opp.clientName} • <span style={{ fontFamily: 'var(--font-mono)' }}>{opp.code}</span>
                      </div>
                    </td>
                    <td>
                      <span className="pill-badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                        {opp.segment}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(opp.dealValueINR, currency)}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatCurrency(opp.monthlyValueINR, currency)} / mo
                      </div>
                    </td>
                    <td>
                      <span
                        className="pill-badge"
                        style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                      >
                        {opp.stage}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            width: '45px',
                          }}
                        >
                          <div
                            style={{
                              width: `${opp.probability}%`,
                              height: '100%',
                              background: opp.probability > 70 ? '#10b981' : opp.probability > 40 ? '#3b82f6' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '11.5px' }}>{opp.probability}%</span>
                      </div>
                    </td>
                    <td>{opp.owner}</td>
                    <td>{formatDate(opp.expectedCloseDate)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => openModal('addActivity', { clientId: opp.clientId, opportunityId: opp.id })}
                        title="Log Meeting / Call"
                      >
                        + Log Action
                      </button>
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
