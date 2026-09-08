/**
 * CRM Authentication Middleware
 * Provides: requireLogin, requireRole, requirePermission, requireModuleAccess
 */

const db = require('../db/database');

/**
 * Attach current user + effective permissions to req.user on every request.
 * Call this before any protected route.
 */
function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    try {
      const user = db.getUserById(req.session.userId);
      if (user && user.is_active) {
        const perms = db.getEffectivePermissions(user.id);
        const segments = db.getUserSegments(user.id);
        req.user = { ...user, permissions: perms, allowed_segments: segments };
      } else {
        req.session.destroy(() => {});
        req.user = null;
      }
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

/**
 * Require an authenticated session. Returns 401 for API or redirects to /login.html for HTML.
 */
function requireLogin(req, res, next) {
  if (!req.user) {
    if (isApiRequest(req)) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    return res.redirect('/login.html');
  }

  // Enforce session timeout
  const timeout = parseInt(process.env.SESSION_TIMEOUT || '3600', 10) * 1000;
  const lastActivity = req.session.lastActivity || Date.now();
  if (Date.now() - lastActivity > timeout) {
    req.session.destroy(() => {});
    if (isApiRequest(req)) {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    return res.redirect('/login.html?reason=timeout');
  }

  req.session.lastActivity = Date.now();
  next();
}

/**
 * Require user to have one of the specified role names.
 * @param {string|string[]} roles
 */
function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    const userRole = req.user.role_name || '';
    if (allowed.includes(userRole) || userRole === 'Super Admin') {
      return next();
    }
    return res.status(403).json({ success: false, error: 'Access denied. Insufficient role.' });
  };
}

/**
 * Require a specific permission on a module.
 * @param {string} moduleKey  — e.g. 'clients', 'opportunities'
 * @param {string} action     — 'view'|'create'|'edit'|'delete'|'export'|'assign'|'approve'|'admin'
 */
function requirePermission(moduleKey, action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (req.user.role_name === 'Super Admin') return next();

    const perm = req.user.permissions[moduleKey];
    const key = `can_${action}`;
    if (perm && perm[key]) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Access denied. You do not have ${action} permission on ${moduleKey}.`
    });
  };
}

/**
 * Require access to a specific module tab (view permission).
 */
function requireModuleAccess(moduleKey) {
  return requirePermission(moduleKey, 'view');
}

/**
 * Require user to be Super Admin specifically.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }
  if (req.user.role_name === 'Super Admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
}

/**
 * Check if request is an API/JSON request (vs browser page request).
 */
function isApiRequest(req) {
  return req.path.startsWith('/api/') ||
    req.headers['content-type'] === 'application/json' ||
    req.headers['accept'] === 'application/json' ||
    req.xhr;
}

/**
 * Helper: Check if a user can access a given segment.
 */
function canAccessSegment(user, segmentName) {
  if (!segmentName) return true;
  if (!user) return false;
  if (user.role_name === 'Super Admin' || user.role_name === 'Management') return true;
  const segs = user.allowed_segments || [];
  if (segs.includes('All')) return true;
  return segs.includes(segmentName);
}

/**
 * Middleware to log all authenticated API actions.
 */
function auditLog(action, entityType = '') {
  return (req, res, next) => {
    if (req.user) {
      db.logAudit({
        user_id: req.user.id,
        user_name: req.user.name,
        action,
        entity_type: entityType,
        entity_id: req.params.id || '',
        details: JSON.stringify(req.body || {}),
        ip_address: req.ip || ''
      });
    }
    next();
  };
}

module.exports = {
  attachUser,
  requireLogin,
  requireRole,
  requirePermission,
  requireModuleAccess,
  requireAdmin,
  canAccessSegment,
  auditLog
};
