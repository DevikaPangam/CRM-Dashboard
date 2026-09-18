import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Save, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { triggerPasswordReset } from '../../services/adminService';

export const AdminResetPasswordModal: React.FC = () => {
  const { closeModal, activeModal } = useCRM();
  const userToEdit = activeModal.data; // Type: TeamMember or User
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!userToEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await triggerPasswordReset(userToEdit.id, newPassword);
      if (res.success) {
        setSuccessMsg(res.message || 'Password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
        // Close modal automatically after brief delay
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while resetting the password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Secure Admin Password Reset</h2>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: '6px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <ShieldCheck size={16} style={{ color: '#1d4ed8' }} />
                <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>Authorized Operation</strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#1e40af' }}>
                You are setting a new authentication credential for <strong>{userToEdit.name || userToEdit.full_name}</strong>. This password must be communicated to the employee securely.
              </p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '13px', marginBottom: '16px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                <AlertTriangle size={16} />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '13px', marginBottom: '16px', borderRadius: '4px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                <ShieldCheck size={16} />
                {successMsg}
              </div>
            )}

            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter new secure password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || !!successMsg}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !!successMsg}
                required
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !!successMsg}>
              {loading ? (
                <span>Resetting...</span>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Commit Secure Reset</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
