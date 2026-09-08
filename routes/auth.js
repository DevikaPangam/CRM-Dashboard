/**
 * CRM Auth Routes — Login, Logout, Me, Change Password
 */

const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const db = require('../db/database');
const { requireLogin, auditLog } = require('../middleware/auth');

const router = express.Router();

// Rate limit: 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ success: false, error: 'User ID and Password are required.' });
    }

    // Find user (search by user_id OR email)
    let user = db.getUserByUserId(user_id.trim());
    if (!user) {
      user = db.getUserByEmail(user_id.trim().toLowerCase());
    }

    // Security: generic message — do not reveal if user_id exists
    const genericError = 'Invalid User ID or Password.';

    if (!user) {
      db.logLoginEvent({
        user_id: 'UNKNOWN',
        user_name: user_id,
        action: 'LOGIN',
        success: false,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || '',
        session_id: '',
        failure_reason: 'User not found'
      });
      return res.status(401).json({ success: false, error: genericError });
    }

    // Check account active
    if (!user.is_active) {
      db.logLoginEvent({
        user_id: user.id,
        user_name: user.name,
        action: 'LOGIN',
        success: false,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || '',
        session_id: '',
        failure_reason: 'Account inactive'
      });
      return res.status(403).json({ success: false, error: 'Account is deactivated. Contact your Administrator.' });
    }

    // Check account lockout
    if (user.account_locked_until) {
      const lockTime = new Date(user.account_locked_until);
      if (lockTime > new Date()) {
        const minutesLeft = Math.ceil((lockTime - new Date()) / 60000);
        db.logLoginEvent({
          user_id: user.id,
          user_name: user.name,
          action: 'LOGIN',
          success: false,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || '',
          session_id: '',
          failure_reason: 'Account locked'
        });
        return res.status(403).json({
          success: false,
          error: `Account temporarily locked. Please try again in ${minutesLeft} minute(s) or contact Admin.`
        });
      }
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const result = db.incrementFailedAttempts(user.id);
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
      const remaining = maxAttempts - (result ? result.attempts : 1);

      db.logLoginEvent({
        user_id: user.id,
        user_name: user.name,
        action: 'LOGIN',
        success: false,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || '',
        session_id: '',
        failure_reason: 'Incorrect password'
      });

      if (result && result.lockedUntil) {
        return res.status(403).json({
          success: false,
          error: `Account locked after ${maxAttempts} failed attempts. Contact Admin to unlock.`
        });
      }

      return res.status(401).json({
        success: false,
        error: remaining > 0
          ? `${genericError} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`
          : genericError
      });
    }

    // ✅ Authentication successful
    db.resetFailedAttempts(user.id);
    db.recordLogin(user.id);

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
      }

      req.session.userId = user.id;
      req.session.lastActivity = Date.now();

      db.logLoginEvent({
        user_id: user.id,
        user_name: user.name,
        action: 'LOGIN',
        success: true,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || '',
        session_id: req.session.id,
        failure_reason: ''
      });

      // Build response payload (never return password_hash)
      const { password_hash, ...safeUser } = user;

      res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        user: safeUser,
        force_password_change: !!user.force_password_change,
        redirect: user.force_password_change ? '/index.html?forceChange=1' : '/index.html'
      });
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'An error occurred. Please try again.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  if (req.session && req.session.userId) {
    const userId = req.session.userId;
    const sessionId = req.session.id;
    
    db.recordLogout(userId);
    db.logLoginEvent({
      user_id: userId,
      user_name: req.user ? req.user.name : '',
      action: 'LOGOUT',
      success: true,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] || '',
      session_id: sessionId,
      failure_reason: ''
    });
  }

  req.session.destroy((err) => {
    res.clearCookie('crm_session');
    if (err) console.error('Session destroy error:', err);
    res.json({ success: true, redirect: '/login.html' });
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', requireLogin, (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// ─── POST /api/auth/change-password ──────────────────────────────────────────

router.post('/change-password', requireLogin, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, error: 'New passwords do not match.' });
    }

    // Validate password rules
    const pwdError = validatePassword(new_password);
    if (pwdError) {
      return res.status(400).json({ success: false, error: pwdError });
    }

    // Verify current password
    const user = db.getUserById(req.user.id);
    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    if (current_password === new_password) {
      return res.status(400).json({ success: false, error: 'New password must be different from current password.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    const now = new Date().toISOString();
    db.updateUser(req.user.id, {
      password_hash: hash,
      force_password_change: 0,
      password_last_changed: now
    });

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'CHANGE_PASSWORD',
      entity_type: 'user',
      entity_id: req.user.id,
      details: 'Password changed by user',
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Password changed successfully.' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: 'Failed to change password. Please try again.' });
  }
});

// ─── GET /api/auth/permissions ────────────────────────────────────────────────

router.get('/permissions', requireLogin, (req, res) => {
  const perms = req.user.permissions || {};
  const segments = req.user.allowed_segments || [];
  const allowedTabIds = Object.values(perms)
    .filter(p => p.can_view)
    .map(p => p.tab_id);

  res.json({
    success: true,
    permissions: perms,
    allowed_tabs: allowedTabIds,
    allowed_segments: segments,
    role: req.user.role_name,
    data_scope: req.user.data_scope
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validatePassword(pwd) {
  const min = parseInt(process.env.MIN_PASSWORD_LENGTH || '8', 10);
  if (pwd.length < min) return `Password must be at least ${min} characters long.`;
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must contain at least one special character.';
  return null;
}

module.exports = router;
module.exports.validatePassword = validatePassword;
