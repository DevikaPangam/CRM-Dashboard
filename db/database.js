/**
 * CRM Database Layer — SQLite abstraction with full schema initialization
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

let db;

function getDb() {
  if (db) return db;

  const Database = require('better-sqlite3');
  const dbPath = path.resolve(__dirname, 'crm.db');
  
  // Ensure db directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run schema migrations
  const schemaPath = path.resolve(__dirname, 'migrations', '001_initial_schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
  }

  return db;
}

// ─── Modules ─────────────────────────────────────────────────────────────────

function getModules() {
  return getDb().prepare('SELECT * FROM modules WHERE is_active = 1 ORDER BY sort_order').all();
}

function getModuleByKey(key) {
  return getDb().prepare('SELECT * FROM modules WHERE key = ?').get(key);
}

// ─── Roles ────────────────────────────────────────────────────────────────────

function getRoles() {
  return getDb().prepare('SELECT * FROM roles WHERE is_active = 1 ORDER BY name').all();
}

function getRoleById(id) {
  return getDb().prepare('SELECT * FROM roles WHERE id = ?').get(id);
}

function getRoleByName(name) {
  return getDb().prepare('SELECT * FROM roles WHERE name = ?').get(name);
}

function createRole(role) {
  const stmt = getDb().prepare(`
    INSERT INTO roles (id, name, description, data_scope, is_system)
    VALUES (@id, @name, @description, @data_scope, @is_system)
  `);
  return stmt.run(role);
}

function updateRole(id, updates) {
  const fields = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  const stmt = getDb().prepare(`UPDATE roles SET ${fields} WHERE id = ?`);
  return stmt.run({ ...updates }, id);
}

// ─── Users ────────────────────────────────────────────────────────────────────

function getUsers(filters = {}) {
  let sql = `
    SELECT u.*, r.name as role_name, r.data_scope
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.is_active !== undefined) {
    sql += ' AND u.is_active = ?';
    params.push(filters.is_active);
  }
  if (filters.role_id) {
    sql += ' AND u.role_id = ?';
    params.push(filters.role_id);
  }
  if (filters.search) {
    sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.user_id LIKE ? OR u.department LIKE ?)';
    const q = `%${filters.search}%`;
    params.push(q, q, q, q);
  }

  sql += ' ORDER BY u.name';
  return getDb().prepare(sql).all(...params);
}

function getUserById(id) {
  return getDb().prepare(`
    SELECT u.*, r.name as role_name, r.data_scope
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(id);
}

function getUserByUserId(userId) {
  return getDb().prepare(`
    SELECT u.*, r.name as role_name, r.data_scope
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.user_id = ?
  `).get(userId);
}

function getUserByEmail(email) {
  return getDb().prepare(`
    SELECT u.*, r.name as role_name, r.data_scope
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.email = ?
  `).get(email);
}

function createUser(user) {
  const stmt = getDb().prepare(`
    INSERT INTO users (
      id, user_id, employee_id, name, email, department, designation,
      role_id, password_hash, is_active, force_password_change, created_by
    ) VALUES (
      @id, @user_id, @employee_id, @name, @email, @department, @designation,
      @role_id, @password_hash, @is_active, @force_password_change, @created_by
    )
  `);
  return stmt.run(user);
}

function updateUser(id, updates) {
  const allowed = [
    'name', 'email', 'department', 'designation', 'role_id',
    'password_hash', 'is_active', 'force_password_change',
    'failed_login_attempts', 'account_locked_until',
    'last_login', 'last_logout', 'password_last_changed', 'employee_id'
  ];
  const fields = Object.keys(updates)
    .filter(k => allowed.includes(k))
    .map(k => `${k} = @${k}`)
    .join(', ');
  if (!fields) return null;
  const stmt = getDb().prepare(`UPDATE users SET ${fields} WHERE id = @id`);
  return stmt.run({ ...updates, id });
}

function incrementFailedAttempts(userId) {
  const db = getDb();
  const user = db.prepare('SELECT failed_login_attempts FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const attempts = (user.failed_login_attempts || 0) + 1;
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
  const lockDuration = parseInt(process.env.ACCOUNT_LOCK_DURATION || '30', 10);
  let lockedUntil = null;
  if (attempts >= maxAttempts) {
    const lockTime = new Date(Date.now() + lockDuration * 60 * 1000);
    lockedUntil = lockTime.toISOString();
  }
  db.prepare('UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?')
    .run(attempts, lockedUntil, userId);
  return { attempts, lockedUntil };
}

function resetFailedAttempts(userId) {
  getDb().prepare('UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?').run(userId);
}

function recordLogin(userId, sessionId = '') {
  const now = new Date().toISOString();
  getDb().prepare('UPDATE users SET last_login = ?, failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?')
    .run(now, userId);
}

function recordLogout(userId) {
  const now = new Date().toISOString();
  getDb().prepare('UPDATE users SET last_logout = ? WHERE id = ?').run(now, userId);
}

// ─── Permissions ─────────────────────────────────────────────────────────────

function getRolePermissions(roleId) {
  return getDb().prepare(`
    SELECT rp.*, m.key as module_key, m.name as module_name, m.tab_id
    FROM role_permissions rp
    JOIN modules m ON rp.module_id = m.id
    WHERE rp.role_id = ?
  `).all(roleId);
}

function getUserPermissions(userId) {
  return getDb().prepare(`
    SELECT up.*, m.key as module_key, m.name as module_name, m.tab_id
    FROM user_permissions up
    JOIN modules m ON up.module_id = m.id
    WHERE up.user_id = ?
  `).all(userId);
}

function getEffectivePermissions(userId) {
  const user = getUserById(userId);
  if (!user) return {};

  // Start with role permissions
  const rolePerms = getRolePermissions(user.role_id);
  const permMap = {};
  rolePerms.forEach(p => {
    permMap[p.module_key] = {
      module_id: p.module_id,
      module_key: p.module_key,
      module_name: p.module_name,
      tab_id: p.tab_id,
      can_view: !!p.can_view,
      can_create: !!p.can_create,
      can_edit: !!p.can_edit,
      can_delete: !!p.can_delete,
      can_export: !!p.can_export,
      can_assign: !!p.can_assign,
      can_approve: !!p.can_approve,
      can_admin: !!p.can_admin,
    };
  });

  // Override with user-specific permissions
  const userPerms = getUserPermissions(userId);
  userPerms.forEach(p => {
    if (!permMap[p.module_key]) {
      permMap[p.module_key] = { module_key: p.module_key, module_name: p.module_name, tab_id: p.tab_id };
    }
    // User permissions take precedence over role permissions
    Object.assign(permMap[p.module_key], {
      can_view: !!p.can_view,
      can_create: !!p.can_create,
      can_edit: !!p.can_edit,
      can_delete: !!p.can_delete,
      can_export: !!p.can_export,
      can_assign: !!p.can_assign,
      can_approve: !!p.can_approve,
      can_admin: !!p.can_admin,
    });
  });

  return permMap;
}

function setRolePermissions(roleId, moduleId, perms) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM role_permissions WHERE role_id = ? AND module_id = ?').get(roleId, moduleId);
  if (existing) {
    db.prepare(`
      UPDATE role_permissions SET
        can_view=@can_view, can_create=@can_create, can_edit=@can_edit,
        can_delete=@can_delete, can_export=@can_export, can_assign=@can_assign,
        can_approve=@can_approve, can_admin=@can_admin
      WHERE role_id=@role_id AND module_id=@module_id
    `).run({ role_id: roleId, module_id: moduleId, ...perms });
  } else {
    db.prepare(`
      INSERT INTO role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_export, can_assign, can_approve, can_admin)
      VALUES (@role_id, @module_id, @can_view, @can_create, @can_edit, @can_delete, @can_export, @can_assign, @can_approve, @can_admin)
    `).run({ role_id: roleId, module_id: moduleId, ...perms });
  }
}

function setUserPermissions(userId, moduleId, perms) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM user_permissions WHERE user_id = ? AND module_id = ?').get(userId, moduleId);
  if (existing) {
    db.prepare(`
      UPDATE user_permissions SET
        can_view=@can_view, can_create=@can_create, can_edit=@can_edit,
        can_delete=@can_delete, can_export=@can_export, can_assign=@can_assign,
        can_approve=@can_approve, can_admin=@can_admin
      WHERE user_id=@user_id AND module_id=@module_id
    `).run({ user_id: userId, module_id: moduleId, ...perms });
  } else {
    db.prepare(`
      INSERT INTO user_permissions (user_id, module_id, can_view, can_create, can_edit, can_delete, can_export, can_assign, can_approve, can_admin)
      VALUES (@user_id, @module_id, @can_view, @can_create, @can_edit, @can_delete, @can_export, @can_assign, @can_approve, @can_admin)
    `).run({ user_id: userId, module_id: moduleId, ...perms });
  }
}

// ─── User Segments ────────────────────────────────────────────────────────────

function getUserSegments(userId) {
  return getDb().prepare('SELECT segment_name FROM user_segments WHERE user_id = ?').all(userId).map(r => r.segment_name);
}

function setUserSegments(userId, segments) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM user_segments WHERE user_id = ?').run(userId);
    const insert = db.prepare('INSERT INTO user_segments (user_id, segment_name) VALUES (?, ?)');
    segments.forEach(seg => insert.run(userId, seg));
  });
  tx();
}

// ─── Login History ────────────────────────────────────────────────────────────

function logLoginEvent(event) {
  const stmt = getDb().prepare(`
    INSERT INTO login_history (user_id, user_name, action, success, ip_address, user_agent, session_id, failure_reason)
    VALUES (@user_id, @user_name, @action, @success, @ip_address, @user_agent, @session_id, @failure_reason)
  `);
  return stmt.run({
    user_id: event.user_id || '',
    user_name: event.user_name || '',
    action: event.action || 'LOGIN',
    success: event.success ? 1 : 0,
    ip_address: event.ip_address || '',
    user_agent: event.user_agent || '',
    session_id: event.session_id || '',
    failure_reason: event.failure_reason || ''
  });
}

function getLoginHistory(filters = {}) {
  let sql = 'SELECT * FROM login_history WHERE 1=1';
  const params = [];
  if (filters.user_id) { sql += ' AND user_id = ?'; params.push(filters.user_id); }
  if (filters.action) { sql += ' AND action = ?'; params.push(filters.action); }
  if (filters.success !== undefined) { sql += ' AND success = ?'; params.push(filters.success ? 1 : 0); }
  sql += ' ORDER BY created_at DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return getDb().prepare(sql).all(...params);
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

function logAudit(event) {
  const stmt = getDb().prepare(`
    INSERT INTO audit_log (user_id, user_name, action, entity_type, entity_id, details, ip_address)
    VALUES (@user_id, @user_name, @action, @entity_type, @entity_id, @details, @ip_address)
  `);
  return stmt.run({
    user_id: event.user_id || '',
    user_name: event.user_name || '',
    action: event.action || '',
    entity_type: event.entity_type || '',
    entity_id: event.entity_id || '',
    details: event.details || '',
    ip_address: event.ip_address || ''
  });
}

function getAuditLog(filters = {}) {
  let sql = 'SELECT * FROM audit_log WHERE 1=1';
  const params = [];
  if (filters.user_id) { sql += ' AND user_id = ?'; params.push(filters.user_id); }
  if (filters.entity_type) { sql += ' AND entity_type = ?'; params.push(filters.entity_type); }
  sql += ' ORDER BY created_at DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return getDb().prepare(sql).all(...params);
}

// ─── Health ───────────────────────────────────────────────────────────────────

function healthCheck() {
  try {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return {
      status: 'ok',
      database: 'connected',
      user_count: row.count,
      environment: process.env.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { status: 'error', database: 'disconnected', error: err.message };
  }
}

module.exports = {
  getDb,
  getModules, getModuleByKey,
  getRoles, getRoleById, getRoleByName, createRole, updateRole,
  getUsers, getUserById, getUserByUserId, getUserByEmail,
  createUser, updateUser, incrementFailedAttempts, resetFailedAttempts,
  recordLogin, recordLogout,
  getRolePermissions, getUserPermissions, getEffectivePermissions,
  setRolePermissions, setUserPermissions,
  getUserSegments, setUserSegments,
  logLoginEvent, getLoginHistory,
  logAudit, getAuditLog,
  healthCheck
};
