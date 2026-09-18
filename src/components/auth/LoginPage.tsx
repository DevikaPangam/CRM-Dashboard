import React, { useState, useEffect } from 'react';
import {
  Briefcase, Mail, Lock, LogIn, KeyRound, AlertTriangle,
  CheckCircle2, ShieldAlert, Sparkles, Building, ArrowRight, RefreshCw, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';

export const LoginPage: React.FC = () => {
  const {
    signIn,
    authUser,
    authState,
    accessDeniedReason,
    isLoading,
    isCloudConnected,
    signOut,
    clearAccessDenied,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'admin_init'>('signin');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password removed per Phase 9 (OTP removed)

  // Password Recovery screen state
  const [newPassword, setNewPassword] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginId.trim() || !password) {
      setErrorMsg('Please enter both CRM User ID and password.');
      return;
    }

    setIsSubmitting(true);

    if (authMode === 'admin_init') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        setIsSubmitting(false);
        return;
      }
      if (loginId.toUpperCase() !== 'DEVIKA') {
        setErrorMsg('Initialization is restricted to the Super Admin account.');
        setIsSubmitting(false);
        return;
      }
      
      if (!setupPin) {
        setErrorMsg('Setup PIN is required.');
        setIsSubmitting(false);
        return;
      }
      
      try {
        const res = await fetch('/api/auth/init-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login_id: loginId, new_password: password, setup_pin: setupPin })
        });
        
        let data: any = null;
        try {
          data = await res.json();
        } catch (e) {}

        if (!data) {
          setErrorMsg('Initialization service is unavailable.');
          return;
        }
        
        if (data.success && data.session) {
          setSuccessMsg('Password initialized and verified! Establishing CRM session...');
          const { error: sessionErr } = await supabase.auth.setSession(data.session);
          if (sessionErr) {
            setErrorMsg('Password initialized, but session establishment failed. Please sign in.');
            setAuthMode('signin');
            return;
          }
          // Supabase client session established: AuthContext listener transitions directly to dashboard
          return;
        } else if (data.success) {
          setSuccessMsg(data.message || 'Password initialized successfully. Switching to Sign In.');
          setAuthMode('signin');
          setPassword('');
          setConfirmPassword('');
          setSetupPin('');
        } else {
          setErrorMsg(data.error || 'Initialization failed.');
        }
      } catch (err: any) {
        setErrorMsg('Network error. Please try again later.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const loginResult = await signIn(loginId, password);
      setIsSubmitting(false);

      if (!loginResult.success) {
        setErrorMsg(loginResult.error || 'Authentication failed.');
      }
    }
  };

  // Forgot password removed per Phase 9 (OTP removed)

  // Email Password Recovery Screen has been permanently disabled per Phase 8 architecture requirements.

  // ─── Screen: Access Not Provisioned / Account Suspended Guard ───────────────
  if (authState === 'PROFILE_NOT_FOUND' || authState === 'PROFILE_QUERY_ERROR' || authState === 'ACCOUNT_SUSPENDED') {
    const isSuspended = authState === 'ACCOUNT_SUSPENDED';
    const isQueryError = authState === 'PROFILE_QUERY_ERROR';
    return (
      <div className="login-screen-wrapper">
        <div className="login-glass-card" style={{ maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: isSuspended ? '#fee2e2' : isQueryError ? '#fef2f2' : '#fef3c7',
                color: isSuspended ? '#dc2626' : isQueryError ? '#b91c1c' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              {isSuspended ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {isSuspended ? 'Account Access Suspended' : isQueryError ? 'Profile Query Error' : 'Access Not Provisioned'}
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

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: authMode === 'signin' ? '#ffffff' : 'transparent',
              color: authMode === 'signin' ? '#0284c7' : '#64748b',
              boxShadow: authMode === 'signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: authMode === 'admin_init' ? '#ffffff' : 'transparent',
              color: authMode === 'admin_init' ? '#0284c7' : '#64748b',
              boxShadow: authMode === 'admin_init' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setAuthMode('admin_init');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            Admin Setup
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="login-error-alert" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuthSubmit} className="login-form-body">
          <div className="login-field-group">
            <label>CRM User ID</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="text"
                placeholder="e.g. DEVIKA or AKSHAY.T"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>{authMode === 'admin_init' ? 'Set Corporate Password' : 'Password'}</label>
              {authMode === 'signin' && (
                <div className="login-forgot-link" style={{ cursor: 'default', color: '#94a3b8' }} title="Contact your Administrator to reset your password.">
                  Forgot Password?
                </div>
              )}
            </div>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                type="password"
                placeholder={authMode === 'admin_init' ? 'Create corporate password (min 8 chars)' : 'Enter your corporate password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={authMode === 'admin_init' ? 'new-password' : 'current-password'}
              />
            </div>
          </div>
          
          {authMode === 'admin_init' && (
            <>
              <div className="login-field-group">
                <label>Confirm Corporate Password</label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type="password"
                    placeholder="Re-enter corporate password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="login-field-group">
                <label>Setup PIN (Provided by Administrator)</label>
                <div className="login-input-wrapper">
                  <KeyRound size={16} className="login-input-icon" />
                  <input
                    type="password"
                    placeholder="Enter Setup PIN"
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            </>
          )}
          


          <button
            type="submit"
            className="login-submit-btn"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>{authMode === 'admin_init' ? 'Initializing...' : 'Authenticating...'}</span>
              </>
            ) : (
              <>
                {authMode === 'admin_init' ? <Sparkles size={16} /> : <LogIn size={16} />}
                <span>{authMode === 'admin_init' ? 'Initialize Admin' : 'Sign In to CRM Dashboard'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="login-footer-notes">
          <span>Protected by PostgreSQL Row-Level Security &amp; Supabase Auth</span>
        </div>
      </div>

      {/* OTP modal removed per requirements */}
    </div>
  );
};
