-- =============================================
-- CRM Authentication & RBAC Schema
-- =============================================

-- Module Registry
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  tab_id TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  data_scope TEXT DEFAULT 'own',
  is_system INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  employee_id TEXT DEFAULT '',
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT DEFAULT '',
  designation TEXT DEFAULT '',
  role_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  force_password_change INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TEXT DEFAULT NULL,
  last_login TEXT DEFAULT NULL,
  last_logout TEXT DEFAULT NULL,
  password_last_changed TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'SYSTEM',
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Role-Module Permissions (default permissions per role)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  can_view INTEGER DEFAULT 0,
  can_create INTEGER DEFAULT 0,
  can_edit INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  can_export INTEGER DEFAULT 0,
  can_assign INTEGER DEFAULT 0,
  can_approve INTEGER DEFAULT 0,
  can_admin INTEGER DEFAULT 0,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (module_id) REFERENCES modules(id),
  UNIQUE(role_id, module_id)
);

-- User-specific Permission Overrides
CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  can_view INTEGER DEFAULT 0,
  can_create INTEGER DEFAULT 0,
  can_edit INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  can_export INTEGER DEFAULT 0,
  can_assign INTEGER DEFAULT 0,
  can_approve INTEGER DEFAULT 0,
  can_admin INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (module_id) REFERENCES modules(id),
  UNIQUE(user_id, module_id)
);

-- User Allowed Segments
CREATE TABLE IF NOT EXISTS user_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  segment_name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, segment_name)
);

-- Login History / Audit
CREATE TABLE IF NOT EXISTS login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  success INTEGER DEFAULT 1,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  failure_reason TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- General Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  details TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Sessions Table (for server-managed sessions)
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expired TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_date ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
