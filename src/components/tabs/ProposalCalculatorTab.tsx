import React, { useState, useEffect } from 'react';
import {
  Calculator, ExternalLink, RotateCcw, Maximize2, Minimize2,
  Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';

export const ProposalCalculatorTab: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Streamlit Cloud requires ?embed=true to properly render inside an iframe
  const PROPOSAL_CALCULATOR_URL = 'https://proposal-formula-rispl.streamlit.app/?embed=true';
  const DIRECT_URL = 'https://proposal-formula-rispl.streamlit.app/';

  // Auto-dismiss loading overlay after 1.5 seconds so it never traps the UI
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [iframeKey]);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleOpenExternal = () => {
    window.open(DIRECT_URL, '_blank', 'noopener,noreferrer');
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
        {/* Non-blocking Subtle Loading Indicator */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.9)',
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
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Calibrating Proposal Formula Engine...
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              https://proposal-formula-rispl.streamlit.app/?embed=true
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
          allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        />
      </div>
    </section>
  );
};
