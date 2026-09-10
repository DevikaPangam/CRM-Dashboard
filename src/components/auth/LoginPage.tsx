import React, { useState } from 'react';
import {
  Briefcase, Mail, Lock, LogIn, KeyRound, AlertTriangle,
  CheckCircle2, ShieldAlert, Sparkles, Building, ArrowRight, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const {
    signIn,
    resetPassword,
    authState,
    accessDeniedReason,
    isLoading,
    isCloudConnected,
    signOut,
    clearAccessDenied,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both work email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Authentication failed.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetting(true);
    setResetStatus(null);
    const result = await resetPassword(resetEmail);
    setIsResetting(false);

    if (result.success) {
      setResetStatus({ success: true, message: result.message });
    } else {
      setResetStatus({ success: false, message: result.error });
    }
  };

  // ─── Screen: Access Not Provisioned / Account Suspended Guard ───────────────
  if (authState === 'PROFILE_NOT_FOUND' || authState === 'ACCOUNT_SUSPENDED') {
    const isSuspended = authState === 'ACCOUNT_SUSPENDED';
    return (
      <div className="login-screen-wrapper">
        <div className="login-glass-card" style={{ maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: isSuspended ? '#fee2e2' : '#fef3c7',
                color: isSuspended ? '#dc2626' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              {isSuspended ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {isSuspended ? 'Account Access Suspended' : 'Access Not Provisioned'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              {accessDeniedReason || 'You do not have active CRM directory permissions.'}
            </p>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#475569',
            }}
          >
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>What should I do?</div>
            <div>
              Contact your <strong>Rajmudra Group System Administrator</strong> to assign your user role and organization workspace in the CRM directory.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={async () => {
                clearAccessDenied();
                await signOut();
              }}
            >
              Sign Out &amp; Return
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Standard Sign-In Screen ────────────────────────────────────────────────
  return (
    <div className="login-screen-wrapper">
      <div className="login-glass-card">
        {/* Header Branding */}
        <div className="login-header-brand">
          <div className="login-logo-circle">
            <Briefcase size={26} />
          </div>
          <h2>CorpBD CRM</h2>
          <div className="login-subtitle-badge">
            <Building size={12} />
            <span>Rajmudra Group Enterprise Suite</span>
          </div>
        </div>



        {/* Error Alert */}
        {errorMsg && (
          <div className="login-error-alert">
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLoginSubmit} className="login-form-body">
          <div className="login-field-group">
            <label>Work Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="email"
                placeholder="e.g. devika.p@rajmudragroup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {
                  setResetEmail(email);
                  setResetStatus(null);
                  setForgotModalOpen(true);
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                type="password"
                placeholder="Enter your corporate password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to CRM Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="login-footer-notes">
          <span>Protected by PostgreSQL Row-Level Security &amp; Supabase Auth</span>
        </div>
      </div>

      {/* ─── Forgot Password Modal ────────────────────────────────────────────── */}
      {forgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} style={{ color: '#0284c7' }} />
                <h3>Reset Corporate Password</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setForgotModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetSubmit} style={{ padding: '16px 20px 20px 20px' }}>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
                Enter your registered corporate email to receive a secure password recovery link.
              </p>

              {resetStatus && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: resetStatus.success ? '#ecfdf5' : '#fee2e2',
                    color: resetStatus.success ? '#059669' : '#dc2626',
                    border: `1px solid ${resetStatus.success ? '#a7f3d0' : '#fecaca'}`,
                  }}
                >
                  {resetStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{resetStatus.message}</span>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Work Email
                </label>
                <div className="login-input-wrapper">
                  <Mail size={15} className="login-input-icon" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@rajmudragroup.com"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isResetting}
                >
                  {isResetting ? 'Sending Link...' : 'Dispatch Reset Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
