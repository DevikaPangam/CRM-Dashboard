/**
 * CRM Admin Routes — User management, roles, permissions, audit
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireLogin, requireAdmin, requireRole, auditLog } = require('../middleware/auth');
const { validatePassword } = require('./auth');

const router = express.Router();

// All admin routes require login
router.use(requireLogin);

// ─── USERS ─────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', requireRole('Super Admin', 'Management'), (req, res) => {
  try {
    const { search, role_id, is_active } = req.query;
    const filters = {};
    if (search) filters.search = search;
    if (role_id) filters.role_id = role_id;
    if (is_active !== undefined) filters.is_active = is_active === '1' ? 1 : 0;

    const users = db.getUsers(filters).map(u => {
      const { password_hash, ...safe } = u;
      safe.allowed_segments = db.getUserSegments(u.id);
      return safe;
    });
    res.json({ success: true, users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve users.' });
  }
});

// POST /api/admin/users — Create user
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const {
      user_id, employee_id, name, email, department, designation,
      role_id, temp_password, is_active = 1,
      force_password_change = 1, segments = ['All']
    } = req.body;

    if (!user_id || !name || !email || !role_id || !temp_password) {
      return res.status(400).json({ success: false, error: 'User ID, Name, Email, Role, and Password are required.' });
    }

    // Validate password
    const pwdErr = validatePassword(temp_password);
    if (pwdErr) return res.status(400).json({ success: false, error: pwdErr });

    // Check duplicates
    const existingUserId = db.getUserByUserId(user_id.trim());
    if (existingUserId) return res.status(409).json({ success: false, error: 'User ID already exists.' });

    const existingEmail = db.getUserByEmail(email.trim().toLowerCase());
    if (existingEmail) return res.status(409).json({ success: false, error: 'Email address already in use.' });

    // Validate role
    const role = db.getRoleById(role_id);
    if (!role) return res.status(400).json({ success: false, error: 'Invalid role selected.' });

    const id = 'USR-' + uuidv4().split('-')[0].toUpperCase();
    const hash = await bcrypt.hash(temp_password, 12);

    db.createUser({
      id,
      user_id: user_id.trim(),
      employee_id: employee_id || '',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department: department || '',
      designation: designation || '',
      role_id,
      password_hash: hash,
      is_active: is_active ? 1 : 0,
      force_password_change: force_password_change ? 1 : 0,
      created_by: req.user.id
    });

    db.setUserSegments(id, Array.isArray(segments) ? segments : ['All']);

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'CREATE_USER',
      entity_type: 'user',
      entity_id: id,
      details: `Created user: ${name} (${user_id})`,
      ip_address: req.ip
    });

    const newUser = db.getUserById(id);
    const { password_hash, ...safeUser } = newUser;
    safeUser.allowed_segments = segments;

    res.status(201).json({ success: true, user: safeUser, message: `User ${name} created successfully.` });

  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, error: 'Unable to create user. Please check the information and try again.' });
  }
});

// PUT /api/admin/users/:id — Update user
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, department, designation, role_id,
      is_active, force_password_change, employee_id, segments
    } = req.body;

    const existing = db.getUserById(id);
    if (!existing) return res.status(404).json({ success: false, error: 'User not found.' });

    // Prevent last admin removal
    if (existing.role_name === 'Super Admin' && role_id && role_id !== existing.role_id) {
      const admins = db.getUsers().filter(u => u.role_name === 'Super Admin' && u.is_active);
      if (admins.length <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot remove the only active Super Admin.' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (department !== undefined) updates.department = department;
    if (designation !== undefined) updates.designation = designation;
    if (role_id !== undefined) updates.role_id = role_id;
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
    if (force_password_change !== undefined) updates.force_password_change = force_password_change ? 1 : 0;
    if (employee_id !== undefined) updates.employee_id = employee_id;

    db.updateUser(id, updates);

    if (segments !== undefined) {
      db.setUserSegments(id, Array.isArray(segments) ? segments : ['All']);
    }

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'UPDATE_USER',
      entity_type: 'user',
      entity_id: id,
      details: JSON.stringify(updates),
      ip_address: req.ip
    });

    const updatedUser = db.getUserById(id);
    const { password_hash, ...safeUser } = updatedUser;
    safeUser.allowed_segments = db.getUserSegments(id);

    res.json({ success: true, user: safeUser, message: 'User updated successfully.' });

  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, error: 'Unable to update user. Please try again.' });
  }
});

// DELETE /api/admin/users/:id — Deactivate user (soft delete)
router.delete('/users/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getUserById(id);
    if (!existing) return res.status(404).json({ success: false, error: 'User not found.' });

    // Prevent self-deactivation
    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account.' });
    }

    // Prevent last admin removal
    if (existing.role_name === 'Super Admin') {
      const activeAdmins = db.getUsers({ is_active: 1 }).filter(u => u.role_name === 'Super Admin');
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot deactivate the only active Super Admin.' });
      }
    }

    db.updateUser(id, { is_active: 0 });

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'DEACTIVATE_USER',
      entity_type: 'user',
      entity_id: id,
      details: `Deactivated user: ${existing.name}`,
      ip_address: req.ip
    });

    res.json({ success: true, message: `User ${existing.name} has been deactivated.` });
  } catch (err) {
    console.error('Deactivate user error:', err);
    res.status(500).json({ success: false, error: 'Failed to deactivate user.' });
  }
});

// POST /api/admin/users/:id/activate — Reactivate user
router.post('/users/:id/activate', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getUserById(id);
    if (!existing) return res.status(404).json({ success: false, error: 'User not found.' });

    db.updateUser(id, { is_active: 1, failed_login_attempts: 0, account_locked_until: null });

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'ACTIVATE_USER',
      entity_type: 'user',
      entity_id: id,
      details: `Activated user: ${existing.name}`,
      ip_address: req.ip
    });

    res.json({ success: true, message: `User ${existing.name} has been activated.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to activate user.' });
  }
});

// POST /api/admin/users/:id/unlock — Unlock locked account
router.post('/users/:id/unlock', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.updateUser(id, { failed_login_attempts: 0, account_locked_until: null });
    const user = db.getUserById(id);
    res.json({ success: true, message: `Account for ${user.name} has been unlocked.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to unlock account.' });
  }
});

// POST /api/admin/users/:id/reset-password — Admin reset password
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ success: false, error: 'New password is required.' });
    }

    const pwdErr = validatePassword(new_password);
    if (pwdErr) return res.status(400).json({ success: false, error: pwdErr });

    const existing = db.getUserById(id);
    if (!existing) return res.status(404).json({ success: false, error: 'User not found.' });

    const hash = await bcrypt.hash(new_password, 12);
    db.updateUser(id, {
      password_hash: hash,
      force_password_change: 1,
      failed_login_attempts: 0,
      account_locked_until: null,
      password_last_changed: new Date().toISOString()
    });

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'RESET_PASSWORD',
      entity_type: 'user',
      entity_id: id,
      details: `Admin reset password for: ${existing.name}`,
      ip_address: req.ip
    });

    res.json({ success: true, message: `Password reset for ${existing.name}. They will be prompted to change it on next login.` });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});

// ─── ROLES ─────────────────────────────────────────────────────────────────

// GET /api/admin/roles
router.get('/roles', (req, res) => {
  try {
    const roles = db.getRoles();
    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve roles.' });
  }
});

// ─── PERMISSIONS ────────────────────────────────────────────────────────────

// GET /api/admin/permissions/:userId
router.get('/permissions/:userId', requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const modules = db.getModules();
    const rolePerms = db.getRolePermissions(user.role_id);
    const userPerms = db.getUserPermissions(userId);
    const effectivePerms = db.getEffectivePermissions(userId);
    const segments = db.getUserSegments(userId);

    res.json({
      success: true,
      user: { id: user.id, name: user.name, role_name: user.role_name },
      modules,
      role_permissions: rolePerms,
      user_permissions: userPerms,
      effective_permissions: effectivePerms,
      allowed_segments: segments
    });
  } catch (err) {
    console.error('Get permissions error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve permissions.' });
  }
});

// PUT /api/admin/permissions/:userId — Save user permission overrides
router.put('/permissions/:userId', requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions, segments } = req.body;

    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const modules = db.getModules();

    if (permissions && typeof permissions === 'object') {
      for (const [moduleKey, perms] of Object.entries(permissions)) {
        const mod = modules.find(m => m.key === moduleKey);
        if (!mod) continue;
        db.setUserPermissions(userId, mod.id, {
          can_view: perms.can_view ? 1 : 0,
          can_create: perms.can_create ? 1 : 0,
          can_edit: perms.can_edit ? 1 : 0,
          can_delete: perms.can_delete ? 1 : 0,
          can_export: perms.can_export ? 1 : 0,
          can_assign: perms.can_assign ? 1 : 0,
          can_approve: perms.can_approve ? 1 : 0,
          can_admin: perms.can_admin ? 1 : 0
        });
      }
    }

    if (segments !== undefined) {
      db.setUserSegments(userId, Array.isArray(segments) ? segments : ['All']);
    }

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'UPDATE_PERMISSIONS',
      entity_type: 'user',
      entity_id: userId,
      details: `Updated permissions for: ${user.name}`,
      ip_address: req.ip
    });

    res.json({ success: true, message: `Permissions updated for ${user.name}.` });
  } catch (err) {
    console.error('Update permissions error:', err);
    res.status(500).json({ success: false, error: 'Failed to update permissions.' });
  }
});

// PUT /api/admin/role-permissions/:roleId — Save role default permissions
router.put('/role-permissions/:roleId', requireAdmin, (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    const role = db.getRoleById(roleId);
    if (!role) return res.status(404).json({ success: false, error: 'Role not found.' });
    if (role.is_system && role.name === 'Super Admin') {
      return res.status(400).json({ success: false, error: 'Super Admin permissions cannot be changed.' });
    }

    const modules = db.getModules();
    if (permissions && typeof permissions === 'object') {
      for (const [moduleKey, perms] of Object.entries(permissions)) {
        const mod = modules.find(m => m.key === moduleKey);
        if (!mod) continue;
        db.setRolePermissions(roleId, mod.id, {
          can_view: perms.can_view ? 1 : 0,
          can_create: perms.can_create ? 1 : 0,
          can_edit: perms.can_edit ? 1 : 0,
          can_delete: perms.can_delete ? 1 : 0,
          can_export: perms.can_export ? 1 : 0,
          can_assign: perms.can_assign ? 1 : 0,
          can_approve: perms.can_approve ? 1 : 0,
          can_admin: perms.can_admin ? 1 : 0
        });
      }
    }

    db.logAudit({
      user_id: req.user.id,
      user_name: req.user.name,
      action: 'UPDATE_ROLE_PERMISSIONS',
      entity_type: 'role',
      entity_id: roleId,
      details: `Updated permissions for role: ${role.name}`,
      ip_address: req.ip
    });

    res.json({ success: true, message: `Role permissions for "${role.name}" updated.` });
  } catch (err) {
    console.error('Update role permissions error:', err);
    res.status(500).json({ success: false, error: 'Failed to update role permissions.' });
  }
});

// ─── MODULES ────────────────────────────────────────────────────────────────

// GET /api/admin/modules
router.get('/modules', (req, res) => {
  try {
    const modules = db.getModules();
    res.json({ success: true, modules });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve modules.' });
  }
});

// ─── AUDIT & HISTORY ────────────────────────────────────────────────────────

// GET /api/admin/login-history
router.get('/login-history', requireRole('Super Admin', 'Management'), (req, res) => {
  try {
    const { user_id, action, limit = 200 } = req.query;
    const history = db.getLoginHistory({
      user_id: user_id || undefined,
      action: action || undefined,
      limit: parseInt(limit, 10)
    });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve login history.' });
  }
});

// GET /api/admin/audit-log
router.get('/audit-log', requireRole('Super Admin', 'Management'), (req, res) => {
  try {
    const { user_id, entity_type, limit = 200 } = req.query;
    const logs = db.getAuditLog({
      user_id: user_id || undefined,
      entity_type: entity_type || undefined,
      limit: parseInt(limit, 10)
    });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve audit log.' });
  }
});

// ─── HEALTH ─────────────────────────────────────────────────────────────────

// GET /api/admin/health
router.get('/health', requireAdmin, (req, res) => {
  try {
    const health = db.healthCheck();
    res.json({ success: true, health });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Health check failed.', detail: err.message });
  }
});

module.exports = router;
