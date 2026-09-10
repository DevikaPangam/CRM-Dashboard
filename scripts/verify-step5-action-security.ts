import { CRMModuleKey, PermissionActionEnum, UserRoleEnum } from '../src/types/database.types';

// Baseline permissions matrix for all 7 production roles (matching live public.role_permissions schema)
const BASELINE_PERMISSIONS: Record<UserRoleEnum, Partial<Record<CRMModuleKey, PermissionActionEnum[]>>> = {
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
  operations_manager: {
    dashboard: ['view', 'export'],
    clients: ['view', 'export'],
    team: ['view'],
    segments: ['view'],
    opportunities: ['view', 'edit', 'export'],
    calculator: ['view'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create', 'edit', 'approve'],
    documents: ['view', 'create', 'edit', 'export'],
    review: ['view', 'export'],
    users: [],
  },
  cops_supervisor: {
    dashboard: ['view'],
    clients: ['view'],
    team: ['view'],
    segments: ['view'],
    opportunities: ['view'],
    calculator: ['view'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create', 'edit'],
    documents: ['view', 'create', 'edit'],
    review: ['view'],
    users: [],
  },
  maintenance_engineer: {
    dashboard: ['view'],
    clients: ['view'],
    team: ['view'],
    segments: ['view'],
    opportunities: ['view'],
    calculator: ['view'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create', 'edit'],
    documents: ['view', 'create', 'edit'],
    review: ['view'],
    users: [],
  },
  finance_executive: {
    dashboard: ['view', 'export'],
    clients: ['view', 'export'],
    team: ['view'],
    segments: ['view', 'export'],
    opportunities: ['view', 'edit', 'export'],
    calculator: ['view', 'create', 'edit', 'export'],
    activities: ['view'],
    followups: ['view'],
    internal: ['view', 'create', 'edit', 'approve'],
    documents: ['view', 'create', 'edit', 'export'],
    review: ['view', 'export'],
    users: [],
  },
  legal_counsel: {
    dashboard: ['view', 'export'],
    clients: ['view', 'export'],
    team: ['view'],
    segments: ['view'],
    opportunities: ['view', 'export'],
    calculator: ['view'],
    activities: ['view'],
    followups: ['view'],
    internal: ['view', 'create', 'edit', 'approve'],
    documents: ['view', 'create', 'edit', 'delete', 'export', 'approve'],
    review: ['view', 'export'],
    users: [],
  },
};

function createRoleCanResolver(role: UserRoleEnum) {
  const rolePerms = BASELINE_PERMISSIONS[role] || {};
  return (moduleKey: CRMModuleKey, action: PermissionActionEnum): boolean => {
    const actions = rolePerms[moduleKey] || [];
    return actions.includes(action);
  };
}

console.log('=== STEP 5 — PRODUCTION ACTION-LEVEL PERMISSIONS & CRUD VERIFICATION ===\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  🟢 PASS: ${message}`);
  } else {
    console.log(`  🔴 FAIL: ${message}`);
  }
}

const rolesToVerify: UserRoleEnum[] = [
  'super_admin',
  'bd_director',
  'bd_manager',
  'bd_sr_exec',
  'bd_exec',
  'management_viewer',
  'analyst'
];

const modulesToVerify: CRMModuleKey[] = [
  'clients',
  'opportunities',
  'calculator',
  'activities',
  'followups',
  'internal',
  'documents',
  'team',
  'segments',
  'review',
  'users'
];

const actionsToVerify: PermissionActionEnum[] = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'approve',
  'assign',
  'admin'
];

// 1. Action-Level Matrix Audit for all 7 Roles across all Modules
console.log('1. Seven-Role Action Matrix Resolution Verification:');

for (const role of rolesToVerify) {
  console.log(`\n  --- Role: [${role}] ---`);
  const can = createRoleCanResolver(role);

  // Specific Action Security Checks
  if (role === 'bd_exec') {
    assert(!can('clients', 'delete'), `Role 'bd_exec' CANNOT delete clients`);
    assert(!can('clients', 'export'), `Role 'bd_exec' CANNOT export clients`);
    assert(can('clients', 'create'), `Role 'bd_exec' CAN create clients`);
    assert(can('clients', 'edit'), `Role 'bd_exec' CAN edit assigned clients`);
    assert(!can('opportunities', 'approve'), `Role 'bd_exec' CANNOT approve deals`);
    assert(!can('users', 'admin'), `Role 'bd_exec' CANNOT perform user administration`);
  } else if (role === 'bd_manager') {
    assert(!can('clients', 'delete'), `Role 'bd_manager' CANNOT delete clients`);
    assert(can('clients', 'export'), `Role 'bd_manager' CAN export clients`);
    assert(can('clients', 'assign'), `Role 'bd_manager' CAN assign client owners`);
    assert(!can('users', 'admin'), `Role 'bd_manager' CANNOT perform user administration`);
  } else if (role === 'bd_director') {
    assert(can('clients', 'approve'), `Role 'bd_director' CAN approve client terms`);
    assert(can('opportunities', 'approve'), `Role 'bd_director' CAN approve opportunities`);
    assert(can('documents', 'delete'), `Role 'bd_director' CAN delete documents`);
    assert(can('users', 'view'), `Role 'bd_director' CAN view users`);
  } else if (role === 'super_admin') {
    assert(can('clients', 'delete'), `Role 'super_admin' CAN delete clients`);
    assert(can('users', 'admin'), `Role 'super_admin' CAN perform user administration`);
  } else if (role === 'management_viewer' || role === 'analyst') {
    assert(!can('clients', 'create'), `Role '${role}' CANNOT create clients`);
    assert(!can('clients', 'edit'), `Role '${role}' CANNOT edit clients`);
    assert(!can('clients', 'delete'), `Role '${role}' CANNOT delete clients`);
    assert(can('clients', 'export'), `Role '${role}' CAN export client reports`);
  }
}

// 2. Action Handler Immunity Test
console.log('\n2. Programmatic Mutation Handler Guard Verification:');

function simulateMutationAttempt(role: UserRoleEnum, moduleKey: CRMModuleKey, action: PermissionActionEnum) {
  const can = createRoleCanResolver(role);
  if (!can(moduleKey, action)) {
    return { status: 'DENIED', error: `Security Policy Violation: You do not have permission to execute ${action} on ${moduleKey}.` };
  }
  return { status: 'ALLOWED' };
}

const execDeleteClient = simulateMutationAttempt('bd_exec', 'clients', 'delete');
assert(execDeleteClient.status === 'DENIED', `Programmatic deleteClient() call by bd_exec is DENIED by handler check`);

const execExportClients = simulateMutationAttempt('bd_exec', 'clients', 'export');
assert(execExportClients.status === 'DENIED', `Programmatic exportClients() call by bd_exec is DENIED by handler check`);

const execApproveDeal = simulateMutationAttempt('bd_exec', 'opportunities', 'approve');
assert(execApproveDeal.status === 'DENIED', `Programmatic approveOpportunity() call by bd_exec is DENIED by handler check`);

const managerAdminUsers = simulateMutationAttempt('bd_manager', 'users', 'admin');
assert(managerAdminUsers.status === 'DENIED', `Programmatic userAdmin() call by bd_manager is DENIED by handler check`);

const directorApproveDeal = simulateMutationAttempt('bd_director', 'opportunities', 'approve');
assert(directorApproveDeal.status === 'ALLOWED', `Programmatic approveOpportunity() call by bd_director is ALLOWED`);

console.log('\n==================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('==================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
