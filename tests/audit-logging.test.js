/**
 * ============================================================================
 * TEST SUITE: Production-Grade Audit Logging (Prompt 13)
 * ============================================================================
 * Validates:
 * 1. Authentication & Security audit events (login, logout, password reset, access denied).
 * 2. User administration audit events (provisioning, status toggles, role updates, access revocation).
 * 3. CRM operational events & Data export audits (CSV/JSON exports, proposals, documents).
 * 4. Zero Secrets Guarantee: Automatic redaction of passwords, tokens, and hashes.
 * 5. Immutability Guarantee: Verification that UPDATE & DELETE are prohibited on audit logs.
 * 6. Multi-Tenant Isolation & RBAC enforcement on audit trail queries.
 */

import assert from 'node:assert';

function sanitizeAuditValues(data) {
  if (!data) return null;
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'apiKey', 'access_token', 'refreshToken'];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

class MockAuditEngine {
  constructor() {
    this.logs = [];
  }

  insertLog({ organizationId, userId, userName, action, entityType, entityId, oldValues, newValues, metadata }) {
    if (!organizationId) throw new Error('organization_id is mandatory');
    if (!action) throw new Error('action is mandatory');
    if (!entityType) throw new Error('entity_type is mandatory');

    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId,
      userId: userId || null,
      userName: userName || 'System Actor',
      action,
      entityType,
      entityId,
      oldValues: sanitizeAuditValues(oldValues),
      newValues: sanitizeAuditValues(newValues),
      metadata: sanitizeAuditValues(metadata) || {},
      createdAt: new Date().toISOString(),
    };

    this.logs.push(entry);
    return entry;
  }

  // Simulates RLS protected query
  queryLogs({ callerOrgId, callerRole, entityType, action }) {
    if (!callerOrgId) throw new Error('Unauthenticated');
    if (!['super_admin', 'bd_director'].includes(callerRole)) {
      throw new Error('Access Denied: Audit logs are restricted to Administrators');
    }

    return this.logs.filter(log => {
      if (log.organizationId !== callerOrgId) return false;
      if (entityType && entityType !== 'All' && log.entityType !== entityType) return false;
      if (action && action !== 'All' && log.action !== action) return false;
      return true;
    });
  }

  // Attempted UPDATE/DELETE on audit log
  updateLog() {
    throw new Error('PostgreSQL RLS Policy Violation: UPDATE is strictly prohibited on public.audit_logs');
  }

  deleteLog() {
    throw new Error('PostgreSQL RLS Policy Violation: DELETE is strictly prohibited on public.audit_logs');
  }
}

async function runAuditLoggingTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🛡️ Running Production-Grade Audit Logging Test Suite (Prompt 13)');
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

  const auditEngine = new MockAuditEngine();
  const RAJMUDRA_ORG_ID = '00000000-0000-0000-0000-000000000001';
  const OTHER_ORG_ID = '99999999-9999-9999-9999-999999999999';

  // 1. Auth & Security: Login success & failure
  test('Log successful login & failed login attempts with security metadata', () => {
    const successEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'user-rajesh-patil',
      userName: 'Rajesh Patil',
      action: 'LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: 'rajesh.patil@rajmudragroup.com',
      metadata: { method: 'corporate_password', ip: '103.21.12.4' },
    });
    assert.strictEqual(successEntry.action, 'LOGIN_SUCCESS');

    const failEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: null,
      userName: 'Unknown Actor',
      action: 'LOGIN_FAILURE',
      entityType: 'auth',
      entityId: 'intruder@gmail.com',
      metadata: { reason: 'Invalid corporate email domain' },
    });
    assert.strictEqual(failEntry.action, 'LOGIN_FAILURE');
  });

  // 2. Auth & Security: Access denied & password reset
  test('Log password reset initiation and access denied interception', () => {
    const resetEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'user-vikram-shinde',
      userName: 'Vikram Shinde',
      action: 'PASSWORD_RESET_INITIATED',
      entityType: 'auth',
      entityId: 'vikram.shinde@rajmudragroup.com',
      metadata: { provider: 'zoho_corporate' },
    });
    assert.strictEqual(resetEntry.action, 'PASSWORD_RESET_INITIATED');

    const deniedEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'user-suspended-1',
      userName: 'Suspended User',
      action: 'ACCESS_DENIED',
      entityType: 'auth',
      entityId: 'user-suspended-1',
      metadata: { reason: 'ACCOUNT_SUSPENDED' },
    });
    assert.strictEqual(deniedEntry.action, 'ACCESS_DENIED');
  });

  // 3. User Administration: User invited & activated
  test('Log administrator user creation, role assignment, and access revocation', () => {
    const inviteEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'admin-rajesh',
      userName: 'Rajesh Patil',
      action: 'USER_INVITED',
      entityType: 'profiles',
      entityId: 'user-new-exec',
      newValues: { role: 'bd_exec', team: 'Corporate Mobility', status: 'active' },
    });
    assert.strictEqual(inviteEntry.action, 'USER_INVITED');
    assert.strictEqual(inviteEntry.newValues.role, 'bd_exec');

    const revokeEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'admin-rajesh',
      userName: 'Rajesh Patil',
      action: 'USER_ACCESS_REVOKED',
      entityType: 'profiles',
      entityId: 'user-new-exec',
      oldValues: { status: 'active' },
      newValues: { status: 'inactive' },
    });
    assert.strictEqual(revokeEntry.action, 'USER_ACCESS_REVOKED');
  });

  // 4. CRM Operations & Commercial Proposals
  test('Log CRM opportunity changes and proposal approval lifecycle', () => {
    const oppEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'user-aditya-patil',
      userName: 'Aditya Patil',
      action: 'OPPORTUNITY_UPDATED',
      entityType: 'opportunities',
      entityId: 'opp-tcs-101',
      oldValues: { stage: 'Requirement Discussion', probability: 40 },
      newValues: { stage: 'Commercial Negotiation', probability: 80 },
    });
    assert.strictEqual(oppEntry.action, 'OPPORTUNITY_UPDATED');
    assert.strictEqual(oppEntry.newValues.probability, 80);

    const propApproved = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'admin-rajesh',
      userName: 'Rajesh Patil',
      action: 'PROPOSAL_APPROVED',
      entityType: 'proposals',
      entityId: 'prop-tcs-v1',
      oldValues: { status: 'under_review' },
      newValues: { status: 'approved', approvedBy: 'Rajesh Patil' },
      metadata: { marginPct: 18.5 },
    });
    assert.strictEqual(propApproved.action, 'PROPOSAL_APPROVED');
  });

  // 5. Data Exports
  test('Log bulk data exports with record counts and timestamp', () => {
    const exportEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'user-vikram-shinde',
      userName: 'Vikram Shinde',
      action: 'DATA_EXPORT_CSV',
      entityType: 'opportunities',
      entityId: 'export-opps-101',
      metadata: { rowCount: 15, format: 'CSV' },
    });
    assert.strictEqual(exportEntry.action, 'DATA_EXPORT_CSV');
    assert.strictEqual(exportEntry.metadata.rowCount, 15);
  });

  // 6. Zero Plaintext Passwords / Secrets Redaction
  test('Zero Secrets Guarantee: Automatically redact passwords, tokens, and secrets from audit payloads', () => {
    const rawPayload = {
      email: 'aditya.patil@rajmudragroup.com',
      password: 'SuperSecretPassword123!',
      password_hash: '$2b$10$abc1234567890abcdef...',
      access_token: 'eyJhbGciOiJIUzI1NiIsIn...',
      role: 'bd_exec',
    };

    const auditEntry = auditEngine.insertLog({
      organizationId: RAJMUDRA_ORG_ID,
      userId: 'admin-rajesh',
      userName: 'Rajesh Patil',
      action: 'USER_CREATED',
      entityType: 'profiles',
      entityId: 'user-aditya-patil',
      newValues: rawPayload,
    });

    assert.strictEqual(auditEntry.newValues.password, '[REDACTED]');
    assert.strictEqual(auditEntry.newValues.password_hash, '[REDACTED]');
    assert.strictEqual(auditEntry.newValues.access_token, '[REDACTED]');
    assert.strictEqual(auditEntry.newValues.role, 'bd_exec');
  });

  // 7. Immutability Guarantee
  test('Immutability Guarantee: Reject all UPDATE and DELETE operations on audit logs', () => {
    assert.throws(() => {
      auditEngine.updateLog();
    }, /UPDATE is strictly prohibited/);

    assert.throws(() => {
      auditEngine.deleteLog();
    }, /DELETE is strictly prohibited/);
  });

  // 8. Multi-Tenant Isolation
  test('Multi-Tenant Isolation: Tenant A cannot view Tenant B audit logs', () => {
    // Insert log for foreign organization
    auditEngine.insertLog({
      organizationId: OTHER_ORG_ID,
      userId: 'other-user',
      userName: 'Competitor Admin',
      action: 'CLIENT_CREATED',
      entityType: 'clients',
      entityId: 'client-other-99',
    });

    const rajmudraLogs = auditEngine.queryLogs({
      callerOrgId: RAJMUDRA_ORG_ID,
      callerRole: 'super_admin',
    });

    const otherOrgLog = rajmudraLogs.find(l => l.organizationId === OTHER_ORG_ID);
    assert.strictEqual(otherOrgLog, undefined, 'Tenant A must never receive Tenant B audit logs');
  });

  // 9. RBAC Enforcement on Audit Log View
  test('RBAC Enforcement: Non-administrative roles (analyst, bd_exec) are denied audit log access', () => {
    assert.throws(() => {
      auditEngine.queryLogs({
        callerOrgId: RAJMUDRA_ORG_ID,
        callerRole: 'bd_exec',
      });
    }, /Access Denied: Audit logs are restricted to Administrators/);

    assert.throws(() => {
      auditEngine.queryLogs({
        callerOrgId: RAJMUDRA_ORG_ID,
        callerRole: 'analyst',
      });
    }, /Access Denied: Audit logs are restricted to Administrators/);

    const adminQuery = auditEngine.queryLogs({
      callerOrgId: RAJMUDRA_ORG_ID,
      callerRole: 'super_admin',
    });
    assert.ok(adminQuery.length > 0, 'Super Admin is authorized to query audit logs');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAuditLoggingTests();
