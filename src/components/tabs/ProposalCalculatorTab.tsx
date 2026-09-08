import React, { useState } from 'react';
import {
  Calculator, ExternalLink, RotateCcw, Maximize2, Minimize2,
  Sparkles, ShieldCheck, CheckCircle2, FileSpreadsheet
} from 'lucide-react';

export const ProposalCalculatorTab: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const PROPOSAL_CALCULATOR_URL = 'https://proposal-formula-rispl.streamlit.app/';

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleOpenExternal = () => {
    window.open(PROPOSAL_CALCULATOR_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: isFullscreen ? 'calc(100vh - 120px)' : 'calc(100vh - 160px)' }}>
      {/* Top Header & Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '14px',
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
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
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
              Enterprise proposal formulas, route costing, fleet margin calculation &amp; commercial quote generation
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleReload}
            title="Reload calculation engine"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
          >
            <RotateCcw size={12} />
            <span>Reload Formula</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? 'Normal View' : 'Full Screen'}</span>
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

      {/* Embedded Iframe Container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          minHeight: '650px',
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
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #f59e0b',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '12px',
              }}
            />
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Connecting to Proposal Formula Engine...
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
              Loading https://proposal-formula-rispl.streamlit.app/
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={PROPOSAL_CALCULATOR_URL}
          title="Proposal Calculation Formula App"
          onLoad={() => setIsLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          allow="clipboard-write; clipboard-read"
        />
      </div>
    </section>
  );
};
