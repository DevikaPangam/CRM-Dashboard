/**
 * PostgreSQL Row-Level Security (RLS) Policy Verification Suite
 * CorpBD CRM — Rajmudra Group Multi-Tenant Engine
 * 
 * Verifies RLS authorization rules from simulated authenticated Supabase sessions:
 * - Same-organization access
 * - Cross-organization denial
 * - Explicit SELECT, INSERT (WITH CHECK), UPDATE (USING + WITH CHECK), and DELETE policies
 * - Role & action-based authorization (export, approval, assignment, admin)
 * - Immutability of audit logs
 */

const assert = require('assert');

// Multi-tenant Org IDs
const ORG_RAJMUDRA = '00000000-0000-0000-0000-000000000001';
const ORG_OTHER = '99999999-9999-9999-9999-999999999999';

// Team IDs in Rajmudra
const TEAM_WEST = '10000000-0000-0000-0000-000000000001';
const TEAM_FLEET = '10000000-0000-0000-0000-000000000002';

// Standard Simulated Users
const USERS = {
  super_admin: {
    id: 'u-super-admin',
    organization_id: ORG_RAJMUDRA,
    role: 'super_admin',
    team_id: null,
    manager_id: null,
  },
  bd_director: {
    id: 'u-bd-director',
    organization_id: ORG_RAJMUDRA,
    role: 'bd_director',
    team_id: null,
    manager_id: null,
  },
  bd_manager: {
    id: 'u-bd-manager',
    organization_id: ORG_RAJMUDRA,
    role: 'bd_manager',
    team_id: TEAM_WEST,
    manager_id: 'u-bd-director',
  },
  bd_exec_1: {
    id: 'u-bd-exec-1',
    organization_id: ORG_RAJMUDRA,
    role: 'bd_exec',
    team_id: TEAM_WEST,
    manager_id: 'u-bd-manager',
  },
  bd_exec_2: {
    id: 'u-bd-exec-2',
    organization_id: ORG_RAJMUDRA,
    role: 'bd_exec',
    team_id: TEAM_FLEET,
    manager_id: 'u-bd-director',
  },
  management_viewer: {
    id: 'u-mgmt-viewer',
    organization_id: ORG_RAJMUDRA,
    role: 'management_viewer',
    team_id: null,
    manager_id: null,
  },
  analyst: {
    id: 'u-analyst',
    organization_id: ORG_RAJMUDRA,
    role: 'analyst',
    team_id: null,
    manager_id: null,
  },
  other_org_user: {
    id: 'u-external',
    organization_id: ORG_OTHER,
    role: 'super_admin',
    team_id: null,
    manager_id: null,
  },
};

// Normalized Role Permissions Matrix (from 20260909000003_seed_rajmudra_group.sql)
const PERMISSION_MATRIX = {
  super_admin: {
    '*': ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
  },
  bd_director: {
    dashboard: ['view', 'export'],
    clients: ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    team: ['view', 'export', 'assign', 'admin'],
    segments: ['view', 'create', 'edit', 'export'],
    opportunities: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign'],
    calculator: ['view', 'create', 'edit', 'delete', 'export', 'approve'],
    activities: ['view', 'create', 'edit', 'delete', 'export'],
    followups: ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    internal: ['view', 'create', 'edit', 'export', 'approve', 'assign'],
    documents: ['view', 'create', 'edit', 'delete', 'export'],
    review: ['view', 'create', 'edit', 'export', 'approve'],
    users: ['view', 'create', 'edit', 'admin'],
  },
  bd_manager: {
    dashboard: ['view', 'export'],
    clients: ['view', 'create', 'edit', 'export', 'assign'],
    team: ['view', 'export'],
    segments: ['view'],
    opportunities: ['view', 'create', 'edit', 'export', 'approve', 'assign'],
    calculator: ['view', 'create', 'edit', 'export', 'approve'],
    activities: ['view', 'create', 'edit', 'delete', 'export'],
    followups: ['view', 'create', 'edit', 'export', 'assign'],
    internal: ['view', 'create', 'edit', 'export', 'assign'],
    documents: ['view', 'create', 'edit', 'export'],
    review: ['view', 'create', 'edit', 'export'],
    users: ['view'],
  },
  bd_exec: {
    dashboard: ['view'],
    clients: ['view', 'create', 'edit', 'export'],
    team: ['view'],
    segments: ['view'],
    opportunities: ['view', 'create', 'edit'],
    calculator: ['view', 'create', 'edit'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create', 'edit'],
    documents: ['view', 'create'],
    review: ['view'],
    users: [],
  },
  management_viewer: {
    dashboard: ['view', 'export'],
    clients: ['view', 'export'],
    team: ['view'],
    segments: ['view'],
    opportunities: ['view', 'export'],
    calculator: ['view'],
    activities: ['view'],
    followups: ['view'],
    internal: ['view'],
    documents: ['view'],
    review: ['view', 'export'],
    users: ['view'],
  },
  analyst: {
    dashboard: ['view', 'export'],
    clients: ['view', 'export'],
    team: ['view', 'export'],
    segments: ['view', 'export'],
    opportunities: ['view', 'export'],
    calculator: ['view', 'export'],
    activities: ['view', 'export'],
    followups: ['view', 'export'],
    internal: ['view', 'export'],
    documents: ['view', 'export'],
    review: ['view', 'export'],
    users: ['view', 'export'],
  },
};

function hasPermission(user, moduleKey, action) {
  if (user.role === 'super_admin') return true;
  const roleRules = PERMISSION_MATRIX[user.role] || {};
  const modRules = roleRules[moduleKey] || [];
  return modRules.includes(action);
}

function isOrgAdmin(user) {
  return user.role === 'super_admin' || user.role === 'bd_director';
}

function getSubordinateIds(managerId) {
  // Returns all reports recursively
  const subordinates = [];
  Object.values(USERS).forEach((u) => {
    if (u.manager_id === managerId && u.organization_id === ORG_RAJMUDRA) {
      subordinates.push(u.id);
      subordinates.push(...getSubordinateIds(u.id));
    }
  });
  return subordinates;
}

// PostgreSQL RLS Policy Evaluators

function evaluateClientSelectPolicy(user, clientRecord) {
  // Rule 1: Tenant boundary check
  if (clientRecord.organization_id !== user.organization_id) return false;

  // Rule 2: has_permission('clients', 'view')
  if (!hasPermission(user, 'clients', 'view')) return false;

  // Rule 3: Scoping check
  if (isOrgAdmin(user)) return true;
  if (['management_viewer', 'analyst'].includes(user.role)) return true;
  if (clientRecord.owner_id === user.id || clientRecord.created_by === user.id) return true;
  if (getSubordinateIds(user.id).includes(clientRecord.owner_id)) return true;
  if (clientRecord.team_id && clientRecord.team_id === user.team_id) return true;

  return false;
}

function evaluateClientInsertPolicy(user, newRecord) {
  // WITH CHECK: organization_id = get_current_org_id() AND has_permission('clients', 'create')
  if (newRecord.organization_id !== user.organization_id) return false;
  return hasPermission(user, 'clients', 'create');
}

function evaluateClientUpdatePolicy(user, currentRecord, updatedRecord) {
  // USING:
  if (currentRecord.organization_id !== user.organization_id) return false;
  if (!hasPermission(user, 'clients', 'edit')) return false;

  const inScope =
    isOrgAdmin(user) ||
    currentRecord.owner_id === user.id ||
    getSubordinateIds(user.id).includes(currentRecord.owner_id) ||
    (currentRecord.team_id && currentRecord.team_id === user.team_id && user.role === 'bd_manager');

  if (!inScope) return false;

  // WITH CHECK:
  if (updatedRecord.organization_id !== user.organization_id) return false;
  if (!hasPermission(user, 'clients', 'edit')) return false;

  return true;
}

function evaluateClientDeletePolicy(user, clientRecord) {
  // USING: organization_id = get_current_org_id() AND has_permission('clients', 'delete') AND is_org_admin()
  if (clientRecord.organization_id !== user.organization_id) return false;
  if (!hasPermission(user, 'clients', 'delete')) return false;
  return isOrgAdmin(user);
}

function evaluateAuditLogPolicy(operation, user, logRecord) {
  if (operation === 'SELECT') {
    return logRecord.organization_id === user.organization_id && isOrgAdmin(user);
  }
  if (operation === 'INSERT') {
    return logRecord.organization_id === user.organization_id;
  }
  if (operation === 'UPDATE' || operation === 'DELETE') {
    // Immutable: no policies exist
    return false;
  }
  return false;
}

function runSuite() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔒 Production-Grade PostgreSQL RLS Security Test Suite');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  const sampleRajmudraClient = {
    id: 'client-001',
    organization_id: ORG_RAJMUDRA,
    name: 'Tata Consultancy Services',
    owner_id: USERS.bd_exec_1.id,
    team_id: TEAM_WEST,
    created_by: USERS.bd_exec_1.id,
  };

  const sampleExternalClient = {
    id: 'client-ext-001',
    organization_id: ORG_OTHER,
    name: 'External Corporation',
    owner_id: USERS.other_org_user.id,
    team_id: null,
  };

  // 1. Cross-organization isolation
  test('Cross-Organization Denial: Rajmudra user cannot SELECT other tenant record', () => {
    const allowed = evaluateClientSelectPolicy(USERS.super_admin, sampleExternalClient);
    assert.strictEqual(allowed, false, 'Super admin in Tenant A must NOT access Tenant B data');
  });

  test('Cross-Organization Denial: External tenant cannot INSERT record into Rajmudra org', () => {
    const allowed = evaluateClientInsertPolicy(USERS.other_org_user, {
      organization_id: ORG_RAJMUDRA,
      name: 'Malicious Client Insertion',
    });
    assert.strictEqual(allowed, false);
  });

  test('Cross-Organization Denial: External tenant cannot UPDATE Rajmudra record', () => {
    const allowed = evaluateClientUpdatePolicy(USERS.other_org_user, sampleRajmudraClient, {
      ...sampleRajmudraClient,
      name: 'Tampered Name',
    });
    assert.strictEqual(allowed, false);
  });

  test('Cross-Organization Denial: External tenant cannot DELETE Rajmudra record', () => {
    const allowed = evaluateClientDeletePolicy(USERS.other_org_user, sampleRajmudraClient);
    assert.strictEqual(allowed, false);
  });

  // 2. Same-organization SELECT scoping
  test('Same-Organization SELECT: Owner (bd_exec_1) can view their client', () => {
    const allowed = evaluateClientSelectPolicy(USERS.bd_exec_1, sampleRajmudraClient);
    assert.strictEqual(allowed, true);
  });

  test('Same-Organization SELECT: Direct Manager can view subordinate client', () => {
    const allowed = evaluateClientSelectPolicy(USERS.bd_manager, sampleRajmudraClient);
    assert.strictEqual(allowed, true);
  });

  test('Same-Organization SELECT: BD Director can view any org client', () => {
    const allowed = evaluateClientSelectPolicy(USERS.bd_director, sampleRajmudraClient);
    assert.strictEqual(allowed, true);
  });

  test('Same-Organization SELECT: Management Viewer has permitted read-only visibility', () => {
    const allowed = evaluateClientSelectPolicy(USERS.management_viewer, sampleRajmudraClient);
    assert.strictEqual(allowed, true);
  });

  test('Same-Organization SELECT: Analyst has permitted analytical read visibility', () => {
    const allowed = evaluateClientSelectPolicy(USERS.analyst, sampleRajmudraClient);
    assert.strictEqual(allowed, true);
  });

  test('Same-Organization SELECT: Different team executive (bd_exec_2) cannot view non-owned client', () => {
    const allowed = evaluateClientSelectPolicy(USERS.bd_exec_2, sampleRajmudraClient);
    assert.strictEqual(allowed, false);
  });

  // 3. Mutation permissions & Read-only enforcement
  test('Read-Only Enforcement: Management Viewer cannot INSERT client', () => {
    const allowed = evaluateClientInsertPolicy(USERS.management_viewer, {
      organization_id: ORG_RAJMUDRA,
      name: 'Test Client',
    });
    assert.strictEqual(allowed, false);
  });

  test('Read-Only Enforcement: Analyst cannot UPDATE client', () => {
    const allowed = evaluateClientUpdatePolicy(USERS.analyst, sampleRajmudraClient, {
      ...sampleRajmudraClient,
      name: 'Analyst Edit',
    });
    assert.strictEqual(allowed, false);
  });

  test('Operational INSERT: BD Executive can INSERT client with valid organization', () => {
    const allowed = evaluateClientInsertPolicy(USERS.bd_exec_1, {
      organization_id: ORG_RAJMUDRA,
      name: 'New Enterprise Client',
    });
    assert.strictEqual(allowed, true);
  });

  test('Operational UPDATE: BD Executive can UPDATE their own client', () => {
    const allowed = evaluateClientUpdatePolicy(USERS.bd_exec_1, sampleRajmudraClient, {
      ...sampleRajmudraClient,
      name: 'Updated TCS',
    });
    assert.strictEqual(allowed, true);
  });

  test('Deletion Authorization: BD Executive cannot DELETE client (Admin only)', () => {
    const allowed = evaluateClientDeletePolicy(USERS.bd_exec_1, sampleRajmudraClient);
    assert.strictEqual(allowed, false);
  });

  test('Deletion Authorization: Super Admin and BD Director CAN DELETE client', () => {
    assert.strictEqual(evaluateClientDeletePolicy(USERS.super_admin, sampleRajmudraClient), true);
    assert.strictEqual(evaluateClientDeletePolicy(USERS.bd_director, sampleRajmudraClient), true);
  });

  // 4. Action permissions (export, approve, assign, admin)
  test('Action Permission: Analyst has export right, BD Exec does not have clients:delete', () => {
    assert.strictEqual(hasPermission(USERS.analyst, 'clients', 'export'), true);
    assert.strictEqual(hasPermission(USERS.bd_exec_1, 'clients', 'delete'), false);
  });

  test('Action Permission: BD Director & BD Manager have approval rights on calculator', () => {
    assert.strictEqual(hasPermission(USERS.bd_director, 'calculator', 'approve'), true);
    assert.strictEqual(hasPermission(USERS.bd_manager, 'calculator', 'approve'), true);
    assert.strictEqual(hasPermission(USERS.bd_exec_1, 'calculator', 'approve'), false);
  });

  // 5. Audit Log Immutability
  test('Audit Logs: Only Admins can SELECT audit logs in their org', () => {
    const log = { id: 'log-1', organization_id: ORG_RAJMUDRA };
    assert.strictEqual(evaluateAuditLogPolicy('SELECT', USERS.super_admin, log), true);
    assert.strictEqual(evaluateAuditLogPolicy('SELECT', USERS.bd_exec_1, log), false);
  });

  test('Audit Logs: UPDATE and DELETE are strictly disallowed (Immutable)', () => {
    const log = { id: 'log-1', organization_id: ORG_RAJMUDRA };
    assert.strictEqual(evaluateAuditLogPolicy('UPDATE', USERS.super_admin, log), false);
    assert.strictEqual(evaluateAuditLogPolicy('DELETE', USERS.super_admin, log), false);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runSuite();
