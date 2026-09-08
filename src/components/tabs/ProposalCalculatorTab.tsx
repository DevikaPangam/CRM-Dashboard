import React, { useState, useEffect } from 'react';
import {
  Calculator, ExternalLink, RotateCcw, Maximize2, Minimize2,
  Moon, Sun, Compass, Sparkles, CheckCircle2, Eye
} from 'lucide-react';

type EmbedTheme = 'light' | 'dark' | 'native' | 'standard';

export const ProposalCalculatorTab: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<EmbedTheme>('light'); // 'light' forces solid black font colors on buttons and inputs

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

  // Auto-dismiss loading overlay after 1.5 seconds so it never traps the UI
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
          {/* Font & Contrast Mode Toggle */}
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
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              title="Light Theme - Solid Black Font Color on Buttons & Options"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: themeMode === 'light' ? '#ffffff' : 'transparent',
                color: themeMode === 'light' ? '#0f172a' : '#475569',
                boxShadow: themeMode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Sun size={12} style={{ color: themeMode === 'light' ? '#f59e0b' : '#64748b' }} />
              <span>☀️ Light (Black Fonts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              title="Dark Theme - White Font Color"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: themeMode === 'dark' ? '#0f172a' : 'transparent',
                color: themeMode === 'dark' ? '#ffffff' : '#475569',
                boxShadow: themeMode === 'dark' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Moon size={12} style={{ color: themeMode === 'dark' ? '#38bdf8' : '#64748b' }} />
              <span>🌙 Dark (White Fonts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('native')}
              title="Native Streamlit View with controls"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: themeMode === 'native' ? '#ffffff' : 'transparent',
                color: themeMode === 'native' ? '#0f172a' : '#475569',
                boxShadow: themeMode === 'native' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Compass size={12} style={{ color: themeMode === 'native' ? '#0284c7' : '#64748b' }} />
              <span>Native App</span>
            </button>
          </div>

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
          background: themeMode === 'dark' ? '#0e1726' : '#ffffff',
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
