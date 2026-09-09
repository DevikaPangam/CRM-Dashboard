/**
 * Automated Security & Business Logic Verification Test Suite
 * CorpBD CRM — Administrator User Provisioning & Lifecycle Management
 */

const assert = require('assert');

// Corporate domain validation logic
function isValidCorporateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@rajmudragroup\.com$/;
  return emailRegex.test(trimmed);
}

const VALID_ROLES = [
  'super_admin',
  'bd_director',
  'bd_manager',
  'bd_sr_exec',
  'bd_exec',
  'management_viewer',
  'analyst',
];

const VALID_STATUSES = ['active', 'inactive', 'suspended', 'pending_invite'];

function validateProvisioningRequest(caller, payload) {
  const { full_name, email, role, team_id, manager_id, organization_id, status } = payload;

  if (!full_name || !full_name.trim()) {
    return { valid: false, status: 400, error: 'Full Name is required.' };
  }

  if (!email || !email.trim()) {
    return { valid: false, status: 400, error: 'Work Email is required.' };
  }

  if (!isValidCorporateEmail(email)) {
    return { valid: false, status: 400, error: 'Corporate email must end with @rajmudragroup.com' };
  }

  if (!VALID_ROLES.includes(role)) {
    return { valid: false, status: 400, error: 'Invalid role specified.' };
  }

  if (role === 'super_admin' && caller.role !== 'super_admin') {
    return { valid: false, status: 403, error: 'Security Policy: Only a Super Administrator can assign super_admin role.' };
  }

  if (organization_id && organization_id !== caller.organization_id && caller.role !== 'super_admin') {
    return { valid: false, status: 403, error: 'Forbidden: You cannot create users for other organizations.' };
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return { valid: false, status: 400, error: 'Invalid status specified.' };
  }

  return { valid: true };
}

function validateUpdateRequest(caller, targetUser, updates) {
  if (targetUser.id === caller.id && updates.role && updates.role !== caller.role) {
    return { valid: false, status: 403, error: 'Security Policy: You cannot modify your own role.' };
  }

  if (updates.role === 'super_admin' && caller.role !== 'super_admin') {
    return { valid: false, status: 403, error: 'Security Policy: Only a Super Administrator can assign super_admin role.' };
  }

  if (targetUser.organization_id !== caller.organization_id && caller.role !== 'super_admin') {
    return { valid: false, status: 403, error: 'Forbidden: You cannot modify users from other organizations.' };
  }

  return { valid: true };
}

function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🧪 Running Admin User Provisioning & Security Test Suite');
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

  const superAdminCaller = {
    id: 'user-001',
    role: 'super_admin',
    organization_id: 'org-rajmudra',
    email: 'admin@rajmudragroup.com',
  };

  const bdDirectorCaller = {
    id: 'user-002',
    role: 'bd_director',
    organization_id: 'org-rajmudra',
    email: 'vikram.s@rajmudragroup.com',
  };

  // Test 1: Valid corporate email accepted
  test('Accept valid corporate email ending with @rajmudragroup.com', () => {
    const res = validateProvisioningRequest(superAdminCaller, {
      full_name: 'Anand Shinde',
      email: 'anand.shinde@rajmudragroup.com',
      role: 'bd_exec',
      organization_id: 'org-rajmudra',
      status: 'active',
    });
    assert.strictEqual(res.valid, true);
  });

  // Test 2: Reject personal domains
  test('Reject personal Gmail / Yahoo / Outlook emails', () => {
    const emails = ['anand@gmail.com', 'anand@yahoo.com', 'anand@outlook.com', 'anand@zoho.com'];
    for (const email of emails) {
      const res = validateProvisioningRequest(superAdminCaller, {
        full_name: 'Anand Shinde',
        email,
        role: 'bd_exec',
        organization_id: 'org-rajmudra',
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 400);
    }
  });

  // Test 3: Anti-escalation - bd_director cannot create super_admin
  test('Prevent non-super_admin from provisioning a super_admin user', () => {
    const res = validateProvisioningRequest(bdDirectorCaller, {
      full_name: 'Hacker User',
      email: 'hacker@rajmudragroup.com',
      role: 'super_admin',
      organization_id: 'org-rajmudra',
    });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 403);
  });

  // Test 4: Super_admin CAN provision super_admin
  test('Allow super_admin to provision another super_admin', () => {
    const res = validateProvisioningRequest(superAdminCaller, {
      full_name: 'Co-Admin User',
      email: 'coadmin@rajmudragroup.com',
      role: 'super_admin',
      organization_id: 'org-rajmudra',
    });
    assert.strictEqual(res.valid, true);
  });

  // Test 5: Self-escalation prevention on update
  test('Prevent administrator from elevating their own role', () => {
    const res = validateUpdateRequest(bdDirectorCaller, bdDirectorCaller, {
      role: 'super_admin',
    });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 403);
  });

  // Test 6: Cross-organization update isolation
  test('Prevent modifying users belonging to another organization', () => {
    const externalUser = {
      id: 'ext-001',
      organization_id: 'org-other-tenant',
      role: 'bd_exec',
    };
    const res = validateUpdateRequest(bdDirectorCaller, externalUser, {
      department: 'Marketing',
    });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 403);
  });

  // Test 7: Controlled deactivation / revocation without destructive deletion
  test('Controlled deactivation updates status without data loss', () => {
    const targetUser = {
      id: 'target-001',
      organization_id: 'org-rajmudra',
      role: 'bd_exec',
      status: 'active',
    };
    const res = validateUpdateRequest(superAdminCaller, targetUser, {
      status: 'suspended',
    });
    assert.strictEqual(res.valid, true);
  });

  // Test 8: All 7 valid roles accepted
  test('Accept all 7 standard CRM roles for super_admin provisioning', () => {
    for (const role of VALID_ROLES) {
      const res = validateProvisioningRequest(superAdminCaller, {
        full_name: 'Test Role User',
        email: `test.${role}@rajmudragroup.com`,
        role,
        organization_id: 'org-rajmudra',
      });
      assert.strictEqual(res.valid, true);
    }
  });

  // Test 9: Reject invalid / hallucinated roles
  test('Reject invalid roles (e.g. root, manager, administrator)', () => {
    const invalidRoles = ['root', 'admin', 'sales_rep', 'god_mode'];
    for (const role of invalidRoles) {
      const res = validateProvisioningRequest(superAdminCaller, {
        full_name: 'Test Role User',
        email: 'test.invalid@rajmudragroup.com',
        role,
        organization_id: 'org-rajmudra',
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 400);
    }
  });

  // Test 10: Status check constraints
  test('Accept valid statuses (active, inactive, suspended, pending_invite)', () => {
    for (const status of VALID_STATUSES) {
      const res = validateProvisioningRequest(superAdminCaller, {
        full_name: 'Test User',
        email: 'status.test@rajmudragroup.com',
        role: 'bd_exec',
        organization_id: 'org-rajmudra',
        status,
      });
      assert.strictEqual(res.valid, true);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
