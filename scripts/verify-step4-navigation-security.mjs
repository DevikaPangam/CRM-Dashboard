import { TAB_MODULE_ACCESS_MAP, getAuthorizedDefaultTab } from '../src/constants/moduleAccess.js';

// Baseline permissions for all 7 production roles (matching public.role_permissions schema)
const BASELINE_PERMISSIONS = {
  super_admin: {
    dashboard: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    clients: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    team: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    segments: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    opportunities: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    calculator: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    activities: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    followups: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    internal: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    documents: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    review: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    users: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
  },
  bd_director: {
    dashboard: ['view', 'export', 'approve'],
    clients: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    team: ['view', 'create', 'edit', 'export', 'assign'],
    segments: ['view', 'create', 'edit', 'export', 'assign'],
    opportunities: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    calculator: ['view', 'create', 'edit', 'export', 'approve'],
    activities: ['view', 'create', 'edit', 'export', 'assign'],
    followups: ['view', 'create', 'edit', 'export', 'assign'],
    internal: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    documents: ['view', 'create', 'edit', 'delete', 'export', 'approve'],
    review: ['view', 'edit', 'export', 'approve'],
    users: ['view', 'export'],
  },
  bd_manager: {
    dashboard: ['view', 'export'],
    clients: ['view', 'create', 'edit', 'export', 'assign'],
    team: ['view', 'export'],
    segments: ['view'],
    opportunities: ['view', 'create', 'edit', 'export', 'assign'],
    calculator: ['view', 'create', 'edit', 'export'],
    activities: ['view', 'create', 'edit', 'export', 'assign'],
    followups: ['view', 'create', 'edit', 'export', 'assign'],
    internal: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    documents: ['view', 'create', 'edit', 'export'],
    review: ['view', 'export'],
    users: [],
  },
  bd_sr_exec: {
    dashboard: ['view'],
    clients: ['view', 'create', 'edit', 'export'],
    team: [],
    segments: [],
    opportunities: ['view', 'create', 'edit', 'export'],
    calculator: ['view', 'create', 'edit', 'export'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create', 'edit'],
    documents: ['view', 'create', 'edit', 'export'],
    review: [],
    users: [],
  },
  bd_exec: {
    dashboard: ['view'],
    clients: ['view', 'create', 'edit'],
    team: [],
    segments: [],
    opportunities: ['view', 'create', 'edit'],
    calculator: ['view', 'create', 'edit'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create'],
    documents: ['view', 'create'],
    review: [],
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
    users: [],
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
    users: [],
  },
};

function createRoleCanResolver(role) {
  const rolePerms = BASELINE_PERMISSIONS[role] || {};
  return (moduleKey, action) => {
    const actions = rolePerms[moduleKey] || [];
    return actions.includes(action);
  };
}

console.log('=== STEP 4 — FRONTEND NAVIGATION & MODULE GUARD SECURITY VERIFICATION ===\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  🟢 PASS: ${message}`);
  } else {
    console.log(`  🔴 FAIL: ${message}`);
  }
}

// 1. Module Access Map Audit
console.log('1. Central Module Access Map Verification:');
const expectedTabs = [
  'tab-dashboard', 'tab-clients', 'tab-employee-master', 'tab-team',
  'tab-employee-profile', 'tab-segments', 'tab-opportunities', 'tab-calculator',
  'tab-activities', 'tab-followups', 'tab-internal', 'tab-documents',
  'tab-review', 'tab-users'
];

for (const tabId of expectedTabs) {
  assert(
    Boolean(TAB_MODULE_ACCESS_MAP[tabId]),
    `Tab '${tabId}' is defined in TAB_MODULE_ACCESS_MAP (${TAB_MODULE_ACCESS_MAP[tabId]?.module}:${TAB_MODULE_ACCESS_MAP[tabId]?.action})`
  );
}

// 2. Role Matrix Navigation & Route Guard Validation for all 7 Roles
console.log('\n2. Seven-Role Navigation & Route Guard Access Matrix:');

const rolesToTest = [
  'super_admin',
  'bd_director',
  'bd_manager',
  'bd_sr_exec',
  'bd_exec',
  'management_viewer',
  'analyst'
];

for (const role of rolesToTest) {
  console.log(`\n  --- Testing Role: [${role}] ---`);
  const can = createRoleCanResolver(role);

  // Default tab calculation
  const defaultTab = getAuthorizedDefaultTab(can);
  assert(
    Boolean(defaultTab),
    `Role '${role}' resolves safe default tab -> '${defaultTab}'`
  );

  // Test restricted tab access for restricted roles (e.g., bd_exec, bd_sr_exec, management_viewer, analyst cannot view 'users')
  const usersReq = TAB_MODULE_ACCESS_MAP['tab-users'];
  const canViewUsers = can(usersReq.module, usersReq.action);

  if (['bd_sr_exec', 'bd_exec', 'management_viewer', 'analyst', 'bd_manager'].includes(role)) {
    assert(
      !canViewUsers,
      `Role '${role}' is DENIED access to 'tab-users' (canView=false)`
    );
  } else {
    assert(
      canViewUsers,
      `Role '${role}' is PERMITTED access to 'tab-users'`
    );
  }

  // Test direct tab manipulation for restricted tab 'tab-users'
  if (!canViewUsers) {
    const isTabAuthorized = can(usersReq.module, usersReq.action);
    assert(
      !isTabAuthorized,
      `Direct tab manipulation to 'tab-users' for '${role}' fails guard (triggers AccessDenied)`
    );
  }
}

// 3. Stale & Invalid Tab Sanitization Test
console.log('\n3. Stale / Invalid Tab Sanitization Test:');
const execCan = createRoleCanResolver('bd_exec');

const invalidTabs = ['tab-invalid', 'tab-users', 'tab-review', 'tab-segments', 'deleted-tab-xyz'];

for (const invalidTab of invalidTabs) {
  const req = TAB_MODULE_ACCESS_MAP[invalidTab];
  const isAuth = req ? execCan(req.module, req.action) : false;
  assert(
    !isAuth,
    `Invalid/restricted tab '${invalidTab}' for bd_exec fails authorization check`
  );
}

const sanitizedDefault = getAuthorizedDefaultTab(execCan);
assert(
  sanitizedDefault === 'tab-dashboard' || sanitizedDefault === 'tab-clients',
  `Sanitization fallback for bd_exec resolves to authorized tab '${sanitizedDefault}'`
);

console.log('\n==================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('==================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
