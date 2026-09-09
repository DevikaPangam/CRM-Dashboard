/**
 * CRM Database Seeder — Creates default roles, modules, admin user, and demo users
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const SALT_ROUNDS = 12;

// ─── Module Registry ─────────────────────────────────────────────────────────

const MODULES = [
  { id: 'MOD-01', key: 'dashboard',     name: 'Management Dashboard',    tab_id: 'tab-dashboard',     icon: 'layout-dashboard', sort_order: 1 },
  { id: 'MOD-02', key: 'clients',       name: 'Client Master',           tab_id: 'tab-clients',       icon: 'building-2',       sort_order: 2 },
  { id: 'MOD-03', key: 'team',          name: 'BD Team & Owners',        tab_id: 'tab-team',          icon: 'user-check',       sort_order: 3 },
  { id: 'MOD-04', key: 'segments',      name: 'Business Segments',       tab_id: 'tab-segments',      icon: 'layers',           sort_order: 4 },
  { id: 'MOD-05', key: 'opportunities', name: 'Leads & Opportunities',   tab_id: 'tab-opportunities', icon: 'git-branch',       sort_order: 5 },
  { id: 'MOD-06', key: 'activities',    name: 'Engagement & Interactions', tab_id: 'tab-activities',  icon: 'calendar',         sort_order: 6 },
  { id: 'MOD-07', key: 'followups',     name: 'Follow-up Tracker',       tab_id: 'tab-followups',     icon: 'clock',            sort_order: 7 },
  { id: 'MOD-08', key: 'internal',      name: 'Internal BD Activities',  tab_id: 'tab-internal',      icon: 'workflow',         sort_order: 8 },
  { id: 'MOD-09', key: 'review',        name: 'Monthly Management Review', tab_id: 'tab-review',      icon: 'presentation',     sort_order: 9 },
  { id: 'MOD-10', key: 'users',         name: 'Users & Permissions',     tab_id: 'tab-users',         icon: 'shield-check',     sort_order: 10 },
];

// ─── Default Roles ────────────────────────────────────────────────────────────

const ROLES = [
  { id: 'ROLE-01', name: 'Super Admin',           description: 'Full system access including user and permission management', data_scope: 'org',  is_system: 1 },
  { id: 'ROLE-02', name: 'Management',            description: 'Organisation-wide visibility and management access',          data_scope: 'org',  is_system: 1 },
  { id: 'ROLE-03', name: 'Department Head',       description: 'Department-level access and approval authority',             data_scope: 'dept', is_system: 0 },
  { id: 'ROLE-04', name: 'BD Manager',            description: 'Team-level CRM access with full pipeline view',              data_scope: 'team', is_system: 0 },
  { id: 'ROLE-05', name: 'BD Executive',          description: 'Assigned clients, opportunities and tasks',                  data_scope: 'own',  is_system: 0 },
  { id: 'ROLE-06', name: 'Team Member',           description: 'Assigned records and permitted modules',                     data_scope: 'own',  is_system: 0 },
  { id: 'ROLE-07', name: 'Management Viewer',     description: 'Read-only access to authorised modules',                    data_scope: 'org',  is_system: 0 },
];

// ─── Role Permission Matrix ───────────────────────────────────────────────────
// Format: { module_key: { view, create, edit, delete, export, assign, approve, admin } }

const ROLE_PERMISSIONS = {
  'ROLE-01': { // Super Admin — full access to everything
    dashboard:     { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    clients:       { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    team:          { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    segments:      { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    opportunities: { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    activities:    { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    followups:     { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    internal:      { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    review:        { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
    users:         { v:1, c:1, e:1, d:1, x:1, a:1, p:1, m:1 },
  },
  'ROLE-02': { // Management
    dashboard:     { v:1, c:0, e:0, d:0, x:1, a:0, p:1, m:0 },
    clients:       { v:1, c:1, e:1, d:0, x:1, a:1, p:1, m:0 },
    team:          { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    segments:      { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    opportunities: { v:1, c:1, e:1, d:0, x:1, a:1, p:1, m:0 },
    activities:    { v:1, c:1, e:1, d:0, x:1, a:1, p:1, m:0 },
    followups:     { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    internal:      { v:1, c:0, e:1, d:0, x:1, a:0, p:1, m:0 },
    review:        { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    users:         { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
  },
  'ROLE-03': { // Department Head
    dashboard:     { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    clients:       { v:1, c:1, e:1, d:0, x:1, a:1, p:0, m:0 },
    team:          { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    segments:      { v:1, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    opportunities: { v:1, c:1, e:1, d:0, x:1, a:1, p:1, m:0 },
    activities:    { v:1, c:1, e:1, d:0, x:1, a:0, p:0, m:0 },
    followups:     { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    internal:      { v:1, c:1, e:1, d:0, x:1, a:0, p:1, m:0 },
    review:        { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    users:         { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
  },
  'ROLE-04': { // BD Manager
    dashboard:     { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    clients:       { v:1, c:1, e:1, d:0, x:1, a:1, p:0, m:0 },
    team:          { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    segments:      { v:1, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    opportunities: { v:1, c:1, e:1, d:0, x:1, a:1, p:0, m:0 },
    activities:    { v:1, c:1, e:1, d:0, x:1, a:0, p:0, m:0 },
    followups:     { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    internal:      { v:1, c:1, e:1, d:0, x:1, a:0, p:0, m:0 },
    review:        { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    users:         { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
  },
  'ROLE-05': { // BD Executive
    dashboard:     { v:1, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    clients:       { v:1, c:1, e:1, d:0, x:1, a:0, p:0, m:0 },
    team:          { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    segments:      { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    opportunities: { v:1, c:1, e:1, d:0, x:1, a:0, p:0, m:0 },
    activities:    { v:1, c:1, e:1, d:0, x:1, a:0, p:0, m:0 },
    followups:     { v:1, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    internal:      { v:1, c:1, e:1, d:0, x:0, a:0, p:0, m:0 },
    review:        { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    users:         { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
  },
  'ROLE-06': { // Team Member
    dashboard:     { v:1, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    clients:       { v:1, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    team:          { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    segments:      { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    opportunities: { v:1, c:0, e:1, d:0, x:0, a:0, p:0, m:0 },
    activities:    { v:1, c:1, e:0, d:0, x:0, a:0, p:0, m:0 },
    followups:     { v:1, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    internal:      { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    review:        { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    users:         { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
  },
  'ROLE-07': { // Management Viewer
    dashboard:     { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    clients:       { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    team:          { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    segments:      { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    opportunities: { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    activities:    { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    followups:     { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    internal:      { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
    review:        { v:1, c:0, e:0, d:0, x:1, a:0, p:0, m:0 },
    users:         { v:0, c:0, e:0, d:0, x:0, a:0, p:0, m:0 },
  },
};

// ─── Demo Users ───────────────────────────────────────────────────────────────

async function buildDemoUsers() {
  const adminPwd = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2026';
  const adminHash = await bcrypt.hash(adminPwd, SALT_ROUNDS);
  const demoHash = await bcrypt.hash('Demo@2026', SALT_ROUNDS);

  return [
    {
      id: 'USR-001',
      user_id: 'devika.admin',
      employee_id: 'EMP-001',
      name: 'Devika Pangam',
      email: 'devika.p@rajmudragroup.com',
      department: 'Management',
      designation: 'System Administrator',
      role_id: 'ROLE-01',
      password_hash: adminHash,
      is_active: 1,
      force_password_change: 0,
      created_by: 'SYSTEM',
      segments: ['All'],
    },
    {
      id: 'USR-002',
      user_id: 'rahul.sharma',
      employee_id: 'EMP-002',
      name: 'Aditya Patil',
      email: 'aditya.patil@rajmudragroup.com',
      department: 'Business Development',
      designation: 'Senior BD Manager',
      role_id: 'ROLE-04',
      password_hash: demoHash,
      is_active: 1,
      force_password_change: 1,
      created_by: 'USR-001',
      segments: ['Employee Transportation', 'Corporate Travel', 'Fleet Management'],
    },
    {
      id: 'USR-003',
      user_id: 'ananya.verma',
      employee_id: 'EMP-003',
      name: 'Pooja Kulkarni',
      email: 'pooja.kulkarni@rajmudragroup.com',
      department: 'Business Development',
      designation: 'BD Lead - Enterprise',
      role_id: 'ROLE-05',
      password_hash: demoHash,
      is_active: 1,
      force_password_change: 1,
      created_by: 'USR-001',
      segments: ['Warehouse Logistics'],
    },
    {
      id: 'USR-004',
      user_id: 'vikram.malhotra',
      employee_id: 'EMP-004',
      name: 'Rajesh Patil',
      email: 'rajesh.patil@rajmudragroup.com',
      department: 'Business Development',
      designation: 'Key Accounts Director',
      role_id: 'ROLE-04',
      password_hash: demoHash,
      is_active: 1,
      force_password_change: 1,
      created_by: 'USR-001',
      segments: ['Cold Chain Logistics', 'Supply Chain Solutions'],
    },
    {
      id: 'USR-005',
      user_id: 'board.viewer',
      employee_id: 'EMP-005',
      name: 'Executive Board',
      email: 'board.review@corpbd.com',
      department: 'Management',
      designation: 'Executive Board Member',
      role_id: 'ROLE-07',
      password_hash: demoHash,
      is_active: 1,
      force_password_change: 0,
      created_by: 'USR-001',
      segments: ['All'],
    },
  ];
}

// ─── Seed Runner ──────────────────────────────────────────────────────────────

async function seed() {
  const database = db.getDb();

  console.log('🌱 Starting CRM database seed...\n');

  // 1. Modules
  console.log('📦 Seeding modules...');
  const insertModule = database.prepare(`
    INSERT OR IGNORE INTO modules (id, key, name, tab_id, icon, sort_order)
    VALUES (@id, @key, @name, @tab_id, @icon, @sort_order)
  `);
  MODULES.forEach(m => insertModule.run(m));
  console.log(`   ✓ ${MODULES.length} modules registered`);

  // 2. Roles
  console.log('👥 Seeding roles...');
  ROLES.forEach(r => {
    try { db.createRole(r); } catch (e) { /* already exists */ }
  });
  console.log(`   ✓ ${ROLES.length} roles created`);

  // 3. Role Permissions
  console.log('🔐 Seeding role permissions...');
  let permCount = 0;
  for (const [roleId, modulePerms] of Object.entries(ROLE_PERMISSIONS)) {
    for (const [moduleKey, p] of Object.entries(modulePerms)) {
      const module = MODULES.find(m => m.key === moduleKey);
      if (!module) continue;
      db.setRolePermissions(roleId, module.id, {
        can_view: p.v, can_create: p.c, can_edit: p.e, can_delete: p.d,
        can_export: p.x, can_assign: p.a, can_approve: p.p, can_admin: p.m
      });
      permCount++;
    }
  }
  console.log(`   ✓ ${permCount} role-module permissions configured`);

  // 4. Demo Users
  console.log('👤 Seeding demo users...');
  const demoUsers = await buildDemoUsers();
  for (const user of demoUsers) {
    const { segments, ...userData } = user;
    const existing = db.getUserById(userData.id);
    if (!existing) {
      db.createUser(userData);
      db.setUserSegments(userData.id, segments);
      console.log(`   ✓ Created user: ${userData.name} (${userData.user_id}) — role: ${userData.role_id}`);
    } else {
      console.log(`   ↷ Skipped (already exists): ${userData.name}`);
    }
  }

  console.log('\n✅ Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DEMO LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  User ID               Password         Role');
  console.log('  ─────────────────────────────────────────────────────');
  console.log('  devika.admin          Admin@2026       Super Admin');
  console.log('  rahul.sharma          Demo@2026        BD Manager');
  console.log('  ananya.verma          Demo@2026        BD Executive');
  console.log('  vikram.malhotra       Demo@2026        BD Manager');
  console.log('  board.viewer          Demo@2026        Management Viewer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ⚠  Change all passwords before going live!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
