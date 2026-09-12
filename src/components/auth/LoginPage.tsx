import React, { useState, useEffect } from 'react';
import {
  Briefcase, Mail, Lock, LogIn, KeyRound, AlertTriangle,
  CheckCircle2, ShieldAlert, Sparkles, Building, ArrowRight, RefreshCw, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const {
    signIn,
    signUp,
    resetPassword,
    verifyRecoveryOtp,
    updatePassword,
    authUser,
    authState,
    accessDeniedReason,
    isLoading,
    isCloudConnected,
    isPasswordRecoveryMode,
    signOut,
    clearAccessDenied,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password modal state (Native OTP Recovery Stepper)
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [resetEmail, setResetEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password Recovery screen state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both work email and password.');
      return;
    }

    setIsSubmitting(true);

    if (authMode === 'register') {
      const regResult = await signUp(email, password);
      setIsSubmitting(false);
      if (regResult.success) {
        setSuccessMsg(regResult.message || 'Account registration successful!');
      } else {
        setErrorMsg(regResult.error || 'Registration failed.');
      }
    } else {
      const loginResult = await signIn(email, password);
      setIsSubmitting(false);

      if (!loginResult.success) {
        setErrorMsg(loginResult.error || 'Authentication failed.');
      }
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
      setRecoveryStep('OTP');
      setResendCooldown(60);
      setOtpToken('');
    } else {
      setResetStatus({ success: false, message: result.error });
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim() || otpToken.trim().length < 6) {
      setResetStatus({ success: false, message: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setIsVerifyingOtp(true);
    setResetStatus(null);
    const result = await verifyRecoveryOtp(resetEmail, otpToken);
    setIsVerifyingOtp(false);

    if (result.success) {
      setForgotModalOpen(false);
      setOtpToken('');
      setRecoveryStep('EMAIL');
    } else {
      setResetStatus({ success: false, message: result.error || 'Invalid or expired verification code. Please try again.' });
    }
  };

  // ─── Screen: Password Recovery Screen ───────────────────────────────────────
  if (authState === 'PASSWORD_RECOVERY' || isPasswordRecoveryMode) {
    const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPassword || !confirmPassword) {
        setUpdateStatus({ success: false, error: 'Please fill in both password fields.' });
        return;
      }
      if (newPassword.length < 6) {
        setUpdateStatus({ success: false, error: 'Password must be at least 6 characters long.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setUpdateStatus({ success: false, error: 'Passwords do not match. Please re-enter.' });
        return;
      }

      setIsUpdatingPassword(true);
      setUpdateStatus(null);
      const res = await updatePassword(newPassword);
      setIsUpdatingPassword(false);
      if (res.success) {
        setUpdateStatus({ success: true, message: res.message || 'Password updated successfully!' });
      } else {
        setUpdateStatus({ success: false, error: res.error || 'Password update failed.' });
      }
    };

    return (
      <div className="login-screen-wrapper">
        <div className="login-glass-card" style={{ maxWidth: '460px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <KeyRound size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Set New Corporate Password
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Authenticated via password recovery session for: <strong>{authUser?.email || 'Corporate User Account'}</strong>
            </p>
          </div>

          {updateStatus?.success ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '14px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{updateStatus.message}</span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                onClick={() => {
                  window.location.href = window.location.origin;
                }}
              >
                Proceed to CRM Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePasswordSubmit} className="login-form-body">
              {updateStatus?.error && (
                <div className="login-error-alert" style={{ marginBottom: '16px' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{updateStatus.error}</span>
                </div>
              )}

              <div className="login-field-group">
                <label>New Corporate Password</label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label>Confirm New Password</label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Update Corporate Password</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

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
              background: authMode === 'register' ? '#ffffff' : 'transparent',
              color: authMode === 'register' ? '#0284c7' : '#64748b',
              boxShadow: authMode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            First-Time Setup / Register
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
              {errorMsg.toLowerCase().includes('invalid login credentials') && (
                <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                  If you are logging in for the first time or setting your password, switch to the <strong>First-Time Setup / Register</strong> tab or click <strong>Forgot Password?</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuthSubmit} className="login-form-body">
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
              <label>{authMode === 'register' ? 'Set Corporate Password' : 'Password'}</label>
              {authMode === 'signin' && (
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
              )}
            </div>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                type="password"
                placeholder={authMode === 'register' ? 'Create corporate password (min 6 chars)' : 'Enter your corporate password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
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
                <span>{authMode === 'register' ? 'Registering Account...' : 'Authenticating...'}</span>
              </>
            ) : (
              <>
                {authMode === 'register' ? <Sparkles size={16} /> : <LogIn size={16} />}
                <span>{authMode === 'register' ? 'Register Corporate Account' : 'Sign In to CRM Dashboard'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="login-footer-notes">
          <span>Protected by PostgreSQL Row-Level Security &amp; Supabase Auth</span>
        </div>
      </div>

      {/* ─── Native Supabase OTP Password Recovery Modal ────────────────────── */}
      {forgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} style={{ color: '#0284c7' }} />
                <h3>{recoveryStep === 'OTP' ? 'Enter Verification Code' : 'Reset Corporate Password'}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setForgotModalOpen(false);
                  setRecoveryStep('EMAIL');
                  setResetStatus(null);
                  setOtpToken('');
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 20px 20px 20px' }}>
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

              {recoveryStep === 'EMAIL' ? (
                /* Step 1: Work Email Request */
                <form onSubmit={handleResetSubmit}>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
                    Enter your registered corporate email address. If an account exists, a 6-digit verification code will be sent to your corporate inbox.
                  </p>

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
                        autoFocus
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
                      {isResetting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        'Dispatch Verification Code'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: 6-Digit OTP Verification Entry */
                <form onSubmit={handleVerifyOtpSubmit}>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                    Enter the 6-digit verification code sent to: <strong style={{ color: '#0f172a' }}>{resetEmail}</strong>
                  </p>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      6-Digit OTP Verification Code
                    </label>
                    <div className="login-input-wrapper">
                      <ShieldCheck size={16} className="login-input-icon" style={{ color: '#0284c7' }} />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otpToken}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpToken(val);
                        }}
                        placeholder="123456"
                        style={{ letterSpacing: '4px', fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}
                        required
                        autoFocus
                        autoComplete="one-time-code"
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Check your corporate email inbox</span>
                      <button
                        type="button"
                        style={{ border: 'none', background: 'none', color: resendCooldown > 0 ? '#94a3b8' : '#0284c7', fontSize: '11px', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', padding: 0 }}
                        disabled={resendCooldown > 0 || isResetting}
                        onClick={async () => {
                          setIsResetting(true);
                          setResetStatus(null);
                          const res = await resetPassword(resetEmail);
                          setIsResetting(false);
                          if (res.success) {
                            setResendCooldown(60);
                            setResetStatus({ success: true, message: 'A new 6-digit verification code has been sent.' });
                          } else {
                            setResetStatus({ success: false, message: res.error });
                          }
                        }}
                      >
                        {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setRecoveryStep('EMAIL')}
                    >
                      <ArrowLeft size={13} />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isVerifyingOtp || otpToken.length < 6}
                    >
                      {isVerifyingOtp ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        'Verify Code & Continue'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
