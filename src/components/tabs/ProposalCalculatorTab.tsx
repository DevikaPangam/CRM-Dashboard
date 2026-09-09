import React, { useState, useEffect } from 'react';
import {
  Calculator, ExternalLink, RotateCcw, Maximize2, Minimize2,
  FileCheck2, Plus, Clock, ShieldCheck, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { proposalService, ProposalRecord, INITIAL_PROPOSALS } from '../../services/proposalService';

type EmbedTheme = 'light' | 'dark' | 'native' | 'standard';

export const ProposalCalculatorTab: React.FC = () => {
  const { openModal } = useCRM();
  const { profile } = useAuth();

  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<EmbedTheme>('light');
  const [proposals, setProposals] = useState<ProposalRecord[]>(INITIAL_PROPOSALS);
  const [showVersions, setShowVersions] = useState<boolean>(false);

  const orgId = profile?.organization_id || '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    proposalService.fetchProposals(orgId).then((data) => {
      if (data && data.length > 0) setProposals(data);
    });
  }, [orgId]);

  const getEmbedUrl = (mode: EmbedTheme) => {
    switch (mode) {
      case 'light':
        return 'https://proposal-formula-rispl.streamlit.app/?embed=true&embed_options=light_theme';
      case 'dark':
        return 'https://proposal-formula-rispl.streamlit.app/?embed=true&embed_options=dark_theme';
      case 'native':
        return 'https://proposal-formula-rispl.streamlit.app/?embedded=true';
      case 'standard':
      default:
        return 'https://proposal-formula-rispl.streamlit.app/?embed=true';
    }
  };

  const currentUrl = getEmbedUrl(themeMode);
  const directUrl = 'https://proposal-formula-rispl.streamlit.app/';

  // Auto-dismiss loading overlay after 1.5s
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [iframeKey, themeMode]);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleThemeChange = (newTheme: EmbedTheme) => {
    setThemeMode(newTheme);
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleOpenExternal = () => {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0', label: 'Approved' };
      case 'under_review':
      case 'submitted':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Under Review' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca', label: 'Rejected' };
      case 'superseded':
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', label: 'Superseded' };
      default:
        return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd', label: 'Draft' };
    }
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: isFullscreen ? 'calc(100vh - 110px)' : 'calc(100vh - 165px)' }}>
      {/* Top Header & Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '12px',
          background: '#ffffff',
          padding: '12px 18px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Calculator size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Proposal Calculation &amp; Pricing Engine
              </h2>
              <span
                className="pill-badge"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700, fontSize: '11px' }}
              >
                ⚡ Live Streamlit App
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Enterprise proposal formulas, rate cards, route costing &amp; commercial quotation calculator
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setShowVersions(!showVersions)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              background: showVersions ? '#eff6ff' : '#ffffff',
              borderColor: showVersions ? '#3b82f6' : '#e2e8f0',
              color: showVersions ? '#1d4ed8' : '#334155',
            }}
          >
            <FileCheck2 size={13} />
            <span>Governance Versions ({proposals.length})</span>
          </button>

          {/* Theme Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              gap: '2px',
            }}
          >
            {(['light', 'dark'] as EmbedTheme[]).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => handleThemeChange(theme)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: themeMode === theme ? '#ffffff' : 'transparent',
                  color: themeMode === theme ? '#0f172a' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: themeMode === theme ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleReload}
            title="Reload calculation engine"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
          >
            <RotateCcw size={12} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? 'Normal' : 'Full Screen'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={handleOpenExternal}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
            }}
          >
            <ExternalLink size={12} />
            <span>Open in New Tab</span>
          </button>
        </div>
      </div>

      {/* Version Governance Drawer */}
      {showVersions && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '12px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
              Commercial Proposal Versions &amp; Governance Status (Separation of Duties Enforced)
            </strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Proposals are versioned in PostgreSQL • Authors cannot self-approve
            </span>
          </div>

          <div className="table-responsive" style={{ maxHeight: '180px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Proposal Code &amp; Version</th>
                  <th>Client &amp; Opportunity</th>
                  <th>Fleet Size &amp; Vehicle</th>
                  <th>Commercial Value (INR)</th>
                  <th>Governance Status</th>
                  <th>Submitted / Approved By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const badge = getStatusBadge(p.status);
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.proposalCode}</strong>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{p.versionLabel}</div>
                      </td>
                      <td>
                        <div>{p.clientName || 'General Proposal'}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{p.opportunityTitle}</div>
                      </td>
                      <td>
                        {p.fleetSize} Buses • {p.vehicleType}
                      </td>
                      <td>
                        <strong>₹{(p.totalCommercialValueINR / 10000000).toFixed(2)} Cr</strong>
                        <div style={{ fontSize: '10.5px', color: '#16a34a' }}>{p.marginPct}% Margin</div>
                      </td>
                      <td>
                        <span
                          className="pill-badge"
                          style={{ background: badge.bg, color: badge.text, borderColor: badge.border, fontWeight: 700 }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <div>By: {p.submittedByName || 'Author'}</div>
                        {p.approvedByName && (
                          <div style={{ fontSize: '10.5px', color: '#16a34a' }}>
                            Approved by: {p.approvedByName} ({p.approvedDate})
                          </div>
                        )}
                      </td>
                      <td>
                        {p.status === 'under_review' || p.status === 'draft' ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => openModal('approval', { type: 'proposal', item: p })}
                            style={{ color: '#0284c7' }}
                          >
                            <span>Sign-off / Review</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Embedded Iframe Container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: themeMode === 'dark' ? '#0e1726' : '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          minHeight: '600px',
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #f59e0b',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '10px',
              }}
            />
            <div style={{ fontSize: '13px', fontWeight: 700, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>
              Calibrating High-Contrast Theme &amp; Formula Engine...
            </div>
            <div style={{ fontSize: '11.5px', color: themeMode === 'dark' ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
              {currentUrl}
            </div>
          </div>
        )}

        <iframe
          key={`${iframeKey}-${themeMode}`}
          src={currentUrl}
          title="Proposal Calculation Formula App"
          onLoad={() => setIsLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        />
      </div>
    </section>
  );
};
